// TODO: Needs a btter name...

import { trackSlice, type Track } from '@/app/trackSlice';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useAppDispatch } from '@/app/hooks';

interface TrackControlProps {
  track: Track;
}

export const TrackControl = ({ track }: TrackControlProps) => {
  const dispatch = useAppDispatch();

  return (
    <>
      <div className='h-16'>
        <p>{track.name}</p>
        <Switch
          id={`track-${track.trackId}-expand-toggle`}
          onCheckedChange={(checked) => {
            console.log(`checked :${checked}`);

            return dispatch(
              checked
                ? trackSlice.actions.collapseTrack({
                    trackId: track.trackId,
                  })
                : trackSlice.actions.expandTrack({
                    trackId: track.trackId,
                  }),
            );
          }}
        />
        <Label htmlFor={`track-${track.trackId}-expand-toggle`}>Expand</Label>
        <span>{track.isExpanded}</span>
      </div>
      <Separator />
    </>
  );
};
