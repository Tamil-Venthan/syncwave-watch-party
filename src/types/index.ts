export interface AvatarConfig {
  bg: string;
  face: string;
  accessory: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: AvatarConfig;
  status?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
}

export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration?: number;
  addedBy: {
    id: string;
    username: string;
  };
  addedAt: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
  playbackRate: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: AvatarConfig;
  text: string;
  timestamp: number;
  type: 'chat' | 'system' | 'reaction';
}

export interface RoomData {
  id: string;
  name: string;
  isPrivate: boolean;
  hasPassword?: boolean;
  hostId: string;
  hostOnlyControl: boolean;
  currentVideo: VideoItem;
  playerState: PlayerState;
  queue: VideoItem[];
  participants: UserProfile[];
  messages: ChatMessage[];
  watchHistory: VideoItem[];
}

export interface ReactionEvent {
  id: string;
  emoji: string;
  userName: string;
  x: number;
  y: number;
}

export interface WatchHistoryEntry {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration?: number;
  watchedAt: number;
  watchedWith: string[];
  roomName: string;
  watchSeconds?: number;
}
