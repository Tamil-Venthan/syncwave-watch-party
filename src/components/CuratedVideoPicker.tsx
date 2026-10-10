import React, { useState } from 'react';
import { useParty } from '../context/PartyContext';
import { CURATED_VIDEOS, getYouTubeThumbnail, extractYouTubeId } from '../utils/youtube';
import { VideoItem } from '../types';
import { X, Play, Plus, Search, Sparkles, Check } from 'lucide-react';

export const CuratedVideoPicker: React.FC = () => {
  const {
    isCuratedPickerOpen,
    setIsCuratedPickerOpen,
    changeCurrentVideo,
    addToQueue,
    canControlPlayback,
    currentUser
  } = useParty();

  const [activeCategory, setActiveCategory] = useState<string>('Lo-Fi & Study Chill');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (!isCuratedPickerOpen) return null;

  const currentCategoryData = CURATED_VIDEOS.find((c) => c.name === activeCategory);

  const filteredVideos = currentCategoryData
    ? currentCategoryData.videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handlePlayNow = (vid: { youtubeId: string; title: string }) => {
    const videoItem: VideoItem = {
      id: `vid-${Date.now()}`,
      youtubeId: vid.youtubeId,
      title: vid.title,
      thumbnail: getYouTubeThumbnail(vid.youtubeId),
      addedBy: {
        id: currentUser.id,
        username: currentUser.username
      },
      addedAt: Date.now()
    };
    changeCurrentVideo(videoItem);
    setIsCuratedPickerOpen(false);
  };

  const handleAddToQueue = (vid: { youtubeId: string; title: string }) => {
    const videoItem: VideoItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      youtubeId: vid.youtubeId,
      title: vid.title,
      thumbnail: getYouTubeThumbnail(vid.youtubeId),
      addedBy: {
        id: currentUser.id,
        username: currentUser.username
      },
      addedAt: Date.now()
    };
    addToQueue(videoItem);
    setAddedIds((prev) => new Set(prev).add(vid.youtubeId));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(vid.youtubeId);
        return next;
      });
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-neutral-100">Featured Video Catalog</h2>
              <p className="text-xs text-neutral-400">Curated high-quality content ready for synchronized streaming</p>
            </div>
          </div>
          <button
            onClick={() => setIsCuratedPickerOpen(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/40 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search curated videos by title, artist, or tags..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs md:text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Category Tabs (Functional Segmented Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CURATED_VIDEOS.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === cat.name
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/30'
                    : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Video Cards Grid */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredVideos.map((vid) => {
            const isAdded = addedIds.has(vid.youtubeId);

            return (
              <div
                key={vid.youtubeId}
                className="group p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800 mb-2.5">
                    <img
                      src={getYouTubeThumbnail(vid.youtubeId)}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-white">
                      {vid.duration}
                    </span>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-neutral-900/80 backdrop-blur-sm text-[10px] font-medium text-rose-300 border border-neutral-700/60">
                      {vid.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-100 line-clamp-2 leading-snug">
                    {vid.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">{vid.channel}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-850">
                  {canControlPlayback && (
                    <button
                      onClick={() => handlePlayNow(vid)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-neutral-200 text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Now</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleAddToQueue(vid)}
                    disabled={isAdded}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Queued</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Queue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
