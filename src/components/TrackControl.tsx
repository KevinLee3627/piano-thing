import {
  QUANTIZATION_RESOLUTION,
  trackSlice,
  type Track,
} from '@/app/trackSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { TrackDialog } from './TrackDialog';
import { Toggle } from './ui/toggle';
import { MagnetIcon, Trash2Icon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';

interface TrackControlProps {
  trackId: Track['trackId'];
}

export const TrackControl = ({ trackId }: TrackControlProps) => {
  const dispatch = useAppDispatch();
  const track = useAppSelector((state) => state.tracks[trackId]);
  const project = useAppSelector((state) => state.project);

  return (
    <div className='h-full p-2 flex flex-col gap-2'>
      <p>{track.name}</p>
      <TrackDialog mode='edit' trackId={track.trackId} />
      <div className='flex gap-2'>
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
        <Select
          defaultValue={String(track.quantizationResolution)}
          onValueChange={(value) => {
            const newResolution = Number(value);
            dispatch(
              trackSlice.actions.setTrackQuantizationResolution({
                trackId: track.trackId,
                quantizationResolution: newResolution,
              }),
            );
          }}
        >
          <SelectTrigger className='w-full max-w-48'>
            <SelectValue placeholder='Quant. Res' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Quantization Resolution</SelectLabel>
              {[...new Array(QUANTIZATION_RESOLUTION.MAX)].map((_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className='flex gap-2'>
        <Input defaultValue={track.minNote} />
        <Input defaultValue={track.maxNote} />
      </div>
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={'destructive'}>
              <Trash2Icon />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This will permanently delete this track.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant={'outline'}>Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  variant={'destructive'}
                  onClick={() =>
                    dispatch(trackSlice.actions.deleteTrack({ trackId }))
                  }
                >
                  Delete
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
