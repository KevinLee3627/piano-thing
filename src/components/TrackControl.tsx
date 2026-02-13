import { trackSlice, type Track } from '@/app/trackSlice';
import { Switch } from './ui/switch';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { TrackDialog } from './TrackDialog';

interface TrackControlProps {
  trackId: Track['trackId'];
}

export const TrackControl = ({ trackId }: TrackControlProps) => {
  const dispatch = useAppDispatch();
  const track = useAppSelector((state) => state.tracks[trackId]);

  return (
    <div>
      <p>{track.name}</p>
      <TrackDialog mode='edit' trackId={track.trackId} />
      <Switch
        id={`track-${track.trackId}-quantize-toggle`}
        checked={track.isQuantized}
        onCheckedChange={(checked) =>
          dispatch(
            trackSlice.actions.setTrackQuantized({
              trackId: track.trackId,
              isQuantized: checked,
            }),
          )
        }
      />
      <p>Q.Res: {track.quantizationResolution}</p>
    </div>
  );
};
