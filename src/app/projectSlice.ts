import { createSlice } from '@reduxjs/toolkit';

interface ProjectState {
  isPlaying: boolean;
  totalDuration: number;
}

const initialState: ProjectState = {
  isPlaying: false,
  totalDuration: 5, // seconds
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
