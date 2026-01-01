import { useState } from 'react';
import { useResizeObserver } from '../hooks/useResizeObserver';

interface SequencerProps {
  audioContext: AudioContext;
}

interface Note {
  startTime: number;
  duration: number;
  frequency: number;
  gain: number;
}

export const Sequencer = (props: SequencerProps) => {
  const [notes, setNotes] = useState<Note[]>([
    { startTime: 0, duration: 0.5, frequency: 440, gain: 1 },
    { startTime: 0, duration: 0.5, frequency: 540, gain: 1 },
  ]);
  const [trackLength, setTrackLength] = useState(15); // secs
  const { ref, dimensions } = useResizeObserver();

  const playTrack = () => {
    notes.forEach((note) => {
      const startTime = props.audioContext.currentTime;
      const duration = note.duration;

      const oscillatorNode = props.audioContext.createOscillator();
      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(
        note.frequency,
        props.audioContext.currentTime
      );
      // NOTE: Each key should have its own gain node so it can maintain its own
      // volume/attack/release stuff
      const gainNode = props.audioContext.createGain();

      gainNode.gain.setValueAtTime(note.gain, startTime);
      gainNode.gain.linearRampToValueAtTime(0.01, startTime + duration);

      oscillatorNode.connect(gainNode);
      gainNode.connect(props.audioContext.destination);

      oscillatorNode.start(startTime);
      oscillatorNode.stop(startTime + duration);
    });
  };

  return (
    <div>
      <div>
        Track: {dimensions.width}px x {dimensions.height}px
      </div>
      <button onClick={playTrack}>play</button>
      <div
        ref={ref}
        style={{
          height: '50px',
          width: '100%',
          border: '1px solid black',
        }}
      >
        {notes.map((note) => (
          <div key={`${note.startTime}-${note.duration}-${note.frequency}`}>
            {note.frequency}
          </div>
        ))}
      </div>
    </div>
  );
};
