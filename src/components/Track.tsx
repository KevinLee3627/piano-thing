import { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Block } from './Block';
import { Playhead } from './Playhead';
import { useGlobalAudioContext } from '../context/audioContext';
import { Keyboard } from './Keyboard';
import { trackSlice } from '../app/trackSlice';

const FPS = 60;
const MS_PER_FRAME = 1000 / FPS;

interface TrackProps {
  trackId: string;
}

export const Track = (props: TrackProps) => {
  const audioContext = useGlobalAudioContext();
  const dispatch = useAppDispatch();

  const project = useAppSelector((state) => state.project);

  const trackStartTime = useRef(audioContext.currentTime);
  const [playbackTime, setPlaybackTime] = useState(0); // NOTE: Used for ui/animation/rendering
  const { ref: trackRef, dimensions: trackDimensions } = useResizeObserver();
  const track = useAppSelector((state) => state.tracks[props.trackId]);

  const playTrack = () => {
    Object.values(track.blocks).forEach((block) => {
      const startTime = audioContext.currentTime + block.startTime;
      const duration = block.duration;

      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(
        block.frequency,
        audioContext.currentTime,
      );

      const gainNode = audioContext.createGain();

      gainNode.gain.setValueAtTime(block.gain, startTime);
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
    if (currentPlaybackTime >= project.totalDuration) {
      stopUIUpdates();
      return;
    }

    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const startPlaybackAndUIUpdates = () => {
    if (Object.keys(track.blocks).length === 0) return;
    setPlaybackTime(0);
    trackStartTime.current = audioContext.currentTime;
    playTrack();
    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const stopUIUpdates = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    dispatch(trackSlice.actions.stopTrack({ trackId: props.trackId }));
  };

  // Triggered by button to play all tracksa t once
  useEffect(() => {
    if (track.isPlaying) {
      startPlaybackAndUIUpdates();
    }
  }, [track.isPlaying]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // TODO: Implement scrolling by having like a 'frame' and 'window' setup - where the 'window'
  // is really long but hidden by the 'frame', and we jnust scroll horizontally
  return (
    <div
      style={{
        height: '100%',
        width: '80%',
        margin: '0 auto',
        overflowX: 'scroll',
      }}
    >
      <div
        style={{
          height: '50%',
          border: '1px solid black',
          position: 'relative',
          width: `${project.pxPerSecScale * project.totalDuration}px`,
        }}
        ref={trackRef}
      >
        <Playhead
          trackDimensions={trackDimensions}
          currentTime={playbackTime}
        />
        {Object.entries(track.blocks).map(([blockId, block]) => (
          <Block
            key={blockId}
            trackId={props.trackId}
            {...block}
            trackDimensions={trackDimensions}
          />
        ))}
      </div>
      <button onClick={startPlaybackAndUIUpdates}>start thist rack</button>
      <Keyboard trackId={props.trackId} />
    </div>
  );
};

interface TickMarksProps {
  num: number;
  trackElemWidth: number;
}

const TickMarks = (props: TickMarksProps) => {
  const project = useAppSelector((state) => state.project);

  return (
    <div style={{ position: 'relative', height: '1rem' }}>
      {Array.from({ length: props.num })
        .fill(0)
        .map((_, i) => {
          const left = props.trackElemWidth * (i / props.num);
          return (
            <div
              key={`tick-${i}`}
              style={{
                border: '1px dashed blue',
                position: 'absolute',
                left: `${left}px`,
                top: '-1.25rem',
              }}
            >
              {(i / props.num) * project.totalDuration}
            </div>
          );
        })}
    </div>
  );
};
