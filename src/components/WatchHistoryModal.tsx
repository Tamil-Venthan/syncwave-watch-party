import React, { useState } from 'react';
import { useParty } from '../context/PartyContext';
import { VideoItem, WatchHistoryEntry } from '../types';
import {
  X,
  History,
  Share2,
  Trash2,
  Play,
  Plus,
  Copy,
  Check,
  Download,
  Users,
  Clock
} from 'lucide-react';

export const WatchHistoryModal: React.FC = () => {
  const {
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    watchHistory,
    clearWatchHistory,
    changeCurrentVideo,
    addToQueue,
    canControlPlayback,
    currentUser
  } = useParty();

  const [copiedShare, setCopiedShare] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'share'>('list');

  if (!isHistoryModalOpen) return null;

  const handlePlayNow = (entry: WatchHistoryEntry) => {
    const videoItem: VideoItem = {
      id: `wh-play-${Date.now()}`,
      youtubeId: entry.youtubeId,
      title: entry.title,
      thumbnail: entry.thumbnail,
      addedBy: {
        id: currentUser.id,
        username: currentUser.username
      },
      addedAt: Date.now()
    };
    changeCurrentVideo(videoItem);
    setIsHistoryModalOpen(false);
  };

  const handleQueue = (entry: WatchHistoryEntry) => {
    const videoItem: VideoItem = {
      id: `wh-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      youtubeId: entry.youtubeId,
      title: entry.title,
      thumbnail: entry.thumbnail,
      addedBy: {
        id: currentUser.id,
        username: currentUser.username
      },
      addedAt: Date.now()
    };
    addToQueue(videoItem);
  };

  const generateShareText = () => {
    if (watchHistory.length === 0) return 'No watch history yet!';
    let text = `🍿 *SyncWave Watch Party History* (${watchHistory.length} videos watched):\n\n`;
    watchHistory.slice(0, 15).forEach((v, idx) => {
      text += `${idx + 1}. ${v.title}\n   🔗 https://youtube.com/watch?v=${v.youtubeId}\n`;
      if (v.watchedWith && v.watchedWith.length > 0) {
        text += `   👥 Watched with: ${v.watchedWith.join(', ')}\n`;
      }
      text += `\n`;
    });
    text += `Join our next watch party on SyncWave!`;
    return text;
  };

  const handleCopyShare = () => {
    const text = generateShareText();
    navigator.clipboard?.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(watchHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncwave-watch-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-neutral-100">Shared Watch History</h2>
              <p className="text-xs text-neutral-400">Keep track of every video enjoyed together with friends</p>
            </div>
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs & Controls */}
        <div className="px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Watched Videos ({watchHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'share'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share History</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {watchHistory.length > 0 && (
              <>
                <button
                  onClick={handleDownloadJSON}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                  title="Export History JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={clearWatchHistory}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Clear All History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === 'share' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Shareable Watch Party Recap
                  </h3>
                  <button
                    onClick={handleCopyShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={generateShareText()}
                  rows={8}
                  className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 resize-none focus:outline-none"
                />
              </div>

              <p className="text-xs text-neutral-500 text-center">
                Paste this recap into Discord, WhatsApp, or Twitter to show what you and your friends watched!
              </p>
            </div>
          ) : watchHistory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <History className="w-10 h-10 mb-2 text-neutral-600" />
              <p className="text-sm font-medium text-neutral-400">No watch history yet</p>
              <p className="text-xs text-neutral-600 mt-1 max-w-[260px]">
                As you stream YouTube videos in party rooms, they will be saved here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700/80 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-800">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-neutral-200 truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.watchedAt).toLocaleDateString()} {new Date(item.watchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {item.watchedWith && item.watchedWith.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 truncate max-w-[140px]">
                              <Users className="w-3 h-3" /> {item.watchedWith.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {canControlPlayback && (
                      <button
                        onClick={() => handlePlayNow(item)}
                        className="p-2 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 transition-colors cursor-pointer"
                        title="Watch again now"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => handleQueue(item)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                      title="Add back to queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
