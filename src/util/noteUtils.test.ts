import { describe, expect, test } from 'vitest';
import { getNoteFreqByName } from './noteUtils';

describe('getNoteNumByName', () => {
  test('success', () => {
    expect(getNoteFreqByName('A4')).toBe(440);
  });

  test('should fail with 1 character string', () => {
    expect(() => getNoteFreqByName('A')).toThrowError(
      /noteName must be 2 or 3 characters long/
    );
  });

  test('should fail long string', () => {
    expect(() => getNoteFreqByName('AB11')).toThrowError(
      /noteName must be 2 or 3 characters long/
    );
  });

  test('should fail with nonsense note', () => {
    expect(() => getNoteFreqByName('H1')).toThrowError(
      /Note name must be one of/
    );
  });

  test('should fail with non-integer octave', () => {
    expect(() => getNoteFreqByName('Aa')).toThrowError(
      /^Octave must be an integer greater than or equal to 0/
    );
  });
});
