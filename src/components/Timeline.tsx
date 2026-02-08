import { Track } from '../components/Track';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGlobalAudioContext } from '../context/audioContext';
import { trackSlice } from '../app/trackSlice';
import { useEffect, useRef, useState } from 'react';
import { Playhead } from './Playhead';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { TickMarks } from './TickMarks';
import { Button } from './ui/button';
import { PauseIcon, PlayIcon } from 'lucide-react';
import { Separator } from './ui/separator';
import { TrackControl } from './TrackControl';
import { TrackCreateDialog } from './TrackCreateDialog';
import { projectSlice } from '@/app/projectSlice';

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
      alert('stop');
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
    <div className='flex flex-col h-full border border-border rounded-md'>
      <div id='top-bar' className='flex h-12 justify-center items-center m-2'>
        <Button
          className='rounded-full'
          onClick={async () => await startPlaybackAndUIUpdates()}
        >
          <PlayIcon />
        </Button>
        <Button className='rounded-full' onClick={async () => await pause()}>
          <PauseIcon />
        </Button>
      </div>
      <p>playback {playbackTime}</p>
      <p>audiocontext time {audioContext.currentTime}</p>
      <Separator />
      <div className='flex'>
        <div id='left-column' className='min-w-48 max-w-48 border-r'>
          <TrackCreateDialog />
          <Separator />
          <div>
            {Object.values(tracks).map((track) => (
              <TrackControl
                key={`track-${track.trackId}-controls`}
                trackId={track.trackId}
              />
            ))}
          </div>
        </div>
        <div
          id='right-column'
          className='overflow-x-scroll'
          onScroll={(e) => {
            const newScrollLeft = e.currentTarget.scrollLeft;
            dispatch(
              projectSlice.actions.updateTimelineScrollLeft(newScrollLeft),
            );
          }}
        >
          <div
            id='timeline-container'
            style={{
              width: `${project.pxPerMeasureScale * project.totalMeasures}px`,
            }}
            className='relative shrink-0'
            ref={timelineRef}
          >
            <div className='h-12'>
              <TickMarks trackElemWidth={timelineDimensions.width} />
              <Playhead
                currentTime={playbackTime}
                trackDimensions={timelineDimensions}
                setPlaybackTime={setPlaybackTime}
              />
            </div>
            <Separator />
            {Object.keys(tracks).map((trackId) => (
              <Track
                key={`track-${trackId}`}
                trackId={trackId}
                trackDimensions={timelineDimensions}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
