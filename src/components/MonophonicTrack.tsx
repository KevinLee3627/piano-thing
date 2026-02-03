import { useAppSelector } from '@/app/hooks';
import type { useResizeObserver } from '@/hooks/useResizeObserver';
import { cn } from '@/lib/utils';
import { Block } from './Block';
import { Keyboard } from './Keyboard';

interface MonophonicTrackProps {
  trackId: string;
  trackDimensions: ReturnType<typeof useResizeObserver>['dimensions'];
}

export const MonophonicTrack = (props: MonophonicTrackProps) => {
  const track = useAppSelector((state) => state.tracks[props.trackId]);
  return (
    <div className={cn(track.isExpanded ? 'h-96' : 'h-16', 'border-b')}>
      {!track.isExpanded && (
        <div className='h-4 relative'>
          {Object.entries(track.blocks).map(([blockId, block]) => (
            <Block
              key={blockId}
              trackId={props.trackId}
              {...block}
              trackDimensions={props.trackDimensions}
            />
          ))}
        </div>
      )}
      {track.isExpanded && <Keyboard trackId={props.trackId} />}
    </div>
  );
};
