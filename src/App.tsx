import React, { useState } from 'react';
import { PartyProvider, useParty } from './context/PartyContext';
import { Navbar } from './components/Navbar';
import { YouTubePlayer } from './components/YouTubePlayer';
import { ChatPanel } from './components/ChatPanel';
import { VoiceChatPanel } from './components/VoiceChatPanel';
import { QueuePanel } from './components/QueuePanel';
import { CuratedVideoPicker } from './components/CuratedVideoPicker';
import { ProfileModal } from './components/ProfileModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { WatchHistoryModal } from './components/WatchHistoryModal';
import { VercelModal } from './components/VercelModal';
import {
  MessageSquare,
  Headphones,
  ListPlus,
  Radio,
  Sparkles,
  Share2,
  Clock,
  Shield,
  Zap,
  Check
} from 'lucide-react';

function WatchPartyMain() {
  const {
    currentRoom,
    messages,
    isVoiceActive,
    speakingUsers,
    setIsCuratedPickerOpen,
    setIsCreateRoomModalOpen,
    setIsHistoryModalOpen
  } = useParty();

  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'voice' | 'queue'>('chat');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(false);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      <Navbar />

      {/* Main Grid View */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden">
        {/* Left Column: Video Theater Player & Info */}
        <section className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Synchronized YouTube Player */}
          <div className="w-full">
            <YouTubePlayer />
          </div>

          {/* Current Video Details & Party Quick Bar */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-rose-400 font-semibold tracking-wide uppercase">
                  Currently Streaming
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400 font-mono">
                  Room: {currentRoom?.name || 'Main Room'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-neutral-100 truncate">
                {currentRoom?.currentVideo?.title || 'lofi hip hop radio - beats to relax/study to'}
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Added by <span className="text-neutral-300 font-medium">{currentRoom?.currentVideo?.addedBy?.username || 'SyncWave'}</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setIsCuratedPickerOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Pick Video</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 cursor-pointer active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Invite Friends</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Multi-tab Interactive Sidebar (Chat / Voice / Queue) */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] h-[550px] lg:h-[calc(100vh-130px)] flex flex-col shrink-0">
          {/* Segmented Control Tabs */}
          <div className="p-1 mb-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveSideTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSideTab === 'chat'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat</span>
              <span className="text-[10px] bg-neutral-950 px-1.5 py-0.2 rounded-md text-neutral-400">
                {messages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSideTab('voice')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSideTab === 'voice'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Headphones className={`w-3.5 h-3.5 ${isVoiceActive ? 'text-emerald-400' : ''}`} />
              <span>Voice Room</span>
              {speakingUsers.size > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveSideTab('queue')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSideTab === 'queue'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Queue</span>
              <span className="text-[10px] bg-neutral-950 px-1.5 py-0.2 rounded-md text-neutral-400">
                {currentRoom?.queue?.length || 0}
              </span>
            </button>
          </div>

          {/* Active Tab Container */}
          <div className="flex-1 min-h-0">
            {activeSideTab === 'chat' && <ChatPanel />}
            {activeSideTab === 'voice' && <VoiceChatPanel />}
            {activeSideTab === 'queue' && <QueuePanel />}
          </div>
        </aside>
      </main>

      {/* Interactive Modals */}
      <CuratedVideoPicker />
      <ProfileModal />
      <CreateRoomModal />
      <WatchHistoryModal />
      <VercelModal />
    </div>
  );
}

export default function App() {
  return (
    <PartyProvider>
      <WatchPartyMain />
    </PartyProvider>
  );
}
