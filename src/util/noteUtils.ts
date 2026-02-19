export const BASE_KEY = 69; // A4 MIDI number
const BASE_FREQUENCY = 440; // Hz (of A4 key)

type NoteName =
  | 'A'
  | 'A#'
  | 'B'
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#';

export type NoteNameWithOctave = `${NoteName}${number}`;

export const noteMapping: Record<NoteName, number> = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

function isNoteName(str: string): str is NoteName {
  return Object.keys(noteMapping).includes(str);
}

export const getNoteNumberByName = (noteName: string): number => {
  if (noteName.length !== 2 && noteName.length !== 3)
    throw new Error('noteName must be 2 or 3 characters long');

  const note = noteName.slice(0, noteName.length - 1);
  const octave = Number(noteName.slice(noteName.length - 1));

  if (!isNoteName(note))
    throw new Error(
      `Note name must be one of: ${Object.keys(noteMapping).join(', ')}`,
    );

  if (octave == null || octave < 0 || !Number.isInteger(octave))
    throw new Error(`Octave must be an integer greater than or equal to 0`);

  return noteMapping[note] + 12 * (octave + 1);
};

export const getNoteFreqByName = (noteName: string) => {
  const noteNum = getNoteNumberByName(noteName);

  return Math.pow(2, (noteNum - BASE_KEY) / 12) * BASE_FREQUENCY;
};

export const generateNoteRange = (
  minNote: NoteNameWithOctave,
  maxNote: NoteNameWithOctave,
): NoteNameWithOctave[] => {
  const noteOrder: NoteName[] = [
    'A',
    'A#',
    'B',
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
  ];

  const minNum = getNoteNumberByName(minNote);
  const maxNum = getNoteNumberByName(maxNote);

  if (minNum > maxNum) {
    throw new Error('minNote must be less than or equal to maxNote');
  }

  const result: NoteNameWithOctave[] = [];

  for (let n = minNum; n <= maxNum; n++) {
    const octave = Math.floor((n - 1) / 12);
    const noteIndex = (n - 1) % 12;
    const note = noteOrder[noteIndex];

    result.push(`${note}${octave}`);
  }

  return result;
};
