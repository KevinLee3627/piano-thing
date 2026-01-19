import { createSlice } from '@reduxjs/toolkit';

interface ProjectState {
  isPlaying: boolean;
  totalDuration: number;
  pxPerSecScale: number;
}

const initialState: ProjectState = {
  isPlaying: false,
  totalDuration: 10, // seconds
  pxPerSecScale: 300,
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
