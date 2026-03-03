import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProjectState } from './projectSlice';
import type { TrackState } from './trackSlice';
import type { RootState } from './store';

export interface ProjectEntry {
  id: string;
  name: string;
  created: string; // TODO
  lastModified: string; // TODO
  projectState: ProjectState | null;
  tracksState: TrackState | null;
}

interface ProjectRegistryState {
  activeProjectId: string;
  projects: Record<string, ProjectEntry>;
}

const initialProjectId = crypto.randomUUID();

const initialState: ProjectRegistryState = {
  activeProjectId: initialProjectId,
  projects: {
    [initialProjectId]: {
      id: initialProjectId,
      name: 'Project 1',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      projectState: null,
      tracksState: null,
    },
  },
};

export const projectRegistrySlice = createSlice({
  name: 'projectRegistry',
  initialState,
  reducers: {
    saveSnapshot: (
      state,
      action: PayloadAction<{
        id: string;
        projectState: ProjectState;
        tracksState: TrackState;
      }>,
    ) => {
      const { id, projectState, tracksState } = action.payload;
      if (state.projects[id]) {
        state.projects[id].projectState = projectState;
        state.projects[id].tracksState = tracksState;
      }
    },

    setActiveProject: (state, action: PayloadAction<string>) => {
      state.activeProjectId = action.payload;
    },

    createProject: (
      state,
      action: PayloadAction<Pick<ProjectEntry, 'name'>>,
    ) => {
      const { name } = action.payload;
      const id = crypto.randomUUID();
      state.projects[id] = {
        id,
        name,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        projectState: null,
        tracksState: null,
      };
      state.activeProjectId = id;
    },

    renameProject: (
      state,
      action: PayloadAction<{ id: string; name: string }>,
    ) => {
      if (state.projects[action.payload.id]) {
        state.projects[action.payload.id].name = action.payload.name;
      }
    },

    deleteProject: (state, action: PayloadAction<string>) => {
      if (Object.keys(state.projects).length <= 1) return;
      delete state.projects[action.payload];
      if (state.activeProjectId === action.payload) {
        state.activeProjectId = Object.keys(state.projects)[0];
      }
    },
    importProject: (state, action: PayloadAction<ProjectEntry>) => {
      const entry = action.payload;
      // generate fresh id to avoid collisions
      const id = crypto.randomUUID();
      state.projects[id] = { ...entry, id };
      state.activeProjectId = id;
    },
  },
});

export const selectActiveProject = (state: RootState) =>
  state.projectRegistry.projects[state.projectRegistry.activeProjectId];
