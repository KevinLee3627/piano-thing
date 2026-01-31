import { Track } from '../components/Track';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGlobalAudioContext } from '../context/audioContext';
import { trackSlice } from '../app/trackSlice';
import { useEffect, useRef, useState } from 'react';
import { Playhead } from './Playhead';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { TickMarks } from './TickMarks';

const FPS = 60;
const MS_PER_FRAME = 1000 / FPS;

export function Timeline() {
  const dispatch = useAppDispatch();
  const tracks = useAppSelector((state) => state.tracks);
  const project = useAppSelector((state) => state.project);

  const { ref: timelineRef, dimensions: timelineDimensions } =
    useResizeObserver<HTMLDivElement>();

  const audioContext = useGlobalAudioContext();

  const [playbackTime, setPlaybackTime] = useState(0); // NOTE: Used for ui/animation/rendering
  const animationRef = useRef<number>(null);
  const msPrev = useRef(audioContext.currentTime);
  const updateUITime = () => {
    if (audioContext == null) return;

    const msNow = audioContext.currentTime;
    const msPassed = (msNow - msPrev.current) * 1000;

    if (msPassed > MS_PER_FRAME) {
      setPlaybackTime(msNow);
      msPrev.current = msNow;
    }

    // NOTE: We calculate directly so we can stop at the correct time.
    // Other places (like the check above) uses the stored state for UI/rendering purposes.
    if (audioContext.currentTime >= project.totalDuration) {
      stop();
      return;
    }

    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const startPlaybackAndUIUpdates = async () => {
    if (playbackTime === 0) {
      Object.values(tracks).forEach((track) =>
        dispatch(trackSlice.actions.startTrack({ trackId: track.trackId })),
      );
    } else {
      await audioContext.resume();
    }

    // Start RAF loop
    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const pause = async () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    await audioContext.suspend();
    Object.values(tracks).forEach((track) =>
      dispatch(trackSlice.actions.stopTrack({ trackId: track.trackId })),
    );
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button onClick={async () => await startPlaybackAndUIUpdates()}>
        play {playbackTime}
      </button>
      <button onClick={async () => await pause()}>pause</button>
      <div
        style={{
          flexGrow: 1,
          height: '50%',
          width: '80%',
          margin: '0 auto',
          overflowX: 'scroll',
        }}
      >
        <div
          style={{
            border: '1px solid black',
            position: 'relative',
            height: '50%',
            width: `${project.pxPerMeasureScale * project.totalMeasures}px`,
          }}
          ref={timelineRef}
        >
          <TickMarks trackElemWidth={timelineDimensions.width} />
          <Playhead
            currentTime={playbackTime}
            trackDimensions={timelineDimensions}
          />
          {Object.keys(tracks).map((trackId) => {
            return (
              <Track
                trackId={trackId}
                key={trackId}
                trackDimensions={timelineDimensions}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
