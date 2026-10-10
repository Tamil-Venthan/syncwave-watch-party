import React, { useState } from 'react';
import { useParty } from '../context/PartyContext';
import { extractYouTubeId } from '../utils/youtube';
import {
  X,
  Plus,
  Lock,
  Unlock,
  Radio,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  Check
} from 'lucide-react';

export const CreateRoomModal: React.FC = () => {
  const {
    isCreateRoomModalOpen,
    setIsCreateRoomModalOpen,
    createRoom
  } = useParty();

  const [roomName, setRoomName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [hostOnlyControl, setHostOnlyControl] = useState(false);
  const [initialVideoUrl, setInitialVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCreateRoomModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!roomName.trim()) {
      setErrorMsg('Please enter a room name');
      return;
    }

    if (isPrivate && !password.trim()) {
      setErrorMsg('Private rooms require a password');
      return;
    }

    let initialVideoId: string | undefined = undefined;
    if (initialVideoUrl.trim()) {
      const extracted = extractYouTubeId(initialVideoUrl);
      if (extracted) {
        initialVideoId = extracted;
      }
    }

    setIsLoading(true);

    try {
      await createRoom({
        name: roomName.trim(),
        id: customSlug.trim() || undefined,
        isPrivate,
        password: isPrivate ? password.trim() : undefined,
        hostOnlyControl,
        initialVideoId
      });

      setIsCreateRoomModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-neutral-100">Create Viewing Party Room</h2>
              <p className="text-xs text-neutral-400">Launch a private or open synchronized viewing session</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateRoomModalOpen(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Room Name *
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Friday Movie Night, Lo-Fi Chill Lounge..."
              maxLength={40}
              required
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Custom Slug */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Custom Room Code / URL (Optional)
              </label>
              <span className="text-[10px] text-neutral-500">syncwave/#your-code</span>
            </div>
            <input
              type="text"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="e.g. movie-squad (leave blank to auto-generate)"
              maxLength={24}
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Initial Video URL */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              First Video (Optional)
            </label>
            <input
              type="text"
              value={initialVideoUrl}
              onChange={(e) => setInitialVideoUrl(e.target.value)}
              placeholder="Paste YouTube link to play immediately..."
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Privacy & Password Controls */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  {isPrivate ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>Private Viewing Party</span>
                </p>
                <p className="text-[11px] text-neutral-500">Require a secret password to enter the room</p>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
              />
            </div>

            {isPrivate && (
              <div className="pt-2 border-t border-neutral-850">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set room password / PIN..."
                  maxLength={20}
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Playback Permission Policy */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Host-Only Playback Controls</span>
              </p>
              <p className="text-[11px] text-neutral-500">Only you can play, pause, seek, and change videos</p>
            </div>
            <input
              type="checkbox"
              checked={hostOnlyControl}
              onChange={(e) => setHostOnlyControl(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateRoomModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Radio className="w-4 h-4" />
              <span>{isLoading ? 'Creating Room...' : 'Create & Enter Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
