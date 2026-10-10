import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  UserProfile,
  RoomData,
  VideoItem,
  ChatMessage,
  ReactionEvent,
  WatchHistoryEntry,
  PlayerState
} from '../types';
import { socket } from '../services/socket';
import { webrtcVoice } from '../services/webrtc';
import { extractYouTubeId, getYouTubeThumbnail } from '../utils/youtube';

interface PartyContextType {
  currentUser: UserProfile;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  currentRoom: RoomData | null;
  connectionStatus: { connected: boolean; mode: string };
  isHost: boolean;
  canControlPlayback: boolean;
  createRoom: (params: {
    id?: string;
    name: string;
    isPrivate: boolean;
    password?: string;
    hostOnlyControl: boolean;
    initialVideoId?: string;
  }) => Promise<string>;
  joinRoom: (roomId: string, password?: string) => void;
  // Player Controls
  syncPlayerState: (isPlaying: boolean, currentTime: number, playbackRate?: number) => void;
  changeCurrentVideo: (video: VideoItem) => void;
  loadVideoByUrlOrId: (urlOrId: string, title?: string) => Promise<boolean>;
  // Queue
  addToQueue: (video: VideoItem) => void;
  removeFromQueue: (videoId: string) => void;
  playNextInQueue: () => void;
  // Chat & Reactions
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  reactions: ReactionEvent[];
  triggerReaction: (emoji: string) => void;
  // Voice Chat
  isVoiceActive: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  speakingUsers: Set<string>;
  toggleVoiceChat: () => Promise<void>;
  toggleMute: () => void;
  toggleDeafen: () => void;
  setPeerVolume: (userId: string, volume: number) => void;
  // Watch History
  watchHistory: WatchHistoryEntry[];
  addToWatchHistory: (video: VideoItem) => void;
  clearWatchHistory: () => void;
  // Room Settings
  updateRoomSettings: (settings: { hostOnlyControl?: boolean; transferHostId?: string }) => void;
  // UI states
  isCuratedPickerOpen: boolean;
  setIsCuratedPickerOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isCreateRoomModalOpen: boolean;
  setIsCreateRoomModalOpen: (open: boolean) => void;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  isVercelModalOpen: boolean;
  setIsVercelModalOpen: (open: boolean) => void;
}

const PartyContext = createContext<PartyContextType | null>(null);

const DEFAULT_USER_KEY = 'syncwave_user_profile';
const WATCH_HISTORY_KEY = 'syncwave_watch_history';

// Standard high-reliability default video
const INITIAL_DEFAULT_VIDEO: VideoItem = {
  id: 'def-1',
  youtubeId: 'jfKfPfyJRdk',
  title: 'lofi hip hop radio 📚 - beats to relax/study to',
  thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
  duration: 0,
  addedBy: { id: 'system', username: 'SyncWave' },
  addedAt: Date.now()
};

function createDefaultRoom(roomId: string, user: UserProfile): RoomData {
  return {
    id: roomId,
    name: roomId === 'lounge' ? 'Chill Lounge' : `Room #${roomId.slice(0, 6)}`,
    isPrivate: false,
    hostId: user.id,
    hostOnlyControl: false,
    currentVideo: { ...INITIAL_DEFAULT_VIDEO },
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
        title: 'lofi hip hop radio - beats to sleep/chill to',
        thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
        duration: 0,
        addedBy: { id: 'system', username: 'SyncWave' },
        addedAt: Date.now() - 30000
      },
      {
        id: 'q-2',
        youtubeId: '1nueFGvd2rE',
        title: 'Synthwave Radio - Chill synth / retro vibes',
        thumbnail: 'https://img.youtube.com/vi/1nueFGvd2rE/hqdefault.jpg',
        duration: 0,
        addedBy: { id: 'system', username: 'SyncWave' },
        addedAt: Date.now() - 10000
      }
    ],
    participants: [user],
    messages: [
      {
        id: 'msg-welcome',
        senderId: 'system',
        senderName: 'SyncWave Bot',
        senderAvatar: { bg: 'linear-gradient(135deg, #f43f5e, #be123c)', face: 'smile', accessory: 'headphones' },
        text: 'Welcome to the watch party! Hit Play, paste any YouTube link, or pick from the catalog to watch in sync with friends.',
        timestamp: Date.now(),
        type: 'system'
      }
    ],
    watchHistory: [{ ...INITIAL_DEFAULT_VIDEO }]
  };
}

function loadInitialProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return {
      id: 'usr_init',
      username: 'PartyViewer',
      avatar: { bg: 'linear-gradient(135deg, #f43f5e, #be123c)', face: 'sunglasses', accessory: 'headphones' },
      status: 'Ready to watch'
    };
  }

  try {
    const saved = localStorage.getItem(DEFAULT_USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }

  const randomId = 'usr_' + Math.random().toString(36).substring(2, 9);
  const defaultNames = ['NeonFalcon', 'CosmicRider', 'VelvetPanda', 'CyberSamurai', 'StarGazer', 'PixelFox'];
  const username = defaultNames[Math.floor(Math.random() * defaultNames.length)];
  const profile: UserProfile = {
    id: randomId,
    username,
    avatar: {
      bg: 'linear-gradient(135deg, #f43f5e, #be123c)',
      face: 'sunglasses',
      accessory: 'headphones'
    },
    status: 'Vibing'
  };

  try {
    localStorage.setItem(DEFAULT_USER_KEY, JSON.stringify(profile));
  } catch (e) {
    // ignore
  }
  return profile;
}

function loadInitialHistory(): WatchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(WATCH_HISTORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return [];
}

export const PartyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(loadInitialProfile);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(() => createDefaultRoom('lounge', loadInitialProfile()));
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      senderId: 'system',
      senderName: 'SyncWave Bot',
      senderAvatar: { bg: 'linear-gradient(135deg, #f43f5e, #be123c)', face: 'smile', accessory: 'headphones' },
      text: 'Welcome to the watch party! Click to start watching or pick a video from the catalog.',
      timestamp: Date.now(),
      type: 'system'
    }
  ]);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>(loadInitialHistory);
  const [connectionStatus, setConnectionStatus] = useState({ connected: true, mode: 'connecting' });

  // Voice state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  // Modal triggers
  const [isCuratedPickerOpen, setIsCuratedPickerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);

  // References for WebRTC and Room ID
  const activeRoomIdRef = useRef<string>('lounge');
  const lastRecordedVideoId = useRef<string>('');

  // Save profile to localStorage
  const updateCurrentUser = useCallback((updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(DEFAULT_USER_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      socket.send('profile_update', updated);
      return updated;
    });
  }, []);

  // Save history to localStorage
  const addToWatchHistory = useCallback(
    (video: VideoItem) => {
      if (!video.youtubeId || video.youtubeId === lastRecordedVideoId.current) return;
      lastRecordedVideoId.current = video.youtubeId;

      const entry: WatchHistoryEntry = {
        id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        youtubeId: video.youtubeId,
        title: video.title,
        thumbnail: video.thumbnail || getYouTubeThumbnail(video.youtubeId),
        duration: video.duration,
        watchedAt: Date.now(),
        watchedWith: currentRoom?.participants?.map((p) => p.username) || [currentUser.username],
        roomName: currentRoom?.name || 'Watch Party'
      };

      setWatchHistory((prev) => {
        const filtered = prev.filter((item) => item.youtubeId !== video.youtubeId);
        const next = [entry, ...filtered].slice(0, 100);
        try {
          localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(next));
        } catch (e) {
          // ignore
        }
        return next;
      });
    },
    [currentRoom, currentUser.username]
  );

  const clearWatchHistory = useCallback(() => {
    setWatchHistory([]);
    try {
      localStorage.removeItem(WATCH_HISTORY_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  // Join Room
  const joinRoom = useCallback(
    (roomId: string, password?: string) => {
      activeRoomIdRef.current = roomId;
      if (typeof window !== 'undefined') {
        window.location.hash = roomId;
      }

      // Optimistically ensure currentRoom is initialized immediately
      setCurrentRoom((prev) => {
        if (!prev || prev.id !== roomId) {
          return createDefaultRoom(roomId, currentUser);
        }
        return prev;
      });

      socket.connect(roomId, currentUser, password);
    },
    [currentUser]
  );

  // Voice Chat Handlers
  const toggleVoiceChat = useCallback(async () => {
    if (isVoiceActive) {
      webrtcVoice.cleanup();
      setIsVoiceActive(false);
      setSpeakingUsers(new Set());
    } else {
      webrtcVoice.init(currentUser.id);
      const success = await webrtcVoice.startMicrophone();
      if (success) {
        setIsVoiceActive(true);
        if (currentRoom) {
          currentRoom.participants.forEach((p) => {
            if (p.id !== currentUser.id) {
              webrtcVoice.connectToPeer(p.id);
            }
          });
        }
      }
    }
  }, [isVoiceActive, currentUser.id, currentRoom]);

  const toggleMute = useCallback(() => {
    const muted = webrtcVoice.toggleMute();
    setIsMuted(muted);
  }, []);

  const toggleDeafen = useCallback(() => {
    const deafened = webrtcVoice.toggleDeafen();
    setIsDeafened(deafened);
  }, []);

  const setPeerVolume = useCallback((userId: string, volume: number) => {
    webrtcVoice.setPeerVolume(userId, volume);
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    const unsubscribe = socket.subscribe((type, payload) => {
      switch (type) {
        case 'connection_status':
          setConnectionStatus(payload);
          break;

        case 'room_state': {
          const room = payload.room as RoomData;
          setCurrentRoom(room);
          setMessages(room.messages || []);
          if (room.currentVideo) {
            addToWatchHistory(room.currentVideo);
          }
          break;
        }

        case 'user_joined': {
          const { user, hostId } = payload;
          setCurrentRoom((prev) => {
            if (!prev) return prev;
            const exists = prev.participants.some((p) => p.id === user.id);
            const participants = exists
              ? prev.participants.map((p) => (p.id === user.id ? user : p))
              : [...prev.participants, user];
            return {
              ...prev,
              hostId: hostId || prev.hostId,
              participants
            };
          });

          if (isVoiceActive && user.id !== currentUser.id) {
            webrtcVoice.connectToPeer(user.id);
          }
          break;
        }

        case 'user_left': {
          const { userId, newHostId } = payload;
          setCurrentRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              hostId: newHostId || prev.hostId,
              participants: prev.participants.filter((p) => p.id !== userId)
            };
          });
          webrtcVoice.removePeer(userId);
          break;
        }

        case 'user_updated': {
          const { user } = payload;
          setCurrentRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              participants: prev.participants.map((p) => (p.id === user.id ? user : p))
            };
          });
          break;
        }

        case 'player_sync': {
          setCurrentRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              playerState: {
                isPlaying: payload.isPlaying,
                currentTime: payload.currentTime,
                playbackRate: payload.playbackRate || 1,
                updatedAt: payload.updatedAt || Date.now()
              }
            };
          });
          break;
        }

        case 'video_changed': {
          const { video, playerState, queue } = payload;
          setCurrentRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              currentVideo: video,
              playerState: playerState || prev.playerState,
              queue: queue || prev.queue
            };
          });
          addToWatchHistory(video);
          break;
        }

        case 'queue_updated': {
          setCurrentRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              queue: payload.queue
            };
          });
          break;
        }

        case 'chat_message': {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
          break;
        }

        case 'reaction_trigger': {
          const reactionId = `rx-${Date.now()}-${Math.random()}`;
          const rx: ReactionEvent = {
            id: reactionId,
            emoji: payload.emoji,
            userName: payload.userName,
            x: payload.x,
            y: payload.y
          };
          setReactions((prev) => [...prev, rx]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== reactionId));
          }, 3500);
          break;
        }

        case 'voice_signal': {
          if (isVoiceActive) {
            const { fromUserId, signal } = payload;
            webrtcVoice.handleSignal(fromUserId, signal);
          }
          break;
        }

        case 'voice_state_updated': {
          const { userId, isSpeaking } = payload;
          setSpeakingUsers((prev) => {
            const next = new Set(prev);
            if (isSpeaking) {
              next.add(userId);
            } else {
              next.delete(userId);
            }
            return next;
          });
          break;
        }

        case 'room_settings_updated': {
          setCurrentRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              hostId: payload.hostId,
              hostOnlyControl: payload.hostOnlyControl
            };
          });
          break;
        }

        default:
          break;
      }
    });

    const unsubSpeaking = webrtcVoice.subscribeSpeaking((userId, isSpeaking) => {
      setSpeakingUsers((prev) => {
        const next = new Set(prev);
        if (isSpeaking) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    return () => {
      unsubscribe();
      unsubSpeaking();
    };
  }, [addToWatchHistory, currentUser.id, isVoiceActive]);

  // Initial Room Join on mount (either hash or default 'lounge')
  useEffect(() => {
    let initialRoomId = 'lounge';
    if (typeof window !== 'undefined' && window.location.hash) {
      const clean = window.location.hash.replace(/^#/, '').trim();
      if (clean) initialRoomId = clean;
    }
    joinRoom(initialRoomId);

    return () => {
      socket.disconnect();
      webrtcVoice.cleanup();
    };
  }, [joinRoom]);

  // Player Sync Actions with Optimistic Local Updates
  const syncPlayerState = useCallback((isPlaying: boolean, currentTime: number, playbackRate = 1) => {
    setCurrentRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        playerState: {
          isPlaying,
          currentTime,
          playbackRate,
          updatedAt: Date.now()
        }
      };
    });

    socket.send('player_sync', {
      isPlaying,
      currentTime,
      playbackRate
    });
  }, []);

  const changeCurrentVideo = useCallback((video: VideoItem) => {
    setCurrentRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentVideo: video,
        playerState: {
          isPlaying: true,
          currentTime: 0,
          updatedAt: Date.now(),
          playbackRate: 1
        }
      };
    });

    addToWatchHistory(video);
    socket.send('change_video', { video });
  }, [addToWatchHistory]);

  const loadVideoByUrlOrId = useCallback(
    async (urlOrId: string, customTitle?: string): Promise<boolean> => {
      const youtubeId = extractYouTubeId(urlOrId);
      if (!youtubeId) return false;

      const title = customTitle || `YouTube Video (${youtubeId})`;
      const newVideo: VideoItem = {
        id: `vid-${Date.now()}`,
        youtubeId,
        title,
        thumbnail: getYouTubeThumbnail(youtubeId),
        addedBy: {
          id: currentUser.id,
          username: currentUser.username
        },
        addedAt: Date.now()
      };

      changeCurrentVideo(newVideo);
      return true;
    },
    [changeCurrentVideo, currentUser]
  );

  // Queue Actions with Optimistic Local Updates
  const addToQueue = useCallback(
    (video: VideoItem) => {
      setCurrentRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          queue: [...prev.queue, video]
        };
      });
      socket.send('queue_add', { video });
    },
    []
  );

  const removeFromQueue = useCallback((videoId: string) => {
    setCurrentRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        queue: prev.queue.filter((v) => v.id !== videoId)
      };
    });
    socket.send('queue_remove', { videoId });
  }, []);

  const playNextInQueue = useCallback(() => {
    setCurrentRoom((prev) => {
      if (!prev || prev.queue.length === 0) return prev;
      const [nextVideo, ...restQueue] = prev.queue;
      addToWatchHistory(nextVideo);
      return {
        ...prev,
        currentVideo: nextVideo,
        queue: restQueue,
        playerState: {
          isPlaying: true,
          currentTime: 0,
          updatedAt: Date.now(),
          playbackRate: 1
        }
      };
    });
    socket.send('queue_play_next', {});
  }, [addToWatchHistory]);

  // Chat & Reaction Actions
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        text: text.trim(),
        timestamp: Date.now(),
        type: 'chat'
      };

      setMessages((prev) => [...prev, newMsg]);

      socket.send('chat_message', {
        text: text.trim(),
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar
      });
    },
    [currentUser]
  );

  const triggerReaction = useCallback(
    (emoji: string) => {
      const rxId = `rx-local-${Date.now()}`;
      setReactions((prev) => [
        ...prev,
        {
          id: rxId,
          emoji,
          userName: currentUser.username,
          x: Math.random() * 70 + 15,
          y: 85
        }
      ]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== rxId));
      }, 3500);

      socket.send('reaction_trigger', {
        emoji,
        userName: currentUser.username,
        x: Math.random() * 70 + 15,
        y: 85
      });
    },
    [currentUser.username]
  );

  // Room Creation
  const createRoom = useCallback(
    async (params: {
      id?: string;
      name: string;
      isPrivate: boolean;
      password?: string;
      hostOnlyControl: boolean;
      initialVideoId?: string;
    }): Promise<string> => {
      const generatedId = params.id || Math.random().toString(36).substring(2, 9);
      try {
        const res = await fetch('/api/rooms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        const data = await res.json();
        if (data.roomId) {
          joinRoom(data.roomId, params.password);
          return data.roomId;
        }
      } catch (e) {
        // Fallback locally
      }

      joinRoom(generatedId, params.password);
      return generatedId;
    },
    [joinRoom]
  );

  const updateRoomSettings = useCallback((settings: { hostOnlyControl?: boolean; transferHostId?: string }) => {
    setCurrentRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hostId: settings.transferHostId || prev.hostId,
        hostOnlyControl: settings.hostOnlyControl !== undefined ? settings.hostOnlyControl : prev.hostOnlyControl
      };
    });
    socket.send('room_settings', settings);
  }, []);

  const isHost = currentRoom?.hostId === currentUser.id;
  const canControlPlayback = !currentRoom?.hostOnlyControl || isHost;

  return (
    <PartyContext.Provider
      value={{
        currentUser,
        updateCurrentUser,
        currentRoom,
        connectionStatus,
        isHost,
        canControlPlayback,
        createRoom,
        joinRoom,
        syncPlayerState,
        changeCurrentVideo,
        loadVideoByUrlOrId,
        addToQueue,
        removeFromQueue,
        playNextInQueue,
        messages,
        sendMessage,
        reactions,
        triggerReaction,
        isVoiceActive,
        isMuted,
        isDeafened,
        speakingUsers,
        toggleVoiceChat,
        toggleMute,
        toggleDeafen,
        setPeerVolume,
        watchHistory,
        addToWatchHistory,
        clearWatchHistory,
        updateRoomSettings,
        isCuratedPickerOpen,
        setIsCuratedPickerOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isCreateRoomModalOpen,
        setIsCreateRoomModalOpen,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        isVercelModalOpen,
        setIsVercelModalOpen
      }}
    >
      {children}
    </PartyContext.Provider>
  );
};

export const useParty = () => {
  const context = useContext(PartyContext);
  if (!context) {
    throw new Error('useParty must be used within a PartyProvider');
  }
  return context;
};
