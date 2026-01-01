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
    { startTime: 0, duration: 1, frequency: 440, gain: 1 },
    { startTime: 1, duration: 1, frequency: 540, gain: 1 },
  ]);
  const [trackLength, setTrackLength] = useState(5); // secs
  const { ref: trackRef, dimensions: trackDimensions } = useResizeObserver();

  const playTrack = () => {
    notes.forEach((note) => {
      const startTime = props.audioContext.currentTime + note.startTime;
      const duration = note.duration;

      const oscillatorNode = props.audioContext.createOscillator();
      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(
        note.frequency,
        props.audioContext.currentTime
      );

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
        Track: {trackDimensions.width}px x {trackDimensions.height}px
      </div>
      <button onClick={playTrack}>play</button>
      <div
        ref={trackRef}
        style={{
          height: '50px',
          width: '100%',
          border: '1px solid black',
          position: 'relative',
        }}
      >
        {notes.map((note) => {
          const left = (note.startTime / trackLength) * trackDimensions.width;
          const noteWidth =
            (note.duration / trackLength) * trackDimensions.width;
          return (
            <div
              key={`${note.startTime}-${note.duration}-${note.frequency}`}
              style={{
                border: '1px dashed red',
                width: `${noteWidth}px`,
                height: '50px',
                left: `${left}px`,
                position: 'absolute',
              }}
            >
              {note.frequency}
            </div>
          );
        })}
      </div>
    </div>
  );
};
