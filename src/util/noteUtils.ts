const BASE_KEY = 49; // A4
const BASE_FREQUENCY = 440; // Hz (of A4 key)

type noteName =
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

export const noteMapping: Record<noteName, number> = {
  A: 0,
  'A#': 1,
  B: 2,
  C: 3,
  'C#': 4,
  D: 5,
  'D#': 6,
  E: 7,
  F: 8,
  'F#': 9,
  G: 10,
  'G#': 11,
};

function isNoteName(str: string): str is noteName {
  return Object.keys(noteMapping).includes(str);
}

export const getNoteFreqByName = (noteName: string) => {
  if (noteName.length !== 2 && noteName.length !== 3)
    throw new Error('noteName must be 2 or 3 characters long');

  let note: string | noteName | null = noteName.slice(0, noteName.length - 1);
  if (!isNoteName(note))
    throw new Error(
      `Note name must be one of: ${Object.keys(noteMapping).join(', ')}`
    );
  let octave = Number(noteName.slice(noteName.length - 1));

  if (octave == null || octave < 0 || !Number.isInteger(octave))
    throw new Error(`Octave must be an integer greater than or equal to 0`);

  const noteNum = noteMapping[note] + 12 * octave + 1;

  return Math.pow(2, (noteNum - BASE_KEY) / 12) * BASE_FREQUENCY;
};
