import { configureStore } from '@reduxjs/toolkit';
import { trackSlice } from './trackSlice';
import { projectSlice } from './projectSlice';

export const store = configureStore({
  reducer: {
    tracks: trackSlice.reducer,
    project: projectSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
