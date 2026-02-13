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
  const project = useAppSelector((state) => state.project);

  return (
    <div>
      <p>{track.name}</p>
      <TrackDialog mode='edit' trackId={track.trackId} />
      <Switch
        id={`track-${track.trackId}-quantize-toggle`}
        checked={track.isQuantized}
        onCheckedChange={(checked) => {
          dispatch(
            trackSlice.actions.setTrackQuantized({
              trackId: track.trackId,
              isQuantized: checked,
            }),
          );
          // TODO: Can we not make this 20 levels indented
          // Quantizes all blocks when switching on
          if (checked) {
            const snapPointGap =
              project.secondsPerMeasure /
              project.beatsPerMeasure /
              track.quantizationResolution;

            Object.values(track.blocks).forEach((block) => {
              const snappedStartTime =
                Math.round(block.startTime / snapPointGap) * snapPointGap;
              dispatch(
                trackSlice.actions.editBlock({
                  trackId: track.trackId,
                  blockId: block.blockId,
                  startTime: snappedStartTime,
                  dims: {
                    ...block.dims,
                    left: snappedStartTime * project.pxPerSecondScale,
                  },
                }),
              );
            });
          }
        }}
      />
      <p>Q.Res: {track.quantizationResolution}</p>
    </div>
  );
};
