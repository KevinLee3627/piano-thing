import { Track } from '../components/Track';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGlobalAudioContext } from '../context/audioContext';
import { trackSlice } from '../app/trackSlice';
import { useEffect, useRef, useState } from 'react';
import { Playhead } from './Playhead';
import { TickMarks } from './TickMarks';
import { Separator } from './ui/separator';
import { TrackControl } from './TrackControl';
import { TrackDialog } from './TrackDialog';
import { projectSlice } from '@/app/projectSlice';
import { ControlBar } from './ControlBar';

const FPS = 60;
const MS_PER_FRAME = 1000 / FPS;

export function Timeline() {
  const dispatch = useAppDispatch();
  const tracks = useAppSelector((state) => state.tracks);
  const project = useAppSelector((state) => state.project);

  const audioContext = useGlobalAudioContext();

  const [playbackTime, setPlaybackTime] = useState(0); // NOTE: Used for ui/animation/rendering

  // NOTE: this ref is used to check when to stop the track
  // the playbackTime state is not available in the updateUITime closure
  // so we need to keep track of it in a ref
  const playbackTimeRef = useRef(playbackTime);
  useEffect(() => {
    playbackTimeRef.current = playbackTime;
  }, [playbackTime]);

  const animationRef = useRef<number>(null);
  const msPrev = useRef(audioContext.currentTime);
  const updateUITime = () => {
    if (audioContext == null) return;

    const msNow = audioContext.currentTime;
    const msPassed = (msNow - msPrev.current) * 1000;

    if (msPassed > MS_PER_FRAME) {
      setPlaybackTime((prevPlaybackTime) => prevPlaybackTime + msPassed / 1000);
      msPrev.current = msNow;
    }

    // NOTE: We calculate directly so we can stop at the correct time.
    // Other places (like the check above) uses the stored state for UI/rendering purposes.
    if (playbackTimeRef.current >= project.totalDuration) {
      pause();
      return;
    }

    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const startPlaybackAndUIUpdates = async () => {
    await audioContext.resume();

    Object.values(tracks).forEach((track) =>
      dispatch(
        trackSlice.actions.setTrackPlaying({
          trackId: track.trackId,
          isPlaying: true,
        }),
      ),
    );

    // Start RAF loop
    animationRef.current = requestAnimationFrame(updateUITime);
  };

  const pause = async () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    await audioContext.suspend();
    Object.values(tracks).forEach((track) =>
      dispatch(
        trackSlice.actions.setTrackPlaying({
          trackId: track.trackId,
          isPlaying: false,
        }),
      ),
    );
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const topRowRef = useRef<HTMLDivElement>(null);
  const trackRailRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handles auto-scroll of timeline
  useEffect(() => {
    if (topRowRef.current == null) return;
    // NOTE: Halfway mark of the visible portion of the timeline
    const currentPlayheadLeft =
      (playbackTime / project.totalDuration) *
      project.pxPerMeasureScale *
      project.totalMeasures;
    const halfwayMark = topRowRef.current.offsetWidth / 2;
    const isPastHalfway = currentPlayheadLeft > halfwayMark;

    if (isPastHalfway) {
      // NOTE: What is the 'velocity' of the playhead? That = scroll speed?
      topRowRef.current.scrollLeft += project.pxPerSecondScale / FPS;
      Object.values(trackRailRefs.current).forEach((railElem) => {
        if (railElem == null || topRowRef.current == null) return;
        railElem.scrollLeft = topRowRef.current.scrollLeft;
      });
    }
  }, [playbackTime]);

  return (
    <div className='flex flex-col h-full border border-border rounded-md'>
      <ControlBar
        startPlaybackAndUIUpdates={startPlaybackAndUIUpdates}
        pause={pause}
        playbackTime={playbackTime}
      />
      <Separator />
      <div className='flex'>
        <div className='min-w-48 max-w-48 border-r'>
          <TrackDialog mode='create' />
        </div>
        <div
          className='overflow-x-scroll ml-12 no-scrollbar'
          onScroll={(e) => {
            dispatch(
              projectSlice.actions.updateTimelineScrollLeft(
                e.currentTarget.scrollLeft,
              ),
            );
            Object.values(trackRailRefs.current).forEach((railElem) => {
              if (railElem == null || topRowRef.current == null) return;
              railElem.scrollLeft = topRowRef.current.scrollLeft;
            });
          }}
          ref={topRowRef}
        >
          <div
            style={{
              width: `${project.pxPerMeasureScale * project.totalMeasures}px`,
            }}
            className='relative shrink-0'
          >
            <div
              className='h-12 border-b sticky top-0 overflow-y-hidden'
              // TODO: We should be able to drag
              // TODO: When clicking multiple times at the same point, blocks are repeated,
              // like the last 'round' keeps playing. That's b/c blocks are still 'queued' up...fix later
              // TODO: This really feels like it should be in TickMarks. Maybe have TickMarks be full height?
              onClick={async (e) => {
                pause();
                const rect = e.currentTarget.getBoundingClientRect();

                const totalPx =
                  project.totalMeasures * project.pxPerMeasureScale;
                const playbackTime =
                  ((e.clientX - rect.left) / totalPx) * project.totalDuration;
                setPlaybackTime(playbackTime);
              }}
            >
              <TickMarks />
              <Playhead
                playbackTime={playbackTime}
                railLeft={topRowRef.current?.offsetLeft ?? 0}
                setPlaybackTime={setPlaybackTime}
                pause={pause}
                play={startPlaybackAndUIUpdates}
              />
            </div>
          </div>
        </div>
      </div>
      <div className='flex-col'>
        <div id='dummy-rail-container' className='flex'>
          <div className='min-w-48 max-w-48'></div>
          <div
            style={{
              width: `${project.pxPerMeasureScale * project.totalMeasures}px`,
            }}
          ></div>
        </div>
        {Object.values(tracks).map((track) => (
          <div key={`track-container-${track.trackId}`} className='flex'>
            <div className='min-w-48 max-w-48 border-r'>
              <TrackControl
                key={`track-${track.trackId}-controls`}
                trackId={track.trackId}
              />
            </div>
            <div
              data-my-label='rail'
              className='overflow-x-scroll no-scrollbar'
              ref={(el) => {
                trackRailRefs.current[track.trackId] = el;
              }}
              onScroll={(e) => {
                // Only sync if user scrolled this rail
                if (
                  topRowRef.current &&
                  e.currentTarget.scrollLeft !== topRowRef.current.scrollLeft
                ) {
                  topRowRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              {/* TODO: 48 = width of the piano keys. How can we not hard-code this */}
              <div
                style={{
                  width: `${project.pxPerMeasureScale * project.totalMeasures + 48}px`,
                }}
              >
                <Track
                  key={`track-${track.trackId}`}
                  trackId={track.trackId}
                  playbackTime={playbackTime}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
