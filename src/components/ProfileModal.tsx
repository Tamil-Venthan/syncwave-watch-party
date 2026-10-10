import React, { useState } from 'react';
import { useParty } from '../context/PartyContext';
import {
  Avatar,
  AVATAR_COLORS,
  AVATAR_FACES,
  AVATAR_ACCESSORIES
} from '../utils/avatar';
import { X, Check, User, Sparkles, Wand2 } from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, currentUser, updateCurrentUser } = useParty();

  const [username, setUsername] = useState(currentUser.username);
  const [status, setStatus] = useState(currentUser.status || 'Vibing');
  const [avatarBg, setAvatarBg] = useState(currentUser.avatar.bg);
  const [avatarFace, setAvatarFace] = useState(currentUser.avatar.face);
  const [avatarAccessory, setAvatarAccessory] = useState(currentUser.avatar.accessory);

  if (!isProfileModalOpen) return null;

  const handleRandomize = () => {
    const randomBg = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].bg;
    const randomFace = AVATAR_FACES[Math.floor(Math.random() * AVATAR_FACES.length)].id;
    const randomAcc = AVATAR_ACCESSORIES[Math.floor(Math.random() * AVATAR_ACCESSORIES.length)].id;

    setAvatarBg(randomBg);
    setAvatarFace(randomFace);
    setAvatarAccessory(randomAcc);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    updateCurrentUser({
      username: username.trim(),
      status: status.trim(),
      avatar: {
        bg: avatarBg,
        face: avatarFace,
        accessory: avatarAccessory
      }
    });

    setIsProfileModalOpen(false);
  };

  const previewAvatarConfig = {
    bg: avatarBg,
    face: avatarFace,
    accessory: avatarAccessory
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-neutral-100">Customize Profile & Avatar</h2>
              <p className="text-xs text-neutral-400">Design your unique identity for the watch party</p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 md:p-6 overflow-y-auto space-y-5">
          {/* Live Preview Display */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="relative">
              <Avatar config={previewAvatarConfig} size="xl" />
              <button
                type="button"
                onClick={handleRandomize}
                className="absolute -bottom-1 -right-1 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full border border-neutral-700 shadow-md transition-transform hover:scale-110 cursor-pointer"
                title="Randomize Avatar"
              >
                <Wand2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 w-full space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={24}
                  required
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-neutral-100 font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Status Mood
                </label>
                <input
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  maxLength={35}
                  placeholder="e.g. Pass the popcorn, Singing along..."
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Color Gradient Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Color Style & Glow
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_COLORS.map((col) => {
                const isSelected = avatarBg === col.bg;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setAvatarBg(col.bg)}
                    className={`relative p-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-white ring-2 ring-white/20 text-white'
                        : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ background: col.bg }}
                    />
                    <span className="truncate text-[11px]">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Face Expression Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Face Expression
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {AVATAR_FACES.map((face) => {
                const isSelected = avatarFace === face.id;
                return (
                  <button
                    key={face.id}
                    type="button"
                    onClick={() => setAvatarFace(face.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                        : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    {face.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessory Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Headwear & Accessories
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {AVATAR_ACCESSORIES.map((acc) => {
                const isSelected = avatarAccessory === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAvatarAccessory(acc.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                        : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    {acc.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Save */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
