import { GlobalAudioContextProvider } from './context/audioContext';
import { Timeline } from './components/Timeline';
import { TitleBar } from './components/TitleBar/TitleBar';

function App() {
  return (
    <GlobalAudioContextProvider>
      <div className='flex flex-col max-h-full gap-4'>
        <TitleBar />
        <Timeline />
      </div>
    </GlobalAudioContextProvider>
  );
}

export default App;
