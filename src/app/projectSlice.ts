import { createSlice } from '@reduxjs/toolkit';

interface ProjectState {
  isPlaying: boolean;
}

const initialState: ProjectState = {
  isPlaying: false,
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    startPlayback: (state) => {
      state.isPlaying = true;
    },
    stopPlayback: (state) => {
      state.isPlaying = false;
    },
  },
});
