import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());

// In-memory Room State for real-time synchronization
interface UserProfile {
  id: string;
  username: string;
  avatar: {
    bg: string;
    face: string;
    accessory: string;
  };
  status?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
}

interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration: number;
  addedBy: { id: string; username: string };
  addedAt: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: UserProfile['avatar'];
  text: string;
  timestamp: number;
  type: 'chat' | 'system' | 'reaction';
}

interface RoomState {
  id: string;
  name: string;
  isPrivate: boolean;
  password?: string;
  hostId: string;
  hostOnlyControl: boolean;
  currentVideo: VideoItem;
  playerState: {
    isPlaying: boolean;
    currentTime: number;
    updatedAt: number;
    playbackRate: number;
  };
  queue: VideoItem[];
  participants: Map<string, { ws: WebSocket; profile: UserProfile }>;
  messages: ChatMessage[];
  watchHistory: VideoItem[];
  createdAt: number;
}

const rooms = new Map<string, RoomState>();

// Default initial video
const DEFAULT_VIDEO: VideoItem = {
  id: 'def-1',
  youtubeId: 'jfKfPfyJRdk', // lofi hip hop radio - beats to relax/study to
  title: 'lofi hip hop radio 📚 - beats to relax/study to',
  thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
  duration: 0,
  addedBy: { id: 'system', username: 'SyncWave' },
  addedAt: Date.now()
};

function getOrCreateRoom(roomId: string, name?: string, isPrivate = false, password?: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      name: name || `Room ${roomId.slice(0, 4)}`,
      isPrivate: Boolean(isPrivate),
      password: password || '',
      hostId: '',
      hostOnlyControl: false,
      currentVideo: { ...DEFAULT_VIDEO },
      playerState: {
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now(),
        playbackRate: 1
      },
      queue: [
        {
          id: 'q-1',
          youtubeId: '5qap5aO4i9A',
          title: 'Lofi Hip Hop Radio - Beats to Sleep/Chill to',
          thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
          duration: 0,
          addedBy: { id: 'system', username: 'SyncWave' },
          addedAt: Date.now() - 50000
        },
        {
          id: 'q-2',
          youtubeId: '1nueFGvd2rE',
          title: 'Synthwave Radio - Chill synth / retro vibes',
          thumbnail: 'https://img.youtube.com/vi/1nueFGvd2rE/hqdefault.jpg',
          duration: 0,
          addedBy: { id: 'system', username: 'SyncWave' },
          addedAt: Date.now() - 20000
        }
      ],
      participants: new Map(),
      messages: [
        {
          id: 'msg-welcome',
          senderId: 'system',
          senderName: 'SyncWave Bot',
          senderAvatar: { bg: '#e11d48', face: 'smile', accessory: 'headphones' },
          text: 'Welcome to the watch party! Paste any YouTube link or pick from the queue to start watching together.',
          timestamp: Date.now(),
          type: 'system'
        }
      ],
      watchHistory: [{ ...DEFAULT_VIDEO }],
      createdAt: Date.now()
    };
    rooms.set(roomId, room);
  }
  return room;
}

// REST API Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/rooms', (_req: Request, res: Response) => {
  const publicRooms = Array.from(rooms.values())
    .filter(r => !r.isPrivate)
    .map(r => ({
      id: r.id,
      name: r.name,
      participantCount: r.participants.size,
      currentVideo: r.currentVideo,
      isPlaying: r.playerState.isPlaying,
      createdAt: r.createdAt
    }));
  res.json({ rooms: publicRooms });
});

app.get('/api/rooms/:id', (req: Request, res: Response) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    hasPassword: Boolean(room.password),
    participantCount: room.participants.size,
    hostId: room.hostId,
    hostOnlyControl: room.hostOnlyControl,
    currentVideo: room.currentVideo,
    playerState: room.playerState,
    queue: room.queue
  });
});

app.post('/api/rooms/create', (req: Request, res: Response) => {
  const { name, isPrivate, password, hostOnlyControl, initialVideoId } = req.body;
  const customId = (req.body.id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const id = customId || Math.random().toString(36).substring(2, 9);
  
  const room = getOrCreateRoom(id, name || `Room ${id}`, isPrivate, password);
  room.hostOnlyControl = Boolean(hostOnlyControl);
  
  if (initialVideoId) {
    room.currentVideo = {
      id: `vid-${Date.now()}`,
      youtubeId: initialVideoId,
      title: req.body.initialVideoTitle || 'Featured Video',
      thumbnail: `https://img.youtube.com/vi/${initialVideoId}/hqdefault.jpg`,
      duration: 0,
      addedBy: { id: 'host', username: 'Host' },
      addedAt: Date.now()
    };
  }

  res.json({
    success: true,
    roomId: room.id,
    name: room.name,
    isPrivate: room.isPrivate
  });
});

// WebSocket Server for Real-Time Sync & WebRTC Signaling
const wss = new WebSocketServer({ noServer: true });

function broadcastToRoom(roomId: string, message: object, excludeSenderId?: string | null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const [userId, { ws }] of room.participants.entries()) {
    if (excludeSenderId && userId === excludeSenderId) continue;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket, req) => {
  let currentUserId: string | null = null;
  let currentRoomId: string | null = null;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type, roomId, payload } = msg;

      switch (type) {
        case 'join_room': {
          const { user, password } = payload;
          const room = getOrCreateRoom(roomId);

          if (room.isPrivate && room.password && room.password !== password) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Incorrect room password' } }));
            return;
          }

          currentUserId = user.id;
          currentRoomId = roomId;

          // If no host, assign the first joiner as host
          if (!room.hostId || !room.participants.has(room.hostId)) {
            room.hostId = user.id;
          }

          room.participants.set(user.id, { ws, profile: user });

          // Send full current room state to joining client
          const participantsList = Array.from(room.participants.values()).map(p => p.profile);
          ws.send(JSON.stringify({
            type: 'room_state',
            payload: {
              room: {
                id: room.id,
                name: room.name,
                isPrivate: room.isPrivate,
                hostId: room.hostId,
                hostOnlyControl: room.hostOnlyControl,
                currentVideo: room.currentVideo,
                playerState: room.playerState,
                queue: room.queue,
                participants: participantsList,
                messages: room.messages.slice(-50),
                watchHistory: room.watchHistory
              }
            }
          }));

          // Broadcast user_joined to others
          broadcastToRoom(roomId, {
            type: 'user_joined',
            payload: { user, hostId: room.hostId }
          }, user.id);

          // Add system message
          const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}-${Math.random()}`,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: { bg: '#64748b', face: 'smile', accessory: 'none' },
            text: `${user.username} joined the party`,
            timestamp: Date.now(),
            type: 'system'
          };
          room.messages.push(sysMsg);
          broadcastToRoom(roomId, { type: 'chat_message', payload: sysMsg });
          break;
        }

        case 'player_sync': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          // Check permissions if host-only control is enabled
          if (room.hostOnlyControl && room.hostId !== currentUserId) {
            ws.send(JSON.stringify({
              type: 'sync_denied',
              payload: { message: 'Only the host has playback controls in this room' }
            }));
            return;
          }

          const { isPlaying, currentTime, playbackRate } = payload;
          room.playerState = {
            isPlaying: Boolean(isPlaying),
            currentTime: Number(currentTime) || 0,
            updatedAt: Date.now(),
            playbackRate: Number(playbackRate) || 1
          };

          broadcastToRoom(currentRoomId, {
            type: 'player_sync',
            payload: {
              ...room.playerState,
              triggeredBy: currentUserId
            }
          }, currentUserId);
          break;
        }

        case 'change_video': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          if (room.hostOnlyControl && room.hostId !== currentUserId) {
            ws.send(JSON.stringify({
              type: 'sync_denied',
              payload: { message: 'Only the host can change videos' }
            }));
            return;
          }

          const { video } = payload;
          room.currentVideo = video;
          room.playerState = {
            isPlaying: true,
            currentTime: 0,
            updatedAt: Date.now(),
            playbackRate: 1
          };

          // Record in watch history
          if (!room.watchHistory.some(v => v.youtubeId === video.youtubeId)) {
            room.watchHistory.unshift(video);
          }

          broadcastToRoom(currentRoomId, {
            type: 'video_changed',
            payload: {
              video: room.currentVideo,
              playerState: room.playerState,
              triggeredBy: currentUserId
            }
          });

          // System message
          const sender = room.participants.get(currentUserId || '')?.profile.username || 'Someone';
          const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: { bg: '#3b82f6', face: 'smile', accessory: 'none' },
            text: `${sender} played "${video.title}"`,
            timestamp: Date.now(),
            type: 'system'
          };
          room.messages.push(sysMsg);
          broadcastToRoom(currentRoomId, { type: 'chat_message', payload: sysMsg });
          break;
        }

        case 'queue_add': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const { video } = payload;
          room.queue.push(video);

          broadcastToRoom(currentRoomId, {
            type: 'queue_updated',
            payload: { queue: room.queue }
          });
          break;
        }

        case 'queue_remove': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const { videoId } = payload;
          room.queue = room.queue.filter(v => v.id !== videoId);

          broadcastToRoom(currentRoomId, {
            type: 'queue_updated',
            payload: { queue: room.queue }
          });
          break;
        }

        case 'queue_play_next': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room || room.queue.length === 0) return;

          const nextVideo = room.queue.shift()!;
          room.currentVideo = nextVideo;
          room.playerState = {
            isPlaying: true,
            currentTime: 0,
            updatedAt: Date.now(),
            playbackRate: 1
          };

          if (!room.watchHistory.some(v => v.youtubeId === nextVideo.youtubeId)) {
            room.watchHistory.unshift(nextVideo);
          }

          broadcastToRoom(currentRoomId, {
            type: 'video_changed',
            payload: {
              video: room.currentVideo,
              playerState: room.playerState,
              queue: room.queue
            }
          });
          break;
        }

        case 'chat_message': {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const newMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderId: currentUserId || 'anon',
            senderName: payload.senderName,
            senderAvatar: payload.senderAvatar,
            text: payload.text,
            timestamp: Date.now(),
            type: 'chat'
          };

          room.messages.push(newMsg);
          if (room.messages.length > 200) room.messages.shift();

          broadcastToRoom(currentRoomId, {
            type: 'chat_message',
            payload: newMsg
          });
          break;
        }

        case 'reaction_trigger': {
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            type: 'reaction_trigger',
            payload: {
              emoji: payload.emoji,
              userId: currentUserId,
              userName: payload.userName,
              x: payload.x || Math.random() * 80 + 10,
              y: payload.y || 80
            }
          });
          break;
        }

        case 'profile_update': {
          if (!currentRoomId || !currentUserId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const p = room.participants.get(currentUserId);
          if (p) {
            p.profile = { ...p.profile, ...payload };
            broadcastToRoom(currentRoomId, {
              type: 'user_updated',
              payload: { user: p.profile }
            });
          }
          break;
        }

        case 'room_settings': {
          if (!currentRoomId || !currentUserId) return;
          const room = rooms.get(currentRoomId);
          if (!room || room.hostId !== currentUserId) return;

          if (payload.hostOnlyControl !== undefined) {
            room.hostOnlyControl = Boolean(payload.hostOnlyControl);
          }
          if (payload.transferHostId && room.participants.has(payload.transferHostId)) {
            room.hostId = payload.transferHostId;
          }

          broadcastToRoom(currentRoomId, {
            type: 'room_settings_updated',
            payload: {
              hostId: room.hostId,
              hostOnlyControl: room.hostOnlyControl
            }
          });
          break;
        }

        // WebRTC Voice Chat Signaling
        case 'voice_signal': {
          if (!currentRoomId || !currentUserId) return;
          const { targetUserId, signal } = payload;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const target = room.participants.get(targetUserId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'voice_signal',
              payload: {
                fromUserId: currentUserId,
                signal
              }
            }));
          }
          break;
        }

        case 'voice_state': {
          if (!currentRoomId || !currentUserId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const p = room.participants.get(currentUserId);
          if (p) {
            p.profile.isMuted = payload.isMuted;
            p.profile.isDeafened = payload.isDeafened;
            p.profile.isSpeaking = payload.isSpeaking;

            broadcastToRoom(currentRoomId, {
              type: 'voice_state_updated',
              payload: {
                userId: currentUserId,
                isMuted: payload.isMuted,
                isDeafened: payload.isDeafened,
                isSpeaking: payload.isSpeaking
              }
            }, currentUserId);
          }
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentUserId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const leavingUser = room.participants.get(currentUserId)?.profile;
        room.participants.delete(currentUserId);

        // If host left, elect next participant as host
        if (room.hostId === currentUserId && room.participants.size > 0) {
          const nextHostId = Array.from(room.participants.keys())[0];
          room.hostId = nextHostId;
        }

        broadcastToRoom(currentRoomId, {
          type: 'user_left',
          payload: {
            userId: currentUserId,
            newHostId: room.hostId
          }
        });

        if (leavingUser) {
          const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: { bg: '#64748b', face: 'smile', accessory: 'none' },
            text: `${leavingUser.username} left the room`,
            timestamp: Date.now(),
            type: 'system'
          };
          room.messages.push(sysMsg);
          broadcastToRoom(currentRoomId, { type: 'chat_message', payload: sysMsg });
        }
      }
    }
  });
});

// Upgrade HTTP to WS
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Setup Vite middlewares in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`SyncWave server running on port ${port}`);
  });
}

startServer();
