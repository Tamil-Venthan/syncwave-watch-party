import { VideoItem } from '../types';

/**
 * Extracts a standard 11-character YouTube video ID from various URL formats or raw strings.
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already 11 alphanumeric characters with - or _
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Standard regex for YouTube URLs
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Generates an HQ thumbnail URL for a given YouTube video ID.
 */
export function getYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

/**
 * Curated Watch Party catalog across popular genres so users can jump right in.
 */
export interface CuratedCategory {
  name: string;
  videos: {
    youtubeId: string;
    title: string;
    channel: string;
    duration: string;
    tag: string;
  }[];
}

export const CURATED_VIDEOS: CuratedCategory[] = [
  {
    name: 'Lo-Fi & Study Chill',
    videos: [
      {
        youtubeId: 'jfKfPfyJRdk',
        title: 'lofi hip hop radio - beats to relax/study to',
        channel: 'Lofi Girl',
        duration: 'LIVE',
        tag: 'Cozy'
      },
      {
        youtubeId: '5qap5aO4i9A',
        title: 'lofi hip hop radio - beats to sleep/chill to',
        channel: 'Lofi Girl',
        duration: 'LIVE',
        tag: 'Sleep'
      },
      {
        youtubeId: '1nueFGvd2rE',
        title: 'Synthwave Radio - Chill Retro Synth Electro',
        channel: 'Lofi Girl',
        duration: 'LIVE',
        tag: 'Retro'
      },
      {
        youtubeId: 'Dx5qFachd3A',
        title: 'Warm Jazz Cafe Music - Relaxing Background Music',
        channel: 'Cafe Music BGM',
        duration: '3:34:10',
        tag: 'Jazz'
      }
    ]
  },
  {
    name: 'Music & Live Concerts',
    videos: [
      {
        youtubeId: 'kJQP7kiw5Fk',
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        channel: 'Luis Fonsi',
        duration: '4:41',
        tag: 'Pop'
      },
      {
        youtubeId: 'fJ9rUzIMcZQ',
        title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
        channel: 'Queen Official',
        duration: '5:59',
        tag: 'Rock'
      },
      {
        youtubeId: 'hT_nvWreIhg',
        title: 'OneRepublic - Counting Stars (Official Music Video)',
        channel: 'OneRepublic',
        duration: '4:44',
        tag: 'Anthem'
      },
      {
        youtubeId: 'JGwWNGJdvx8',
        title: 'Ed Sheeran - Shape of You (Official Music Video)',
        channel: 'Ed Sheeran',
        duration: '4:23',
        tag: 'Acoustic'
      }
    ]
  },
  {
    name: 'Science, Space & Nature 4K',
    videos: [
      {
        youtubeId: '1-7X4n06tI4',
        title: 'James Webb Space Telescope First Deep Field Cosmic Journey',
        channel: 'NASA',
        duration: '10:14',
        tag: 'Cosmos'
      },
      {
        youtubeId: 'LXb3EKWsInQ',
        title: 'COSTA RICA IN 4K 60fps HDR (ULTRA HD)',
        channel: 'Jacob + Katie Schwarz',
        duration: '5:14',
        tag: 'Wildlife'
      },
      {
        youtubeId: '47d_v4o9-V8',
        title: 'PATAGONIA 8K - Cinematic Drone Film',
        channel: '8K Earth',
        duration: '7:45',
        tag: 'Scenic'
      }
    ]
  },
  {
    name: 'Trailers & Cinema',
    videos: [
      {
        youtubeId: 'Way9Dexny3w',
        title: 'Dune: Part Two | Official Trailer 3',
        channel: 'Warner Bros. Pictures',
        duration: '2:24',
        tag: 'Sci-Fi'
      },
      {
        youtubeId: '73_1biulkYk',
        title: 'Deadpool & Wolverine | Official Trailer',
        channel: 'Marvel Entertainment',
        duration: '2:38',
        tag: 'Action'
      },
      {
        youtubeId: 'd9MyW72ELq0',
        title: 'Avatar: The Way of Water | Official Trailer',
        channel: '20th Century Studios',
        duration: '2:28',
        tag: 'Fantasy'
      }
    ]
  },
  {
    name: 'Gaming & Fun Highlights',
    videos: [
      {
        youtubeId: 'Kz73s9l5Uss',
        title: 'Minecraft 15th Anniversary Official Animation Trailer',
        channel: 'Minecraft',
        duration: '1:54',
        tag: 'Gaming'
      },
      {
        youtubeId: 'QdBZY2fkU-0',
        title: 'Grand Theft Auto VI Trailer 1',
        channel: 'Rockstar Games',
        duration: '1:30',
        tag: 'Hype'
      }
    ]
  }
];

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
