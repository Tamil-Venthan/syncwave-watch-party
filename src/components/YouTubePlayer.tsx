import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParty } from '../context/PartyContext';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Lock,
  Radio,
  SkipForward,
  AlertCircle
} from 'lucide-react';
import { formatTime } from '../utils/youtube';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer: React.FC = () => {
  const {
    currentRoom,
    syncPlayerState,
    canControlPlayback,
    isHost,
    reactions,
    triggerReaction,
    playNextInQueue,
    setIsCuratedPickerOpen
  } = useParty();

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const isRemoteActionRef = useRef<boolean>(false);
  const lastSyncTimeRef = useRef<number>(0);
  const currentVideoIdRef = useRef<string>('');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [driftSeconds, setDriftSeconds] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const controlsTimeoutRef = useRef<any>(null);

  const videoId = currentRoom?.currentVideo?.youtubeId || 'jfKfPfyJRdk';

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YouTube Player once
  useEffect(() => {
    let checkInterval: any = null;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      const target = document.getElementById('youtube-iframe-target');
      if (!target) return;

      // If player already created, do not recreate
      if (playerRef.current) return;

      currentVideoIdRef.current = videoId;

      try {
        playerRef.current = new window.YT.Player('youtube-iframe-target', {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1
          },
          events: {
            onReady: (event: any) => {
              isPlayerReadyRef.current = true;
              event.target.setVolume(volume);

              // If room state says it should be playing
              if (currentRoom?.playerState?.isPlaying) {
                const elapsed = (Date.now() - currentRoom.playerState.updatedAt) / 1000;
                const targetTime = currentRoom.playerState.currentTime + elapsed;
                if (targetTime > 1) {
                  event.target.seekTo(targetTime, true);
                }
              }
            },
            onStateChange: (event: any) => {
              if (!isPlayerReadyRef.current) return;
              const state = event.data;

              // 1 = Playing, 2 = Paused, 0 = Ended
              if (state === 1) {
                setIsPlaying(true);
                setHasStarted(true);
                setErrorMessage('');
                const dur = playerRef.current?.getDuration() || 0;
                if (dur > 0) setDuration(dur);

                if (!isRemoteActionRef.current && canControlPlayback) {
                  const now = Date.now();
                  if (now - lastSyncTimeRef.current > 400) {
                    lastSyncTimeRef.current = now;
                    syncPlayerState(true, playerRef.current.getCurrentTime());
                  }
                }
              } else if (state === 2) {
                setIsPlaying(false);
                if (!isRemoteActionRef.current && canControlPlayback) {
                  const now = Date.now();
                  if (now - lastSyncTimeRef.current > 400) {
                    lastSyncTimeRef.current = now;
                    syncPlayerState(false, playerRef.current.getCurrentTime());
                  }
                }
              } else if (state === 0) {
                if (canControlPlayback) {
                  playNextInQueue();
                }
              }
            },
            onError: (event: any) => {
              console.warn('YouTube Player Error:', event.data);
              // Error 101 or 150: Video owner does not allow embedding
              if (event.data === 150 || event.data === 101) {
                setErrorMessage('This video cannot be embedded by owner request. Switching to next video...');
                setTimeout(() => {
                  playNextInQueue();
                }, 2500);
              } else {
                setErrorMessage('Video error. Click to re-sync or pick another video.');
              }
            }
          }
        });
      } catch (err) {
        console.warn('Failed to initialize YouTube player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        setupPlayer();
      };
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          setupPlayer();
        }
      }, 200);
    }

    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  // When videoId changes, smoothly switch video using loadVideoById without destroying the player
  useEffect(() => {
    if (!videoId) return;

    if (currentVideoIdRef.current !== videoId) {
      currentVideoIdRef.current = videoId;
      setErrorMessage('');

      if (isPlayerReadyRef.current && playerRef.current?.loadVideoById) {
        try {
          playerRef.current.loadVideoById(videoId, 0);
          setIsPlaying(true);
          setHasStarted(true);
        } catch (e) {
          console.warn('Error loading new video ID:', e);
        }
      }
    }
  }, [videoId]);

  // Synchronize when remote room playerState changes
  useEffect(() => {
    if (!isPlayerReadyRef.current || !playerRef.current || !currentRoom?.playerState) return;

    const state = currentRoom.playerState;
    const now = Date.now();
    const elapsed = state.isPlaying ? (now - state.updatedAt) / 1000 : 0;
    const expectedTime = state.currentTime + elapsed;

    try {
      const actualTime = playerRef.current.getCurrentTime() || 0;
      const drift = Math.abs(actualTime - expectedTime);

      setDriftSeconds(actualTime - expectedTime);

      // Re-seek if drift > 1.75 seconds
      if (drift > 1.75 && expectedTime >= 0) {
        isRemoteActionRef.current = true;
        playerRef.current.seekTo(expectedTime, true);
        setTimeout(() => {
          isRemoteActionRef.current = false;
        }, 500);
      }

      // Sync play/pause state
      if (state.isPlaying && hasStarted) {
        if (playerRef.current.getPlayerState() !== 1) {
          isRemoteActionRef.current = true;
          playerRef.current.playVideo();
          setIsPlaying(true);
          setTimeout(() => {
            isRemoteActionRef.current = false;
          }, 500);
        }
      } else if (!state.isPlaying) {
        if (playerRef.current.getPlayerState() === 1) {
          isRemoteActionRef.current = true;
          playerRef.current.pauseVideo();
          setIsPlaying(false);
          setTimeout(() => {
            isRemoteActionRef.current = false;
          }, 500);
        }
      }
    } catch (e) {
      // player might still be buffering
    }
  }, [currentRoom?.playerState, hasStarted]);

  // Periodic time updates
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlayerReadyRef.current && playerRef.current) {
        try {
          const cur = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);

          if (currentRoom?.playerState) {
            const state = currentRoom.playerState;
            const elapsed = state.isPlaying ? (Date.now() - state.updatedAt) / 1000 : 0;
            const target = state.currentTime + elapsed;
            setDriftSeconds(cur - target);
          }
        } catch (e) {
          // ignore
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRoom?.playerState]);

  // Start watching / unlock audio
  const handleStartWatching = useCallback(() => {
    setHasStarted(true);
    setErrorMessage('');

    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
        playerRef.current.playVideo();
        setIsPlaying(true);
        setIsMuted(false);
        syncPlayerState(true, playerRef.current.getCurrentTime() || 0);
      } catch (e) {
        console.warn('Play error:', e);
      }
    }
  }, [syncPlayerState, volume]);

  const handlePlayPause = useCallback(() => {
    if (!isPlayerReadyRef.current || !playerRef.current) {
      handleStartWatching();
      return;
    }

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
        syncPlayerState(false, playerRef.current.getCurrentTime());
      } else {
        setHasStarted(true);
        playerRef.current.playVideo();
        setIsPlaying(true);
        syncPlayerState(true, playerRef.current.getCurrentTime());
      }
    } catch (e) {
      // ignore
    }
  }, [handleStartWatching, isPlaying, syncPlayerState]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPlayerReadyRef.current || !playerRef.current || !canControlPlayback) return;
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    playerRef.current.seekTo(target, true);
    syncPlayerState(isPlaying, target);
  };

  const handleJumpToSync = () => {
    if (!isPlayerReadyRef.current || !playerRef.current || !currentRoom?.playerState) return;
    const state = currentRoom.playerState;
    const elapsed = state.isPlaying ? (Date.now() - state.updatedAt) / 1000 : 0;
    const target = state.currentTime + elapsed;
    playerRef.current.seekTo(target, true);
    if (state.isPlaying) {
      playerRef.current.playVideo();
      setIsPlaying(true);
      setHasStarted(true);
    } else {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
    setDriftSeconds(0);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  const REACTION_EMOJIS = ['🔥', '❤️', '😂', '🍿', '👏', '🎉', '🚀', '⚡'];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col group select-none"
    >
      {/* Target Container for YouTube Iframe */}
      <div className="absolute inset-0 w-full h-full">
        <div id="youtube-iframe-target" className="w-full h-full pointer-events-auto" />
      </div>

      {/* Click-To-Start Overlay to Satisfy Browser Autoplay Audio Policy */}
      {!hasStarted && !isPlaying && (
        <div
          onClick={handleStartWatching}
          className="absolute inset-0 bg-neutral-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-30 cursor-pointer transition-opacity duration-300"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-900/60 transform hover:scale-110 active:scale-95 transition-all">
            <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
          </div>
          <p className="mt-4 text-sm md:text-base font-bold text-white tracking-wide">
            Click to Start Watch Party
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Tap anywhere to synchronize video & audio with your friends
          </p>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Floating Animated Reaction Emojis Burst */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {reactions.map((rx) => (
          <div
            key={rx.id}
            style={{
              left: `${rx.x}%`,
              bottom: '15%'
            }}
            className="absolute flex flex-col items-center animate-reaction-float transition-all"
          >
            <span className="text-3xl md:text-4xl filter drop-shadow-lg transform hover:scale-125 duration-150">
              {rx.emoji}
            </span>
            <span className="text-[10px] text-neutral-200 bg-neutral-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm mt-1 whitespace-nowrap shadow-sm">
              {rx.userName}
            </span>
          </div>
        ))}
      </div>

      {/* Top Header Overlay (Room details & Control status) */}
      <div
        className={`absolute top-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-b from-neutral-950/90 via-neutral-950/40 to-transparent z-30 transition-opacity duration-300 flex items-center justify-between ${
          showControls ? 'opacity-100' : 'opacity-0 md:opacity-100'
        }`}
      >
        <div className="flex items-center gap-2.5 max-w-[70%]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900/80 border border-neutral-700/60 backdrop-blur-md text-xs text-neutral-300">
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-rose-500 animate-pulse' : 'text-neutral-500'}`} />
            <span className="font-medium truncate max-w-[150px] md:max-w-[280px]">
              {currentRoom?.currentVideo?.title || 'Watch Party'}
            </span>
          </div>

          {currentRoom?.hostOnlyControl && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-amber-500/10 text-amber-300 border-amber-500/30">
              <Lock className="w-3 h-3" />
              <span>{isHost ? 'Host Controls Active' : 'Host Only Control'}</span>
            </div>
          )}
        </div>

        {/* Sync Drift Alert & Catchup Button */}
        <div className="flex items-center gap-2">
          {Math.abs(driftSeconds) > 2.5 && (
            <button
              onClick={handleJumpToSync}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all cursor-pointer animate-pulse"
              title="Click to snap back into sync with room host"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sync with Room ({Math.abs(driftSeconds).toFixed(1)}s)</span>
            </button>
          )}

          <button
            onClick={() => setIsCuratedPickerOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium backdrop-blur-md transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Browse Videos</span>
          </button>
        </div>
      </div>

      {/* Floating Quick Reaction Bar */}
      <div
        className={`absolute bottom-16 right-3 md:right-4 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 md:opacity-60 hover:opacity-100'
        }`}
      >
        <div className="flex items-center gap-1 p-1 bg-neutral-950/80 border border-neutral-800/80 rounded-xl backdrop-blur-md shadow-xl">
          {REACTION_EMOJIS.slice(0, 6).map((emoji) => (
            <button
              key={emoji}
              onClick={() => triggerReaction(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-transform cursor-pointer rounded-lg hover:bg-neutral-800/60"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Custom Playback Bar Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div className="flex items-center gap-3 w-full mb-2">
          <span className="text-[11px] font-mono text-neutral-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              disabled={!canControlPlayback}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:h-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <span className="text-[11px] font-mono text-neutral-400 w-10">
            {duration > 0 ? formatTime(duration) : 'LIVE'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              disabled={!canControlPlayback}
              className="w-9 h-9 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 flex items-center justify-center font-bold transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* Skip to Next Video in Queue */}
            {canControlPlayback && (
              <button
                onClick={playNextInQueue}
                className="w-8 h-8 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Play next video in queue"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleJumpToSync}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800/60 transition-colors cursor-pointer flex items-center gap-1 text-xs"
              title="Resync to room time"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Resync</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800/60 transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
