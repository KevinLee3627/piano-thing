import { Sequencer } from './components/Sequencer';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { GlobalAudioContextProvider } from './context/audioContext';
import { trackSlice } from './app/trackSlice';

function App() {
  const dispatch = useAppDispatch();
  const tracks = useAppSelector((state) => state.tracks);
  console.log(tracks);

  return (
    <GlobalAudioContextProvider>
      <div>
        <button onClick={() => dispatch(trackSlice.actions.addTrack())}>
          add track
        </button>
      </div>
      <div style={{ height: '40%' }}>
        {Object.keys(tracks).map((trackId) => {
          return <Sequencer trackId={trackId} key={trackId} />;
        })}
      </div>
    </GlobalAudioContextProvider>
  );
}

export default App;
