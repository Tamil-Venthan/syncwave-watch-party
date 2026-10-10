import React, { useState } from 'react';
import { useParty } from '../context/PartyContext';
import { Avatar } from '../utils/avatar';
import {
  Radio,
  Share2,
  Copy,
  Check,
  Plus,
  History,
  Lock,
  Unlock,
  Headphones,
  Users,
  Settings,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentRoom,
    currentUser,
    setIsProfileModalOpen,
    setIsCreateRoomModalOpen,
    setIsHistoryModalOpen,
    setIsVercelModalOpen,
    isVoiceActive,
    speakingUsers
  } = useParty();

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const participantCount = currentRoom?.participants?.length || 1;

  return (
    <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-3 md:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm md:text-base tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              SyncWave
            </span>
          </div>
        </div>

        {/* Room Slug & Share Pill */}
        {currentRoom && (
          <div className="flex items-center gap-2 pl-3 md:pl-4 border-l border-neutral-800">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800/80 text-xs text-neutral-300 transition-colors cursor-pointer group"
              title="Click to copy invite link"
            >
              {currentRoom.isPrivate ? (
                <Lock className="w-3 h-3 text-rose-400" />
              ) : (
                <Unlock className="w-3 h-3 text-emerald-400" />
              )}
              <span className="font-semibold text-neutral-100 max-w-[100px] md:max-w-[160px] truncate">
                {currentRoom.name}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">#{currentRoom.id}</span>
              {copiedLink ? (
                <Check className="w-3 h-3 text-emerald-400 ml-1" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-500 group-hover:text-neutral-300 ml-1" />
              )}
            </button>

            {/* Live Participants Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-400 px-2 py-1 rounded-lg bg-neutral-900/50 border border-neutral-850">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium text-neutral-300">{participantCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Vercel Deploy Button */}
        <button
          onClick={() => setIsVercelModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Deploy site to Vercel"
        >
          <svg viewBox="0 0 75 65" className="w-3.5 h-3.5 fill-current">
            <polygon points="37.5,0 75,65 0,65" />
          </svg>
          <span>Vercel Deploy</span>
        </button>

        {/* Watch History Button */}
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="p-2 md:px-3 md:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          title="View & share watch history"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">History</span>
        </button>

        {/* Create Room Button */}
        <button
          onClick={() => setIsCreateRoomModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Room</span>
        </button>

        {/* User Profile Avatar Trigger */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
          title="Edit Profile & Avatar"
        >
          <Avatar
            config={currentUser.avatar}
            size="sm"
            isSpeaking={speakingUsers.has(currentUser.id)}
          />
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-neutral-200 leading-tight">
              {currentUser.username}
            </span>
            <span className="text-[10px] text-neutral-500 leading-tight truncate max-w-[80px]">
              {currentUser.status || 'Vibing'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
