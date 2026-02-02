import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from './ui/field';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

export const TrackCreateDialog = () => {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button>Add Track</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Track</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor='track-option-name'>Track Name</FieldLabel>
            <Input id='track-option-name' type='text' placeholder='Track 1' />
          </Field>
          <FieldSet>
            <FieldLegend>Polyphony</FieldLegend>
            <FieldGroup>
              <RadioGroup>
                <FieldLabel htmlFor='track-option-monophonic'>
                  <Field orientation='horizontal'>
                    <RadioGroupItem
                      value='monophonic'
                      id='track-option-monophonic'
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
                  <Field orientation='horizontal'>
                    <RadioGroupItem
                      value='polyphonic'
                      id='track-option-polyphonic'
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
            </FieldGroup>
          </FieldSet>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <Button type='submit'>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};
