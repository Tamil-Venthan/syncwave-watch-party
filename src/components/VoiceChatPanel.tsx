import React, { useState } from 'react';
import { useParty } from '../context/PartyContext';
import { Avatar } from '../utils/avatar';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Headphones,
  PhoneCall,
  PhoneOff,
  ShieldAlert,
  Crown,
  Volume1
} from 'lucide-react';

export const VoiceChatPanel: React.FC = () => {
  const {
    currentRoom,
    currentUser,
    isVoiceActive,
    isMuted,
    isDeafened,
    speakingUsers,
    toggleVoiceChat,
    toggleMute,
    toggleDeafen,
    setPeerVolume
  } = useParty();

  const [peerVolumes, setPeerVolumes] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'voice' | 'members'>('voice');

  const participants = currentRoom?.participants || [currentUser];

  const handleVolumeChange = (userId: string, val: number) => {
    setPeerVolumes((prev) => ({ ...prev, [userId]: val }));
    setPeerVolume(userId, val / 100);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Header Tabs */}
      <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('voice')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Voice Room ({isVoiceActive ? 'Active' : 'Standby'})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'members'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Members ({participants.length})
          </button>
        </div>

        {/* Voice Join/Leave Quick Button */}
        <button
          onClick={toggleVoiceChat}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md ${
            isVoiceActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
        >
          {isVoiceActive ? (
            <>
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Leave</span>
            </>
          ) : (
            <>
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Join Voice</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3">
        {activeTab === 'voice' ? (
          <div>
            {/* Voice Status Alert if not connected */}
            {!isVoiceActive && (
              <div className="p-3 mb-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-center">
                <Headphones className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                <p className="text-xs font-medium text-neutral-300">Spatial WebRTC Voice Mesh</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Click <span className="text-emerald-400 font-semibold">Join Voice</span> to talk live with friends while syncing video.
                </p>
              </div>
            )}

            {/* Grid of Voice Avatars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {participants.map((user) => {
                const isMe = user.id === currentUser.id;
                const isSpeaking = speakingUsers.has(user.id);
                const userMuted = isMe ? isMuted : user.isMuted;
                const vol = peerVolumes[user.id] ?? 80;

                return (
                  <div
                    key={user.id}
                    className={`relative p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
                      isSpeaking
                        ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                        : 'bg-neutral-950/50 border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    {/* Host Icon Badge */}
                    {user.id === currentRoom?.hostId && (
                      <span
                        className="absolute top-2 right-2 p-1 bg-amber-500/20 text-amber-400 rounded-md"
                        title="Room Host"
                      >
                        <Crown className="w-3 h-3" />
                      </span>
                    )}

                    {/* Avatar with speaking wave */}
                    <div className="my-1">
                      <Avatar
                        config={user.avatar}
                        size="md"
                        isSpeaking={isSpeaking}
                      />
                    </div>

                    {/* Name & Speaking indicator */}
                    <span className="text-xs font-medium text-neutral-200 truncate w-full mt-1.5">
                      {user.username} {isMe && '(You)'}
                    </span>

                    {/* User Status / Mood */}
                    <span className="text-[10px] text-neutral-500 truncate w-full">
                      {user.status || 'Chilling'}
                    </span>

                    {/* Mic status icon & Peer volume control */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {userMuted ? (
                        <span className="p-1 rounded-md bg-rose-500/10 text-rose-400 text-[10px]">
                          <MicOff className="w-3 h-3" />
                        </span>
                      ) : (
                        <span
                          className={`p-1 rounded-md text-[10px] ${
                            isSpeaking
                              ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          <Mic className="w-3 h-3" />
                        </span>
                      )}

                      {!isMe && isVoiceActive && (
                        <div className="flex items-center gap-1 bg-neutral-900 px-1.5 py-0.5 rounded-md border border-neutral-800">
                          <Volume1 className="w-2.5 h-2.5 text-neutral-400" />
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={vol}
                            onChange={(e) => handleVolumeChange(user.id, parseInt(e.target.value, 10))}
                            className="w-10 h-1 bg-neutral-700 rounded-lg appearance-none accent-emerald-500 cursor-pointer"
                            title={`Adjust ${user.username}'s volume`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Members List Tab */
          <div className="space-y-2">
            {participants.map((user) => {
              const isHost = user.id === currentRoom?.hostId;
              const isMe = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar config={user.avatar} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-neutral-200">
                          {user.username}
                        </span>
                        {isMe && <span className="text-[10px] text-neutral-500">(You)</span>}
                        {isHost && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                            <Crown className="w-2.5 h-2.5" /> Host
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">{user.status || 'Active in room'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Controls Bottom Bar (Mute / Deafen) */}
      {isVoiceActive && (
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Muted' : 'Mic On'}</span>
            </button>

            <button
              onClick={toggleDeafen}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isDeafened
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              }`}
            >
              {isDeafened ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              <span>{isDeafened ? 'Deafened' : 'Sound On'}</span>
            </button>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Connected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
