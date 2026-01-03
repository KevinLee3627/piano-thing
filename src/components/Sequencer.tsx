import { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useAppSelector } from '../app/hooks';
import { Block } from './Block';
import { Playhead } from './Playhead';
import { useGlobalAudioContext } from '../context/audioContext';

const FPS = 60;
const MS_PER_FRAME = 1000 / FPS;

interface TrackProps {
  trackId: string;
}

export const Sequencer = (props: TrackProps) => {
  const audioContext = useGlobalAudioContext();

  const trackStartTime = useRef(audioContext.currentTime);
  const [playbackTime, setPlaybackTime] = useState(0); // NOTE: Used for ui/animation/rendering
  const [trackLength, setTrackLength] = useState(3); // secs
  const { ref: trackRef, dimensions: trackDimensions } = useResizeObserver();
  const blocks = useAppSelector((state) => state.tracks[props.trackId].blocks);

  const playTrack = () => {
    Object.values(blocks).forEach((note) => {
      const startTime = audioContext.currentTime + note.startTime;
      const duration = note.duration;

      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(
        note.frequency,
        audioContext.currentTime
      );

      const gainNode = audioContext.createGain();

      gainNode.gain.setValueAtTime(note.gain, startTime);
      gainNode.gain.linearRampToValueAtTime(0.01, startTime + duration);

      oscillatorNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillatorNode.start(startTime);
      oscillatorNode.stop(startTime + duration);
    });
  };

  const animationRef = useRef<number>(null);
  const msPrev = useRef(audioContext.currentTime);
  const updateUITime = () => {
    if (audioContext == null) return;

    const msNow = audioContext.currentTime;
    const msPassed = (msNow - msPrev.current) * 1000;
    const currentPlaybackTime =
      audioContext.currentTime - trackStartTime.current;

    if (msPassed > MS_PER_FRAME) {
      setPlaybackTime(currentPlaybackTime);
      msPrev.current = msNow;
    }

    // NOTE: We calculate directly so we can stop at the correct time.
    // Other places (like the check above) uses the stored state for UI/rendering purposes.
    if (currentPlaybackTime >= trackLength) {
      stopUIUpdates();
      return;
    }

    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const startPlaybackAndUIUpdates = () => {
    if (Object.keys(blocks).length === 0) return;
    setPlaybackTime(0);
    trackStartTime.current = audioContext.currentTime;
    playTrack();
    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const stopUIUpdates = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div
      style={{
        height: '100%',
        width: '80%',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <button onCanPlay={startPlaybackAndUIUpdates}>start</button>
      <div
        style={{
          height: '50%',
          border: '1px solid black',
        }}
        ref={trackRef}
      >
        <Playhead
          trackDimensions={trackDimensions}
          trackLength={trackLength}
          currentTime={playbackTime}
        />
        {Object.entries(blocks).map(([blockId, block]) => (
          <Block
            key={blockId}
            {...block}
            trackDimensions={trackDimensions}
            trackLength={trackLength}
          />
        ))}
      </div>
    </div>
  );
};
