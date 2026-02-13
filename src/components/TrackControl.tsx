import { trackSlice, type Track } from '@/app/trackSlice';
import { Switch } from './ui/switch';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

interface TrackControlProps {
  trackId: Track['trackId'];
}

export const TrackControl = ({ trackId }: TrackControlProps) => {
  const dispatch = useAppDispatch();
  const track = useAppSelector((state) => state.tracks[trackId]);

  return (
    <div>
      <p>{track.name}</p>
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
      <p>{track.quantizationResolution}</p>
    </div>
  );
};
