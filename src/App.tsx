import { useAppDispatch, useAppSelector } from './app/hooks';
import { GlobalAudioContextProvider } from './context/audioContext';
import { Timeline } from './components/Timeline';
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from './components/ui/menubar';
import { trackSlice } from './app/trackSlice';

function App() {
  const project = useAppSelector((state) => state.project);
  const dispatch = useAppDispatch();
  return (
    <GlobalAudioContextProvider>
      <div className='flex flex-col max-h-full gap-4'>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Information</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem>
                  Total Duration: {project.totalDuration}
                </MenubarItem>
                <MenubarItem>
                  Total Measures: {project.totalMeasures}
                </MenubarItem>
                <MenubarItem>BPM: {project.beatsPerMeasure}</MenubarItem>
                <MenubarItem>Beat Value: {project.beatValue}</MenubarItem>
                <MenubarItem>
                  Beats Per Measure: {project.beatsPerMeasure}
                </MenubarItem>
                <MenubarItem>
                  Seconds Per Measure: {project.secondsPerMeasure}
                </MenubarItem>
                <MenubarItem>
                  px Per Second: {project.pxPerSecondScale}
                </MenubarItem>
                <MenubarItem>
                  px Per Measure: {project.pxPerMeasureScale}
                </MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Tracks</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem
                  onClick={() => dispatch(trackSlice.actions.addTrack())}
                >
                  Add Track
                </MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <Timeline />
      </div>
    </GlobalAudioContextProvider>
  );
}

export default App;
