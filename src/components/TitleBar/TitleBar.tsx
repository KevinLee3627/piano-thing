import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  projectRegistrySlice,
  selectActiveProject,
  type ProjectEntry,
} from '@/app/projectRegistrySlice';
import { OpenProjectDialog } from './OpenProjectDialog';
import { CreateProjectDialog } from './CreateProjectDialog';
import { projectSlice } from '@/app/projectSlice';
import { trackSlice } from '@/app/trackSlice';

export const TitleBar = () => {
  const dispatch = useAppDispatch();

  const activeProject = useAppSelector(selectActiveProject);
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);

  const handleExport = () => {
    // First snapshot current state into the registry entry
    const snapshot = {
      ...activeProject,
      projectState: project,
      tracksState: tracks,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const entry: ProjectEntry = JSON.parse(text);

      // save the current project's state before switching away
      dispatch(
        projectRegistrySlice.actions.saveSnapshot({
          id: activeProject.id,
          projectState: project,
          tracksState: tracks,
        }),
      );

      // register the imported project and make it active
      dispatch(projectRegistrySlice.actions.importProject(entry));

      // load imported data into store
      if (entry.projectState)
        dispatch(projectSlice.actions.loadState(entry.projectState));
      if (entry.tracksState)
        dispatch(trackSlice.actions.loadState(entry.tracksState));
    };
    input.click();
  };

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File ({activeProject.name})</MenubarTrigger>
        <MenubarContent>
          <CreateProjectDialog />
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
          <MenubarSeparator />
          <MenubarGroup>
            <MenubarItem onClick={handleExport}>Export Project</MenubarItem>
            <MenubarItem onClick={handleImport}>Import Project</MenubarItem>
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarItem
            variant='destructive'
            onClick={() => {
              dispatch(
                projectRegistrySlice.actions.deleteProject(activeProject.id),
              );
            }}
          >
            Delete Project
          </MenubarItem>
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
