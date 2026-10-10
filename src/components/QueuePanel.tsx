import React, { useState } from 'react';
import { useParty } from '../context/PartyContext';
import { VideoItem } from '../types';
import { extractYouTubeId, getYouTubeThumbnail } from '../utils/youtube';
import { ListPlus, Play, Trash2, Sparkles, Check, Link as LinkIcon } from 'lucide-react';

export const QueuePanel: React.FC = () => {
  const {
    currentRoom,
    addToQueue,
    removeFromQueue,
    changeCurrentVideo,
    canControlPlayback,
    setIsCuratedPickerOpen,
    currentUser
  } = useParty();

  const [inputUrl, setInputUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const queue = currentRoom?.queue || [];

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    const youtubeId = extractYouTubeId(trimmed);
    if (!youtubeId) {
      setErrorMsg('Please paste a valid YouTube video link or ID');
      return;
    }

    const newVideo: VideoItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      youtubeId,
      title: `YouTube Video (${youtubeId})`,
      thumbnail: getYouTubeThumbnail(youtubeId),
      addedBy: {
        id: currentUser.id,
        username: currentUser.username
      },
      addedAt: Date.now()
    };

    addToQueue(newVideo);
    setInputUrl('');
    setSuccessMsg('Added to party queue!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/40">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-neutral-100">Party Queue</span>
          <span className="text-xs text-neutral-500">· {queue.length} upcoming</span>
        </div>
        <button
          onClick={() => setIsCuratedPickerOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Quick Picks</span>
        </button>
      </div>

      {/* Add URL Form */}
      <form onSubmit={handleAddVideo} className="p-3 border-b border-neutral-800/80 bg-neutral-950/40">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Paste YouTube URL or Video ID..."
              className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {errorMsg && <p className="text-[11px] text-rose-400 mt-1.5 pl-1">{errorMsg}</p>}
        {successMsg && (
          <p className="text-[11px] text-emerald-400 mt-1.5 pl-1 flex items-center gap-1">
            <Check className="w-3 h-3" /> {successMsg}
          </p>
        )}
      </form>

      {/* Queue List */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-2.5">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <ListPlus className="w-8 h-8 mb-2 text-neutral-600" />
            <p className="text-sm font-medium text-neutral-400">Queue is empty</p>
            <p className="text-xs text-neutral-600 mt-1 max-w-[200px]">
              Add any YouTube link or click Quick Picks to queue up music or trailers!
            </p>
          </div>
        ) : (
          queue.map((item, idx) => (
            <div
              key={item.id}
              className="group p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xs font-mono text-neutral-500 w-4">{idx + 1}</span>
                <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-800">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-neutral-200 truncate">{item.title}</p>
                  <p className="text-[10px] text-neutral-500">
                    Added by <span className="text-neutral-400">{item.addedBy.username}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {canControlPlayback && (
                  <button
                    onClick={() => {
                      changeCurrentVideo(item);
                      removeFromQueue(item.id);
                    }}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
                    title="Play now"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
                <button
                  onClick={() => removeFromQueue(item.id)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
