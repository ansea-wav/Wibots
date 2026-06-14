'use client';
import { useEffect, useRef } from 'react';

// Default Lofi / Focus music stream (using a reliable free public domain or creative commons stream URL)
// For this example, we'll use a placeholder URL. The user can easily change it if needed.
const DEFAULT_MUSIC_URL = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';
const MUSIC_TITLE = 'Lofi Focus - Chill Vibes';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handlePlay = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        
        // Notify Dynamic Island
        const event = new CustomEvent('wibots-music', { 
          detail: { playing: true, title: MUSIC_TITLE } 
        });
        window.dispatchEvent(event);
      }
    };

    const handlePause = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        
        // Notify Dynamic Island
        const event = new CustomEvent('wibots-music', { 
          detail: { playing: false } 
        });
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('wibots-play-music', handlePlay);
    window.addEventListener('wibots-pause-music', handlePause);

    return () => {
      window.removeEventListener('wibots-play-music', handlePlay);
      window.removeEventListener('wibots-pause-music', handlePause);
    };
  }, []);

  return (
    <audio 
      ref={audioRef} 
      src={DEFAULT_MUSIC_URL} 
      loop 
      preload="none" 
      className="hidden"
    />
  );
}
