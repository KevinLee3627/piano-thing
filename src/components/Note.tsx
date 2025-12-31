interface NoteProps {
  name: string;
  frequency: number;
  audioContext: AudioContext;
}

export const Note = (props: NoteProps) => {
  const playNote = () => {
    const oscillatorNode = props.audioContext.createOscillator();

    oscillatorNode.type = 'sine';
    oscillatorNode.frequency.setValueAtTime(
      props.frequency,
      props.audioContext.currentTime
    );
    // NOTE: Each key should have its own gain node so it can maintain its own
    // volume/attack/release stuff
    const gainNode = props.audioContext.createGain();
    oscillatorNode.connect(gainNode);
    gainNode.connect(props.audioContext.destination);

    const startTime = props.audioContext.currentTime;
    const duration = 2.5;

    oscillatorNode.start(startTime);

    gainNode.gain.setValueAtTime(1, startTime);
    // NOTE: this is the 'decay'?
    gainNode.gain.linearRampToValueAtTime(0.01, startTime + duration);

    oscillatorNode.stop(startTime + duration);
  };

  return <button onClick={playNote}>{props.name}</button>;
};
