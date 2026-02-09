import { useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';
import { Block } from './Block';
import type { useResizeObserver } from '@/hooks/useResizeObserver';
import { noteMapping } from '@/util/noteUtils';
import { useMemo, useRef } from 'react';

interface PolyphonicTrackProps {
  trackId: string;
  railDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
}

export const PolyphonicTrack = (props: PolyphonicTrackProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const track = useAppSelector((state) => state.tracks[props.trackId]);

  const notes = useMemo(() => {
    // NOTE: Reverse b/c we want lower notes on the bottom
    const octaves = [3, 4, 5].reverse();
    return octaves.map((octave) => {
      return Object.keys(noteMapping)
        .reverse()
        .map((noteName) => (
          <div
            key={`note-${noteName}${octave}`}
            className={cn(
              'h-6',
              noteName.includes('#') ? 'bg-black' : 'bg-white',
              noteName.includes('#') ? 'text-white' : 'text-black',
            )}
          >
            {noteName}
            {octave}
          </div>
        ));
    });
  }, []);

  // To create note on click...count # of notes - calculate height of one note, divide height of container, find
  // clientY of mouse click - given the mouse position, calculate which note it would fall in

  return (
    <div
      className={cn(
        track.isExpanded ? 'h-96' : 'h-16',
        'border-b',
        'overflow-auto',
      )}
      ref={trackRef}
    >
      <p>{trackRef.current?.offsetHeight}</p>
      <div className='absolute'>{notes}</div>
      <div className='h-full relative'>
        {Object.entries(track.blocks).map(([blockId, block]) => (
          <Block
            key={blockId}
            trackId={props.trackId}
            {...block}
            trackDimensions={props.railDimensions}
          />
        ))}
      </div>
      {/* <Keyboard trackId={props.trackId} /> */}
    </div>
  );
};
