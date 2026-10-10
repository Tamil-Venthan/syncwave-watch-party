import React from 'react';
import { AvatarConfig } from '../types';

export const AVATAR_COLORS = [
  { id: 'rose', name: 'Neon Rose', bg: 'linear-gradient(135deg, #f43f5e, #be123c)' },
  { id: 'violet', name: 'Electric Violet', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  { id: 'cyan', name: 'Cyber Cyan', bg: 'linear-gradient(135deg, #06b6d4, #0e7490)' },
  { id: 'amber', name: 'Warm Amber', bg: 'linear-gradient(135deg, #f59e0b, #b45309)' },
  { id: 'emerald', name: 'Matrix Emerald', bg: 'linear-gradient(135deg, #10b981, #047857)' },
  { id: 'fuchsia', name: 'Hyper Fuchsia', bg: 'linear-gradient(135deg, #d946ef, #a21caf)' },
  { id: 'indigo', name: 'Deep Indigo', bg: 'linear-gradient(135deg, #6366f1, #4338ca)' },
  { id: 'slate', name: 'Stealth Noir', bg: 'linear-gradient(135deg, #334155, #0f172a)' }
];

export const AVATAR_FACES = [
  { id: 'smile', name: 'Chill Smile' },
  { id: 'sunglasses', name: 'Cool Shades' },
  { id: 'star_eyes', name: 'Star Eyed' },
  { id: 'kawaii', name: 'Kawaii' },
  { id: 'grin', name: 'Big Grin' },
  { id: 'wink', name: 'Playful Wink' },
  { id: 'smirk', name: 'Confident Smirk' }
];

export const AVATAR_ACCESSORIES = [
  { id: 'headphones', name: 'Headphones' },
  { id: 'crown', name: 'Golden Crown' },
  { id: 'cat_ears', name: 'Cat Ears' },
  { id: 'beanie', name: 'Cozy Beanie' },
  { id: 'vr_headset', name: 'VR Visor' },
  { id: 'halo', name: 'Halo' },
  { id: 'none', name: 'None' }
];

interface AvatarProps {
  config: AvatarConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isSpeaking?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  config,
  size = 'md',
  isSpeaking = false,
  className = ''
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl'
  };

  const bgStyle = config?.bg?.startsWith('linear')
    ? { background: config.bg }
    : { backgroundColor: config?.bg || '#6366f1' };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl select-none transition-transform duration-200 ${sizeMap[size]} ${
        isSpeaking ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-neutral-950 scale-105' : ''
      } ${className}`}
      style={bgStyle}
    >
      {/* Speaking Ripple Effect */}
      {isSpeaking && (
        <span className="absolute inset-0 rounded-2xl bg-emerald-400 opacity-25 animate-ping pointer-events-none" />
      )}

      {/* SVG Face & Details */}
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full p-1 drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Accessories */}
        {config.accessory === 'crown' && (
          <path
            d="M12 18 L16 10 L24 16 L32 10 L36 18 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}

        {config.accessory === 'cat_ears' && (
          <>
            <polygon points="10,18 16,8 22,17" fill="#F472B6" />
            <polygon points="12,17 16,11 20,16" fill="#FDF2F8" />
            <polygon points="26,17 32,8 38,18" fill="#F472B6" />
            <polygon points="28,16 32,11 36,17" fill="#FDF2F8" />
          </>
        )}

        {config.accessory === 'beanie' && (
          <path
            d="M12 20 Q24 8 36 20 Q24 23 12 20 Z"
            fill="#3B82F6"
            stroke="#1D4ED8"
            strokeWidth="1"
          />
        )}

        {config.accessory === 'halo' && (
          <ellipse
            cx="24"
            cy="10"
            rx="12"
            ry="4"
            fill="none"
            stroke="#FDE047"
            strokeWidth="2.5"
            strokeDasharray="1 0"
          />
        )}

        {config.accessory === 'headphones' && (
          <>
            <path
              d="M10 24 C10 14 38 14 38 24"
              stroke="#E2E8F0"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <rect x="7" y="21" width="5" height="10" rx="2.5" fill="#0EA5E9" />
            <rect x="36" y="21" width="5" height="10" rx="2.5" fill="#0EA5E9" />
          </>
        )}

        {config.accessory === 'vr_headset' && (
          <rect
            x="11"
            y="18"
            width="26"
            height="11"
            rx="4"
            fill="#1E293B"
            stroke="#38BDF8"
            strokeWidth="1.5"
          />
        )}

        {/* Eyes & Face Expressions */}
        {config.face === 'sunglasses' ? (
          <g>
            <path d="M12 22 H22 V27 C22 28.5 20 29.5 17 29.5 C14 29.5 12 28.5 12 27 Z" fill="#0F172A" />
            <path d="M26 22 H36 V27 C36 28.5 34 29.5 31 29.5 C28 29.5 26 28.5 26 27 Z" fill="#0F172A" />
            <line x1="22" y1="23" x2="26" y2="23" stroke="#0F172A" strokeWidth="2" />
            <line x1="14" y1="24" x2="19" y2="24" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            <line x1="28" y1="24" x2="33" y2="24" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
          </g>
        ) : config.face === 'star_eyes' ? (
          <g fill="#FDE047">
            <path d="M16 20 L17.5 23.5 L21 24 L18.5 26.5 L19 30 L16 28 L13 30 L13.5 26.5 L11 24 L14.5 23.5 Z" />
            <path d="M32 20 L33.5 23.5 L37 24 L34.5 26.5 L35 30 L32 28 L29 30 L29.5 26.5 L27 24 L30.5 23.5 Z" />
          </g>
        ) : config.face === 'kawaii' ? (
          <g>
            <circle cx="16" cy="24" r="3" fill="#0F172A" />
            <circle cx="17.2" cy="23" r="1.2" fill="white" />
            <circle cx="32" cy="24" r="3" fill="#0F172A" />
            <circle cx="33.2" cy="23" r="1.2" fill="white" />
            {/* Blushes */}
            <circle cx="12" cy="28" r="2.5" fill="#FDA4AF" opacity="0.8" />
            <circle cx="36" cy="28" r="2.5" fill="#FDA4AF" opacity="0.8" />
          </g>
        ) : config.face === 'wink' ? (
          <g>
            <circle cx="16" cy="24" r="2.5" fill="#0F172A" />
            <path d="M29 25 Q32 21 35 25" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : config.face === 'smirk' ? (
          <g>
            <circle cx="16" cy="24" r="2.5" fill="#0F172A" />
            <circle cx="32" cy="24" r="2.5" fill="#0F172A" />
          </g>
        ) : (
          /* Default Chill Eyes */
          <g fill="#0F172A">
            <circle cx="16" cy="24" r="2.5" />
            <circle cx="32" cy="24" r="2.5" />
          </g>
        )}

        {/* Mouth */}
        {config.face === 'grin' ? (
          <path
            d="M17 31 Q24 40 31 31 Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="1.5"
          />
        ) : config.face === 'smirk' ? (
          <path
            d="M20 33 Q25 33 29 31"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M18 31 Q24 37 30 31"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
