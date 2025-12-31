import { useRef } from 'react';

import { Note } from './components/Note';

const keyNames = [
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
const baseKey = 49; // A4
const baseFrequency = 440; // Hz (of A4 key)
const baseOctave = 4;

const getKeyFrequency = (n: number) =>
  Math.pow(2, (n - baseKey) / 12) * baseFrequency;

const keys: Array<{ name: string; frequency: number }> = [];
for (let octave = 3; octave <= 5; octave++) {
  keyNames.forEach((keyName, keyIdx) => {
    // Get 'n', the key number relative to A4 (n = 49)
    // NOTE: octave is multiplied by 12 b/c there are 12 semitones in an octave
    const n = baseKey + 12 * (octave - baseOctave) + keyIdx;
    const keyInfo = {
      name: `${keyName}${octave}`,
      frequency: getKeyFrequency(n),
    };
    if (keyInfo.name.length === 2) {
      keys.push(keyInfo);
    }
  });
}

function App() {
  const audioContextRef = useRef<AudioContext>(null);
  if (audioContextRef.current == null) {
    audioContextRef.current = new AudioContext();
  }

  const audioContext = audioContextRef.current;

  return (
    <>
      {keys.map((keyObj) => (
        <Note
          key={keyObj.name}
          name={keyObj.name}
          frequency={keyObj.frequency}
          audioContext={audioContext}
        />
      ))}
    </>
  );
}

export default App;
