import * as z from 'zod';
import { getNoteFreqByName, type NoteNameWithOctave } from '@/util/noteUtils';

export const isValidNote = (value: string): value is NoteNameWithOctave => {
  const notePattern = /^(A#|C#|D#|F#|G#|A|B|C|D|E|F|G)([0-9])$/;
  return notePattern.test(value);
};

export const noteSchema = z.string().refine(isValidNote, {
  error: 'Must be a valid note (ex: C4, A#3). Only sharps are allowed.',
});

export const validateMinMaxNotes = (
  minNote: string,
  maxNote: string,
): boolean => {
  try {
    return getNoteFreqByName(minNote) < getNoteFreqByName(maxNote);
  } catch {
    // If getNoteFreqByName throws, it means the format is invalid
    // Return true here so this refine passes and the field-level error shows instead
    // Man, this feels ugly
    return true;
  }
};
