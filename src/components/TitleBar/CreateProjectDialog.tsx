import { useAppDispatch, useAppSelector } from '@/app/hooks';
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
  DialogTrigger,
} from '../ui/dialog';
import { MenubarItem } from '../ui/menubar';
import { useState } from 'react';
import { Button } from '../ui/button';
import { DialogTitle } from '@radix-ui/react-dialog';

export const CreateProjectDialog = () => {
  const dispatch = useAppDispatch();

  const activeProject = useAppSelector(selectActiveProject);
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);

  const [isOpen, setisOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setisOpen}>
      <DialogTrigger asChild>
        <MenubarItem
          onClick={(e) => {
            e.preventDefault();
            setisOpen(true);
          }}
        >
          New Project
        </MenubarItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant={'outline'}>Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              dispatch(
                projectRegistrySlice.actions.saveSnapshot({
                  id: activeProject.id,
                  projectState: project,
                  tracksState: tracks,
                }),
              );
              dispatch(
                projectRegistrySlice.actions.createProject({
                  name: 'Project',
                }),
              );
              setisOpen(false);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
