import { Track } from '../components/Track';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGlobalAudioContext } from '../context/audioContext';
import { trackSlice } from '../app/trackSlice';
import { useEffect, useRef } from 'react';
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

  const playbackTimeRef = useRef(0);

  const animationRef = useRef<number>(null);
  const msPrev = useRef(audioContext.currentTime);
  const updateUITime = () => {
    if (audioContext == null) return;

    const msNow = audioContext.currentTime;
    const msPassed = (msNow - msPrev.current) * 1000;

    if (msPassed > MS_PER_FRAME) {
      playbackTimeRef.current += msPassed / 1000;
      msPrev.current = msNow;
      if (topRowRef.current) {
        const currentPlayheadLeft =
          (playbackTimeRef.current / project.totalDuration) *
          project.pxPerMeasureScale *
          project.totalMeasures;
        const viewportWidth = topRowRef.current.offsetWidth;
        const totalTrackWidth =
          project.pxPerMeasureScale * project.totalMeasures;
        const halfwayMark = viewportWidth / 2;
        const maxScrollLeft = totalTrackWidth - viewportWidth;

        // start scrolling once the playhead passes halfway mark of timeline
        if (currentPlayheadLeft > halfwayMark && maxScrollLeft > 0) {
          // Advance scroll by exactly how far the playhead moved this frame,
          // so the playhead stays centered
          const scrollDelta = project.pxPerSecondScale * (msPassed / 1000);
          const newScrollLeft = topRowRef.current.scrollLeft + scrollDelta;
          topRowRef.current.scrollLeft = newScrollLeft;
          Object.values(trackRailRefs.current).forEach((railElem) => {
            if (railElem == null) return;
            railElem.scrollLeft = newScrollLeft;
          });
        }
      }
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
    msPrev.current = audioContext.currentTime; // reset here
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

  return (
    <div className='flex flex-col max-h-full border border-border rounded-md overflow-hidden'>
      <ControlBar
        startPlaybackAndUIUpdates={startPlaybackAndUIUpdates}
        pause={pause}
        playbackTimeRef={playbackTimeRef}
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
                playbackTimeRef.current = playbackTime;
              }}
            >
              <TickMarks />
              <Playhead
                railLeft={topRowRef.current?.offsetLeft ?? 0}
                playbackTimeRef={playbackTimeRef}
                pause={pause}
                play={startPlaybackAndUIUpdates}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        id='all-tracks-container'
        className='overflow-y-auto'
        onScroll={(e) => {
          dispatch(
            projectSlice.actions.updateTimelineScrollTop(
              e.currentTarget.scrollTop,
            ),
          );
        }}
      >
        <div id='dummy-rail-container' className='flex'>
          <div className='min-w-48 max-w-48'></div>
          <div
            style={{
              width: `${project.pxPerMeasureScale * project.totalMeasures}px`,
            }}
          ></div>
        </div>
        {Object.values(tracks).map((track) => (
          <div
            key={`track-container-${track.trackId}`}
            className='flex border-b-8'
          >
            <div className='min-w-48 max-w-48 border-r border-b'>
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
                if (el && topRowRef.current) {
                  el.scrollLeft = topRowRef.current.scrollLeft;
                }
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
                  playbackTimeRef={playbackTimeRef}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
