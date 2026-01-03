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
  const [trackLength, setTrackLength] = useState(5); // secs
  const { ref: trackRef, dimensions: trackDimensions } = useResizeObserver();
  const blocks = useAppSelector((state) => state.tracks.blocks);

  const msPrev = useRef(window.performance.now());

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
  const [currentTime, setCurrentTime] = useState(0);
  const updateUITime = () => {
    if (props.audioContext == null) return;

    const msNow = window.performance.now();
    const msPassed = msNow - msPrev.current;

    if (msPassed > MS_PER_FRAME) {
      setCurrentTime(props.audioContext.currentTime);
      msPrev.current = msNow;
    }

    if (props.audioContext.currentTime >= trackLength) {
      stopUIUpdates();
      return;
    }

    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const startPlaybackAndUIUpdates = () => {
    if (Object.keys(blocks).length === 0) return;

    playTrack();
    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const stopUIUpdates = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    props.audioContext.suspend();
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
        <p>{currentTime}</p>
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
            currentTime={currentTime}
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
