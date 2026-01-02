import { useRef } from 'react';

import { Sequencer } from './components/Sequencer';

function App() {
  const audioContextRef = useRef<AudioContext>(null);
  if (audioContextRef.current == null) {
    audioContextRef.current = new AudioContext();
  }

  const audioContext = audioContextRef.current;

  return (
    <>
      <Sequencer audioContext={audioContext} />
    </>
  );
}

export default App;
