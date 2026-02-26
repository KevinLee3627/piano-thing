import { MenubarItem } from '@/components/ui/menubar';
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
import { projectSlice } from '@/app/projectSlice';
import { trackSlice } from '@/app/trackSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useState } from 'react';

export const OpenProjectDialog = () => {
  const dispatch = useAppDispatch();

  const projectRegistry = useAppSelector((state) => state.projectRegistry);
  const activeProject = useAppSelector(selectActiveProject);
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);

  const [selectedProjectId, setSelectedProjectId] = useState(activeProject.id);
  const [isOpenProjectDialogOpen, setIsOpenProjectDialogOpen] = useState(false);

  return (
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
                <RadioGroupItem value={proj.id} id={`project-${proj.id}`} />
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
                dispatch(projectSlice.actions.loadState(target.projectState));
              }
              if (target.tracksState) {
                dispatch(trackSlice.actions.loadState(target.tracksState));
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
  );
};
