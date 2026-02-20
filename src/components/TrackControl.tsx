import { trackSlice, type Track } from '@/app/trackSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { TrackDialog } from './TrackDialog';
import { Toggle } from './ui/toggle';
import { MagnetIcon } from 'lucide-react';

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
      <Toggle
        variant={'outline'}
        pressed={track.isQuantized}
        onPressedChange={(pressed) => {
          dispatch(
            trackSlice.actions.setTrackQuantized({
              trackId: track.trackId,
              isQuantized: pressed,
            }),
          );
          if (!pressed) return;

          // Quantizes all blocks when switching on
          const snapPointGap =
            project.secondsPerMeasure /
            project.beatsPerMeasure /
            track.quantizationResolution;
          Object.values(track.blocks).forEach((block) => {
            const snappedStartTime =
              Math.round(block.startTime / snapPointGap) * snapPointGap;
            const snappedDuration =
              Math.round(block.duration / snapPointGap) * snapPointGap;
            const newLeft = snappedStartTime * project.pxPerSecondScale;
            const newWidth = snappedDuration * project.pxPerSecondScale;

            dispatch(
              trackSlice.actions.editBlock({
                trackId: track.trackId,
                blockId: block.blockId,
                startTime: snappedStartTime,
                duration: snappedDuration,
                dims: { ...block.dims, left: newLeft, width: newWidth },
              }),
            );
          });
        }}
      >
        <MagnetIcon />
      </Toggle>
      <p>Q.Res: {track.quantizationResolution}</p>
    </div>
  );
};
