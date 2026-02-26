import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  projectRegistrySlice,
  selectActiveProject,
} from '@/app/projectRegistrySlice';
import { OpenProjectDialog } from './OpenProjectDialog';

export const TitleBar = () => {
  const dispatch = useAppDispatch();

  const activeProject = useAppSelector(selectActiveProject);
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File ({activeProject.name})</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() => {
              dispatch(
                projectRegistrySlice.actions.createProject({
                  name: 'Project 2',
                }),
              );
            }}
          >
            New Project
          </MenubarItem>
          <MenubarItem
            onClick={() => {
              dispatch(
                projectRegistrySlice.actions.saveSnapshot({
                  id: activeProject.id,
                  projectState: project,
                  tracksState: tracks,
                }),
              );
            }}
          >
            Save Project
          </MenubarItem>
          <OpenProjectDialog />
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Information</MenubarTrigger>
        <MenubarContent>
          <MenubarGroup>
            <MenubarItem>Total Duration: {project.totalDuration}</MenubarItem>
            <MenubarItem>Total Measures: {project.totalMeasures}</MenubarItem>
            <MenubarItem>BPM: {project.beatsPerMinute}</MenubarItem>
            <MenubarItem>Beat Value: {project.beatValue}</MenubarItem>
            <MenubarItem>
              Beats Per Measure: {project.beatsPerMeasure}
            </MenubarItem>
            <MenubarItem>
              Seconds Per Measure: {project.secondsPerMeasure}
            </MenubarItem>
            <MenubarItem>px Per Second: {project.pxPerSecondScale}</MenubarItem>
            <MenubarItem>
              px Per Measure: {project.pxPerMeasureScale}
            </MenubarItem>
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
