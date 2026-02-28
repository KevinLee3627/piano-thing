import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  projectRegistrySlice,
  selectActiveProject,
} from '@/app/projectRegistrySlice';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { MenubarItem } from '../ui/menubar';

export const CreateProjectDialog = () => {
  const dispatch = useAppDispatch();

  const activeProject = useAppSelector(selectActiveProject);
  const project = useAppSelector((state) => state.project);
  const tracks = useAppSelector((state) => state.tracks);
  return (
    <Dialog>
      <DialogTrigger>
        <MenubarItem
          onClick={() => {
            // dispatch(
            //   projectRegistrySlice.actions.saveSnapshot({
            //     id: activeProject.id,
            //     projectState: project,
            //     tracksState: tracks,
            //   }),
            // );
            // dispatch(
            //   projectRegistrySlice.actions.createProject({
            //     name: 'Project',
            //   }),
            // );
          }}
        >
          New Project
        </MenubarItem>
      </DialogTrigger>
      <DialogContent>Test</DialogContent>
    </Dialog>
  );
};
