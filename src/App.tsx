import { useAppDispatch, useAppSelector } from './app/hooks';
import { GlobalAudioContextProvider } from './context/audioContext';
import { Timeline } from './components/Timeline';

function App() {
  const project = useAppSelector((state) => state.project);
  return (
    <GlobalAudioContextProvider>
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ backgroundColor: 'red', height: '1.5rem' }}>toolbar</div>
        {/* <div style={{ marginBottom: '1rem' }}>
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
        </div> */}
        <Timeline />
      </div>
    </GlobalAudioContextProvider>
  );
}

export default App;
