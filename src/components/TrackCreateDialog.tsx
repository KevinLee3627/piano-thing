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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from './ui/field';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import * as z from 'zod';
import { useForm } from '@tanstack/react-form';
import { useAppDispatch } from '@/app/hooks';
import { QUANTIZATION_RESOLUTION, trackSlice } from '@/app/trackSlice';
import { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';

// TODO: where should we set quantization resolution options?

const trackCreateFormSchema = z
  .object({
    name: z.string().min(1, 'Track name must be at least 1 character long.'),
    polyphony: z.enum(['monophonic', 'polyphonic']),
    isQuantized: z.boolean(),
    quantizationResolution: z
      .int()
      .min(QUANTIZATION_RESOLUTION.MIN)
      .max(QUANTIZATION_RESOLUTION.MAX)
      .array(),
  })
  .required();

type TrackCreateFormSchema = z.infer<typeof trackCreateFormSchema>;

export const TrackCreateDialog = () => {
  const dispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: `New Track`,
      polyphony: 'polyphonic',
      isQuantized: false,
      quantizationResolution: [1],
    },
    validators: {
      onSubmit: trackCreateFormSchema,
    },
    onSubmit: async ({ value }) => {
      dispatch(
        trackSlice.actions.addTrack({
          polyphony: value.polyphony as TrackCreateFormSchema['polyphony'],
          name: value.name,
          minNote: 'A3',
          maxNote: 'A4',
          isQuantized: value.isQuantized,
          quantizationResolution: value.quantizationResolution[0],
        }),
      );
      setIsOpen(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form
        id='form-track-create'
        className='h-12 border-b'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <DialogTrigger asChild>
          <Button>Add Track</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Track</DialogTitle>
            <DialogDescription>Specify options for new track</DialogDescription>
          </DialogHeader>
          <form.Field
            name='name'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor='track-option-name'>
                    Track Name
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    type='text'
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name='polyphony'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <FieldSet>
                  <FieldLegend variant='label'>Polyphony</FieldLegend>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <FieldLabel htmlFor='track-option-monophonic'>
                      <Field orientation='horizontal' data-invalid={isInvalid}>
                        <RadioGroupItem
                          value='monophonic'
                          id='track-option-monophonic'
                          aria-invalid={isInvalid}
                        />
                        <FieldContent>
                          <FieldTitle>Monophonic</FieldTitle>
                          <FieldDescription>
                            One pitch/sound only - used for rhythmic tracks
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor='track-option-polyphonic'>
                      <Field orientation='horizontal' data-invalid={isInvalid}>
                        <RadioGroupItem
                          value='polyphonic'
                          id='track-option-polyphonic'
                          aria-invalid={isInvalid}
                        />
                        <FieldContent>
                          <FieldTitle>Polyphonic</FieldTitle>
                          <FieldDescription>
                            Multiple notes at a time
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  </RadioGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </FieldSet>
              );
            }}
          />
          <form.Field
            name='isQuantized'
            children={(field) => {
              return (
                <FieldSet>
                  <FieldLegend variant='label'>Quantization</FieldLegend>
                  <FieldGroup>
                    <Field orientation='horizontal'>
                      <Checkbox
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          field.handleChange(!!checked);
                        }}
                        onBlur={field.handleBlur}
                      />
                      <FieldLabel htmlFor={field.name}>Quantize</FieldLabel>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              );
            }}
          />
          <form.Field
            name='quantizationResolution'
            children={(field) => {
              return (
                <FieldSet>
                  <FieldLegend variant='label'>
                    Quantization Resolution
                  </FieldLegend>
                  <FieldGroup>
                    <Field>
                      <Slider
                        id={field.name}
                        value={field.state.value}
                        onValueChange={(values) => {
                          field.handleChange(values);
                        }}
                        min={QUANTIZATION_RESOLUTION.MIN}
                        max={QUANTIZATION_RESOLUTION.MAX}
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
              );
            }}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <Button type='submit' form='form-track-create'>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};
