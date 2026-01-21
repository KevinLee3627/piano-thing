import { Track } from './components/Track';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { GlobalAudioContextProvider } from './context/audioContext';
import { trackSlice } from './app/trackSlice';

function App() {
  const dispatch = useAppDispatch();
  const tracks = useAppSelector((state) => state.tracks);
  const project = useAppSelector((state) => state.project);
  return (
    <GlobalAudioContextProvider>
      <div style={{ marginBottom: '3rem' }}>
        <div>
          <p>Info:</p>
          <p>Total Duration: {project.totalDuration}s</p>
          <p>Total Measures: {project.totalMeasures}</p>
          <p>BPM: {project.beatsPerMinute}</p>
          <p>Beat Value: {project.beatValue}</p>
          <p>Beats Per Measure: {project.beatsPerMeasure}</p>
          <p>Seconds per measure: {project.secondsPerMeasure}</p>
          <p>px per secondd: {project.pxPerSecondScale} px</p>
          <p>px per measure: {project.pxPerMeasureScale} px</p>
        </div>
        <button
          onClick={() => {
            Object.values(tracks).forEach((track) =>
              dispatch(
                trackSlice.actions.startTrack({ trackId: track.trackId }),
              ),
            );
          }}
        >
          play all these tracks :D
        </button>
        <button onClick={() => dispatch(trackSlice.actions.addTrack())}>
          add track
        </button>
      </div>
      <div style={{ height: '40%' }}>
        {Object.keys(tracks).map((trackId) => {
          return <Track trackId={trackId} key={trackId} />;
        })}
      </div>
    </GlobalAudioContextProvider>
  );
}

export default App;
