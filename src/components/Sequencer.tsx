import { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useAppSelector } from '../app/hooks';
import { Block } from './Block';
import { Keyboard } from './Keyboard';
import { Playhead } from './Playhead';

interface SequencerProps {
  audioContext: AudioContext;
}

const FPS = 60;
const MS_PER_FRAME = 1000 / FPS;

export const Sequencer = (props: SequencerProps) => {
  const trackStartTime = useRef(props.audioContext.currentTime);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [trackLength, setTrackLength] = useState(3); // secs
  const { ref: trackRef, dimensions: trackDimensions } = useResizeObserver();
  const blocks = useAppSelector((state) => state.tracks.blocks);

  const playTrack = () => {
    Object.values(blocks).forEach((note) => {
      const startTime = props.audioContext.currentTime + note.startTime;
      const duration = note.duration;

      const oscillatorNode = props.audioContext.createOscillator();
      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(
        note.frequency,
        props.audioContext.currentTime
      );

      const gainNode = props.audioContext.createGain();

      gainNode.gain.setValueAtTime(note.gain, startTime);
      gainNode.gain.linearRampToValueAtTime(0.01, startTime + duration);

      oscillatorNode.connect(gainNode);
      gainNode.connect(props.audioContext.destination);

      oscillatorNode.start(startTime);
      oscillatorNode.stop(startTime + duration);
    });
  };

  const animationRef = useRef<number>(null);
  const msPrev = useRef(props.audioContext.currentTime);
  const updateUITime = () => {
    if (props.audioContext == null) return;

    const msNow = props.audioContext.currentTime;
    const msPassed = (msNow - msPrev.current) * 1000;
    const currentPlaybackTime =
      props.audioContext.currentTime - trackStartTime.current;

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
    trackStartTime.current = props.audioContext.currentTime;
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
    <div style={{ height: '100%' }}>
      <div>
        <p>
          Track: {trackDimensions.width}px x {trackDimensions.height}px
        </p>
        <p>start: {playbackTime}</p>
        <button onClick={startPlaybackAndUIUpdates}>play</button>
        <input
          type='number'
          step={0.01}
          value={trackLength}
          onChange={(e) => {
            setTrackLength(Number(e.target.value));
          }}
        />
      </div>
      <div style={{ height: '60%' }}>
        <div
          ref={trackRef}
          style={{
            height: '100%',
            width: '80%',
            margin: '0 auto',
            border: '1px solid black',
            position: 'relative',
          }}
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
      <Keyboard />
    </div>
  );
};
