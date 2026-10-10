import { socket } from './socket';

interface PeerConnectionData {
  pc: RTCPeerConnection;
  audioElement: HTMLAudioElement;
  stream?: MediaStream;
}

type SpeakingCallback = (userId: string, isSpeaking: boolean) => void;
type VoiceStatusCallback = (status: {
  isSupported: boolean;
  hasPermission: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  volumeLevel: number;
  error?: string;
}) => void;

class WebRTCVoiceManager {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private peers: Map<string, PeerConnectionData> = new Map();
  private currentUserId: string | null = null;
  private isMuted: boolean = false;
  private isDeafened: boolean = false;
  private isSpeaking: boolean = false;
  private speakingCallbacks: Set<SpeakingCallback> = new Set();
  private statusCallbacks: Set<VoiceStatusCallback> = new Set();
  private lastSpeakingNotification: number = 0;

  // Public STUN servers for WebRTC NAT traversal
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  public init(userId: string) {
    this.currentUserId = userId;
  }

  public subscribeSpeaking(cb: SpeakingCallback) {
    this.speakingCallbacks.add(cb);
    return () => {
      this.speakingCallbacks.delete(cb);
    };
  }

  public subscribeStatus(cb: VoiceStatusCallback) {
    this.statusCallbacks.add(cb);
    return () => {
      this.statusCallbacks.delete(cb);
    };
  }

  private notifyStatus(error?: string) {
    this.statusCallbacks.forEach((cb) => {
      cb({
        isSupported: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
        hasPermission: !!this.localStream,
        isMuted: this.isMuted,
        isDeafened: this.isDeafened,
        volumeLevel: 0,
        error
      });
    });
  }

  public async startMicrophone(): Promise<boolean> {
    if (this.localStream) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this.localStream = stream;
      this.setupAudioAnalysis(stream);
      this.notifyStatus();

      // Add tracks to any existing peer connections
      this.peers.forEach(({ pc }) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      });

      return true;
    } catch (err: any) {
      console.warn('Microphone access denied or unavailable:', err);
      this.notifyStatus(err.message || 'Microphone access denied');
      return false;
    }
  }

  public stopMicrophone() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.notifyStatus();
  }

  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        if (!this.analyser || !this.localStream) return;
        this.analyser.getByteFrequencyData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const speakingNow = avg > 18 && !this.isMuted;

        if (speakingNow !== this.isSpeaking) {
          this.isSpeaking = speakingNow;
          if (this.currentUserId) {
            this.speakingCallbacks.forEach((cb) => cb(this.currentUserId!, this.isSpeaking));
            // Rate limit network voice broadcasts
            const now = Date.now();
            if (now - this.lastSpeakingNotification > 300) {
              this.lastSpeakingNotification = now;
              socket.send('voice_state', {
                isMuted: this.isMuted,
                isDeafened: this.isDeafened,
                isSpeaking: this.isSpeaking
              });
            }
          }
        }

        this.animFrameId = requestAnimationFrame(checkAudioLevel);
      };

      this.animFrameId = requestAnimationFrame(checkAudioLevel);
    } catch (e) {
      console.warn('AudioContext setup error:', e);
    }
  }

  public toggleMute(): boolean {
    if (!this.localStream) return false;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });
    this.notifyStatus();
    socket.send('voice_state', {
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
      isSpeaking: false
    });
    return this.isMuted;
  }

  public toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened;
    // Mute self when deafened automatically
    if (this.isDeafened && !this.isMuted && this.localStream) {
      this.toggleMute();
    }
    // Mute/unmute all peer audio elements
    this.peers.forEach(({ audioElement }) => {
      audioElement.muted = this.isDeafened;
    });
    this.notifyStatus();
    return this.isDeafened;
  }

  public setPeerVolume(peerId: string, volume: number) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // WebRTC Mesh Signaling
  public async handleSignal(fromUserId: string, signal: any) {
    let peer = this.peers.get(fromUserId);
    if (!peer) {
      peer = this.createPeerConnection(fromUserId);
    }

    const { pc } = peer;

    if (signal.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.send('voice_signal', {
        targetUserId: fromUserId,
        signal: answer
      });
    } else if (signal.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
    } else if (signal.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (e) {
        console.warn('Error adding ICE candidate', e);
      }
    }
  }

  public async connectToPeer(remoteUserId: string) {
    if (this.peers.has(remoteUserId)) return;
    const peer = this.createPeerConnection(remoteUserId);
    try {
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);
      socket.send('voice_signal', {
        targetUserId: remoteUserId,
        signal: offer
      });
    } catch (e) {
      console.warn('Failed to create offer for peer', remoteUserId, e);
    }
  }

  private createPeerConnection(remoteUserId: string): PeerConnectionData {
    const pc = new RTCPeerConnection(this.rtcConfig);
    const audioElement = new Audio();
    audioElement.autoplay = true;
    audioElement.muted = this.isDeafened;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send('voice_signal', {
          targetUserId: remoteUserId,
          signal: { candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      audioElement.srcObject = event.streams[0];
    };

    const peerData: PeerConnectionData = { pc, audioElement };
    this.peers.set(remoteUserId, peerData);
    return peerData;
  }

  public removePeer(remoteUserId: string) {
    const peer = this.peers.get(remoteUserId);
    if (peer) {
      peer.pc.close();
      peer.audioElement.srcObject = null;
      peer.audioElement.remove();
      this.peers.delete(remoteUserId);
    }
  }

  public cleanup() {
    this.stopMicrophone();
    this.peers.forEach(({ pc, audioElement }) => {
      pc.close();
      audioElement.srcObject = null;
      audioElement.remove();
    });
    this.peers.clear();
  }
}

export const webrtcVoice = new WebRTCVoiceManager();
