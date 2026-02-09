import { useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';
import { Keyboard } from './Keyboard';
import { Block } from './Block';
import type { useResizeObserver } from '@/hooks/useResizeObserver';

interface PolyphonicTrackProps {
  trackId: string;
  trackDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
}

export const PolyphonicTrack = (props: PolyphonicTrackProps) => {
  const track = useAppSelector((state) => state.tracks[props.trackId]);
  return (
    <div
      className={cn(
        track.isExpanded ? 'h-96' : 'h-16',
        'border-b',
        'overflow-auto',
      )}
    >
      <div className='h-full relative'>
        {Object.entries(track.blocks).map(([blockId, block]) => (
          <Block
            key={blockId}
            trackId={props.trackId}
            {...block}
            trackDimensions={props.trackDimensions}
          />
        ))}
      </div>
      <Keyboard trackId={props.trackId} />
    </div>
  );
};
