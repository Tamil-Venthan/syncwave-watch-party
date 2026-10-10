import { RoomData, UserProfile, VideoItem, ChatMessage } from '../types';

type MessageHandler = (type: string, payload: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private isConnecting = false;
  private reconnectTimer: any = null;
  private currentRoomId: string | null = null;
  private currentUser: UserProfile | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isWsConnected = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('syncwave_local_mesh');
        this.broadcastChannel.onmessage = (event) => {
          const { type, payload, roomId } = event.data || {};
          // Only trigger if in the same room
          if (roomId === this.currentRoomId) {
            this.notifyHandlers(type, payload);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }
  }

  public subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private notifyHandlers(type: string, payload: any) {
    this.handlers.forEach((h) => {
      try {
        h(type, payload);
      } catch (err) {
        console.error('Handler error:', err);
      }
    });
  }

  public connect(roomId: string, user: UserProfile, password?: string) {
    this.currentRoomId = roomId;
    this.currentUser = user;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Send join message if already connected
      this.send('join_room', { user, password });
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.isWsConnected = true;
        this.notifyHandlers('connection_status', { connected: true, mode: 'websocket' });
        this.send('join_room', { user, password });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyHandlers(data.type, data.payload);
        } catch (err) {
          console.error('Failed to parse WS payload', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.isWsConnected = false;
        this.notifyHandlers('connection_status', { connected: false, mode: 'broadcast_fallback' });
        // Attempt reconnect in 3s
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          if (this.currentRoomId && this.currentUser) {
            this.connect(this.currentRoomId, this.currentUser);
          }
        }, 3000);
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.isWsConnected = false;
        // Fallback to local mesh
        this.notifyHandlers('connection_status', { connected: true, mode: 'broadcast_fallback' });
      };
    } catch (e) {
      this.isConnecting = false;
      this.isWsConnected = false;
      this.notifyHandlers('connection_status', { connected: true, mode: 'broadcast_fallback' });
    }
  }

  public send(type: string, payload: any) {
    const message = {
      type,
      roomId: this.currentRoomId,
      payload
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }

    // Always mirror to BroadcastChannel so multiple tabs or local peers can sync even if offline/Vercel serverless
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (err) {
        // ignore
      }
    }
  }

  public disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentRoomId = null;
    this.currentUser = null;
  }

  public isConnected(): boolean {
    return this.isWsConnected || Boolean(this.broadcastChannel);
  }
}

export const socket = new SocketClient();
