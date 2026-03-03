import {
  QUANTIZATION_RESOLUTION,
  trackSlice,
  type Track,
} from '@/app/trackSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { TrackDialog } from './TrackDialog';
import { Toggle } from './ui/toggle';
import { MagnetIcon, Trash2Icon, Volume2Icon } from 'lucide-react';
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
import { useForm } from '@tanstack/react-form';
import { noteSchema, validateMinMaxNotes } from '@/util/trackValidation';
import type { NoteNameWithOctave } from '@/util/noteUtils';
import { Field, FieldError } from './ui/field';
import { useEffect } from 'react';
import { Slider } from './ui/slider';

interface TrackControlProps {
  trackId: Track['trackId'];
}

export const TrackControl = ({ trackId }: TrackControlProps) => {
  const dispatch = useAppDispatch();
  const track = useAppSelector((state) => state.tracks[trackId]);
  const project = useAppSelector((state) => state.project);

  const form = useForm({
    defaultValues: {
      name: track.name,
      isQuantized: track.isQuantized,
      quantizationResolution: track.quantizationResolution,
      minNote: track.minNote as string,
      maxNote: track.maxNote as string,
      volume: track.volume ?? 1,
    },
    validators: {
      onBlur: ({ value }) => {
        if (!validateMinMaxNotes(value.minNote, value.maxNote)) {
          return {
            message: 'The minimum note must be below the maximum note.',
          };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      dispatch(
        trackSlice.actions.editTrack({
          trackId: track.trackId,
          name: value.name,
          isQuantized: value.isQuantized,
          quantizationResolution: value.quantizationResolution,
          minNote: value.minNote as NoteNameWithOctave,
          maxNote: value.maxNote as NoteNameWithOctave,
          volume: value.volume,
        }),
      );

      // Snap to grid if quantized is being turned on
      if (value.isQuantized) {
        dispatch(
          trackSlice.actions.snapBlocksToGrid({
            trackId: track.trackId,
            secondsPerMeasure: project.secondsPerMeasure,
            beatsPerMeasure: project.beatsPerMeasure,
            pxPerSecondScale: project.pxPerSecondScale,
          }),
        );
      }
    },
  });

  // Forces form to reset when track is updated elsewhere (like in the edit dialog)
  useEffect(() => {
    form.reset({
      name: track.name,
      isQuantized: track.isQuantized,
      quantizationResolution: track.quantizationResolution,
      minNote: track.minNote as string,
      maxNote: track.maxNote as string,
      volume: track.volume ?? 1,
    });
  }, [track]);

  return (
    <div className='h-full p-2 '>
      <form
        className='flex flex-col gap-2'
        onSubmit={(e) => e.preventDefault()} // add this
        onBlur={() => {
          if (form.state.isValid) {
            form.handleSubmit();
          }
        }}
      >
        <form.Field
          name='name'
          validators={{
            onBlur: ({ value }) =>
              value.trim().length === 0
                ? { message: 'Name cannot be empty.' }
                : undefined,
          }}
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  placeholder='Track name'
                  className='font-medium'
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
        <div className='flex gap-2'>
          <form.Field
            name='isQuantized'
            children={(field) => (
              <Toggle
                variant={'outline'}
                pressed={field.state.value}
                onPressedChange={(pressed) => {
                  field.handleChange(pressed);
                  // submit immediately on toggle change
                  form.handleSubmit();
                }}
              >
                <MagnetIcon />
              </Toggle>
            )}
          />
          <form.Field
            name='quantizationResolution'
            children={(field) => (
              <Select
                value={String(field.state.value)}
                onValueChange={(value) => {
                  field.handleChange(Number(value));
                  // submit immediately on select change
                  form.handleSubmit();
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
            )}
          />
        </div>
        <div className='flex gap-2'>
          <form.Field
            name='minNote'
            validators={{
              onBlur: ({ value }) => {
                const result = noteSchema.safeParse(value);
                return result.success
                  ? undefined
                  : { message: result.error.issues[0]?.message };
              },
            }}
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name='maxNote'
            validators={{
              onBlur: ({ value }) => {
                const result = noteSchema.safeParse(value);
                return result.success
                  ? undefined
                  : { message: result.error.issues[0]?.message };
              },
            }}
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>
        {/* Form-level error for min > max */}
        <form.Subscribe selector={(state) => state.errors}>
          {(errors) => errors.length > 0 && <FieldError errors={errors} />}
        </form.Subscribe>
        <form.Field
          name='volume'
          children={(field) => (
            <div className='flex items-center gap-2'>
              <Volume2Icon className='size-4 shrink-0 text-muted-foreground' />
              <Slider
                min={0}
                max={100}
                value={[Math.round(field.state.value * 100)]}
                onValueChange={([val]) => {
                  field.handleChange(val / 100);
                }}
              />
            </div>
          )}
        />
        <div className='flex justify-between'>
          <TrackDialog mode='edit' trackId={track.trackId} />
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
      </form>
    </div>
  );
};
