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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '../ui/field';
import { useState } from 'react';
import { projectSlice } from '@/app/projectSlice';
import { trackSlice } from '@/app/trackSlice';

export const TitleBar = () => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);
  const projectRegistry = useAppSelector((state) => state.projectRegistry);
  const activeProject = useAppSelector(selectActiveProject);

  const [selectedProjectId, setSelectedProjectId] = useState(activeProject.id);
  const [isOpenProjectDialogOpen, setIsOpenProjectDialogOpen] = useState(false);

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
          <Dialog
            open={isOpenProjectDialogOpen}
            onOpenChange={setIsOpenProjectDialogOpen}
          >
            <DialogTrigger asChild>
              <MenubarItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsOpenProjectDialogOpen(true);
                }}
              >
                Open Project
              </MenubarItem>
            </DialogTrigger>
            <DialogContent className='sm:max-w-sm'>
              <DialogHeader>
                <DialogTitle>Open Project</DialogTitle>
              </DialogHeader>
              <RadioGroup
                value={selectedProjectId}
                onValueChange={setSelectedProjectId} // 👈 track selection changes
              >
                {Object.values(projectRegistry.projects).map((proj) => (
                  <FieldLabel key={proj.id} htmlFor={`project-${proj.id}`}>
                    <Field orientation={'horizontal'}>
                      <FieldContent>
                        <FieldTitle>{proj.name}</FieldTitle>
                        <FieldDescription>
                          modified {proj.lastModified}
                          <br /> created {proj.created}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value={proj.id}
                        id={`project-${proj.id}`}
                      />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DialogClose>
                <Button
                  type='submit'
                  onClick={() => {
                    const target = projectRegistry.projects[selectedProjectId];
                    dispatch(
                      projectRegistrySlice.actions.saveSnapshot({
                        id: activeProject.id,
                        projectState: project,
                        tracksState: tracks,
                      }),
                    );

                    // load the target project's state if it has been saved before
                    if (target.projectState) {
                      dispatch(
                        projectSlice.actions.loadState(target.projectState),
                      );
                    }
                    if (target.tracksState) {
                      dispatch(
                        trackSlice.actions.loadState(target.tracksState),
                      );
                    }

                    dispatch(
                      projectRegistrySlice.actions.setActiveProject(
                        selectedProjectId,
                      ),
                    );

                    setIsOpenProjectDialogOpen(false);
                  }}
                >
                  Open
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
