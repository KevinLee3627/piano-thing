import { trackSlice, type Track } from '@/app/trackSlice';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';

interface TrackControlProps {
  trackId: Track['trackId'];
}

export const TrackControl = ({ trackId }: TrackControlProps) => {
  const dispatch = useAppDispatch();
  const track = useAppSelector((state) => state.tracks[trackId]);

  return (
    <div className={cn(track.isExpanded ? 'h-96' : 'h-16', 'border-b')}>
      <p>{track.name}</p>
      <Switch
        id={`track-${track.trackId}-expand-toggle`}
        onCheckedChange={(checked) =>
          dispatch(
            checked
              ? trackSlice.actions.expandTrack({
                  trackId: track.trackId,
                })
              : trackSlice.actions.collapseTrack({
                  trackId: track.trackId,
                }),
          )
        }
      />
      <Label htmlFor={`track-${track.trackId}-expand-toggle`}>Expand</Label>
    </div>
  );
};
