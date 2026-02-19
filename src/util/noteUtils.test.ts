import { describe, expect, test } from 'vitest';
import {
  BASE_KEY,
  generateNoteRange,
  getNoteFreqByName,
  getNoteNumberByName,
} from './noteUtils';

describe('getNoteFreqByName', () => {
  test('A4', () => {
    expect(getNoteFreqByName('A4')).toBe(440);
  });
  test('C4', () => {
    expect(getNoteFreqByName('C4')).toBeCloseTo(261.63, 2);
  });

  test('should fail with 1 character string', () => {
    expect(() => getNoteFreqByName('A')).toThrowError(
      /noteName must be 2 or 3 characters long/,
    );
  });

  test('should fail long string', () => {
    expect(() => getNoteFreqByName('AB11')).toThrowError(
      /noteName must be 2 or 3 characters long/,
    );
  });

  test('should fail with nonsense note', () => {
    expect(() => getNoteFreqByName('H1')).toThrowError(
      /Note name must be one of/,
    );
  });

  test('should fail with non-integer octave', () => {
    expect(() => getNoteFreqByName('Aa')).toThrowError(
      /^Octave must be an integer greater than or equal to 0/,
    );
  });
});

describe('getNoteNumberByName', () => {
  test('A4', () => {
    expect(getNoteNumberByName('A4')).toBe(BASE_KEY);
  });
  test('C4', () => {
    expect(getNoteNumberByName('C4')).toBe(60);
  });
  test('Min note - C0', () => {
    expect(getNoteNumberByName('C0')).toBe(12);
  });
  test('Max note - G9', () => {
    expect(getNoteNumberByName('G9')).toBe(127);
  });
});

describe('generateNoteRange', () => {
  test('Single octave', () => {
    expect(generateNoteRange('C4', 'B4')).toStrictEqual([
      'C4',
      'C#4',
      'D4',
      'D#4',
      'E4',
      'F4',
      'F#4',
      'G4',
      'G#4',
      'A4',
      'A#4',
      'B4',
    ]);
  });

  test('Multiple octave', () => {
    expect(generateNoteRange('C4', 'C5')).toStrictEqual([
      'C4',
      'C#4',
      'D4',
      'D#4',
      'E4',
      'F4',
      'F#4',
      'G4',
      'G#4',
      'A4',
      'A#4',
      'B4',
      'C5',
    ]);
  });
});
