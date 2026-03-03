import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  projectRegistrySlice,
  selectActiveProject,
} from '@/app/projectRegistrySlice';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '../ui/dialog';
import { MenubarItem } from '../ui/menubar';
import { useState } from 'react';
import { Button } from '../ui/button';
import { DialogTitle } from '@/components/ui/dialog';
import z from 'zod';
import { useForm } from '@tanstack/react-form';
import { projectSlice } from '@/app/projectSlice';
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';

// TODO: Thse are hard coded in the Timeline time sig editor as well...ddefinne osmewhere else?
const BEAT_VALUE_OPTIONS = [1, 2, 4, 8, 16];
const BPM = {
  MIN: 1,
  MAX: 600,
};

const createProjectFormSchema = z.object({
  name: z.string().min(1, 'Project name must not be blank.'),
  beatsPerMinute: z
    .int('BPM must be a whole number')
    .min(BPM.MIN, 'BPM must be at least 1.')
    .max(BPM.MAX, 'BPM must be 600 or less'),
  beatsPerMeasure: z
    .int('Beats per measure must be a whole number.')
    .min(1, 'Beats per measure must be at least 1.'),
  beatValue: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(8),
    z.literal(16),
  ]),
});

export const CreateProjectDialog = () => {
  const dispatch = useAppDispatch();

  const activeProject = useAppSelector(selectActiveProject);
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);

  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: 'New Project',
      beatsPerMinute: 120,
      beatsPerMeasure: 4,
      beatValue: 4,
    },
    validators: {
      onSubmit: createProjectFormSchema,
    },
    onSubmit: ({ value }) => {
      dispatch(
        projectRegistrySlice.actions.saveSnapshot({
          id: activeProject.id,
          projectState: project,
          tracksState: tracks,
        }),
      );

      dispatch(
        projectRegistrySlice.actions.createProject({
          name: value.name,
        }),
      );

      dispatch(projectSlice.actions.setBeatsPerMinute(value.beatsPerMinute));

      dispatch(
        projectSlice.actions.setTimeSignature({
          beatsPerMeasure: value.beatsPerMeasure,
          beatValue: 1 / value.beatValue,
        }),
      );

      setIsOpen(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <MenubarItem
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
        >
          New Project
        </MenubarItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          {/* Project Name */}
          <form.Field
            name='name'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Project Name</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type='text'
                    placeholder='My Project'
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* BPM */}
          <form.Field
            name='beatsPerMinute'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>BPM</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value, 10))
                    }
                    type='number'
                    min={BPM.MIN}
                    max={BPM.MAX}
                    placeholder='120'
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Time Signature */}
          <div className='flex gap-4'>
            {/* Beats Per Measure */}
            <form.Field
              name='beatsPerMeasure'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className='flex-1'>
                    <FieldLabel htmlFor={field.name}>
                      Beats per Measure
                    </FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(parseInt(e.target.value, 10))
                      }
                      type='number'
                      min={1}
                      placeholder='4'
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Beat Value */}
            <form.Field
              name='beatValue'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className='flex-1'>
                    <FieldLabel htmlFor={field.name}>Beat Value</FieldLabel>
                    <Select
                      value={String(field.state.value)}
                      onValueChange={(v) => field.handleChange(Number(v))}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BEAT_VALUE_OPTIONS.map((v) => (
                          <SelectItem key={v} value={String(v)}>
                            1/{v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </div>
        </FieldGroup>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant={'outline'}>Cancel</Button>
          </DialogClose>
          <Button type='button' onClick={() => form.handleSubmit()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
