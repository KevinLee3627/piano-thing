import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';
import { Block, BLOCK_HEIGHT } from './Block';
import type { useResizeObserver } from '@/hooks/useResizeObserver';
import { generateNoteRange, getNoteFreqByName } from '@/util/noteUtils';
import { useMemo, useRef } from 'react';
import { trackSlice } from '@/app/trackSlice';

interface PolyphonicTrackProps {
  trackId: string;
  railDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
}

export const PolyphonicTrack = (props: PolyphonicTrackProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const track = useAppSelector((state) => state.tracks[props.trackId]);
  const project = useAppSelector((state) => state.project);
  const dispatch = useAppDispatch();

  // NOTE: Reverse b/c we want lower notes on the bottom
  const notes = useMemo(() => generateNoteRange('A3', 'A4').reverse(), []);
  const noteElems = useMemo(() => {
    return notes.map((noteName) => (
      <div
        key={`note-${noteName}`}
        className={cn(
          'h-6',
          noteName.includes('#') ? 'bg-black' : 'bg-white',
          noteName.includes('#') ? 'text-white' : 'text-black',
        )}
      >
        {noteName}
      </div>
    ));
  }, []);

  // To create note on click...count # of notes - calculate height of one note, divide height of container, find
  // clientY of mouse click - given the mouse position, calculate which note it would fall in

  return (
    <div className='flex'>
      <div className='relative w-12'>{noteElems}</div>
      <div
        ref={trackRef}
        className='relative grow'
        onClick={(e) => {
          if (trackRef.current == null) return;
          const trackTop = trackRef.current.offsetTop;
          const trackLeft = trackRef.current.offsetLeft;

          const mouseY = e.clientY - trackTop;
          const mouseX = e.clientX - trackLeft;

          const clickedIndex = Math.floor(mouseY / BLOCK_HEIGHT);
          const noteName = notes[clickedIndex];

          const duration = project.secondsPerMeasure / project.beatsPerMeasure;
          const startTime = mouseX / project.pxPerSecondScale;
          dispatch(
            trackSlice.actions.addBlock({
              trackId: track.trackId,
              startTime,
              duration,
              frequency: getNoteFreqByName(`${noteName}`),
              gain: 1,
              dims: {
                left: startTime * project.pxPerSecondScale,
                maxLeft: project.totalDuration * project.pxPerSecondScale,
                width: duration * project.pxPerSecondScale,
                height: BLOCK_HEIGHT,
              },
            }),
          );
        }}
      >
        {Object.entries(track.blocks).map(([blockId, block]) => (
          <Block
            key={blockId}
            trackId={props.trackId}
            {...block}
            trackDimensions={props.railDimensions}
          />
        ))}
      </div>
    </div>
  );
};
