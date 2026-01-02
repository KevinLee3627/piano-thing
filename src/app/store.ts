import { configureStore } from '@reduxjs/toolkit';
import { trackSlice } from './trackSlice';

export const store = configureStore({
  reducer: {
    tracks: trackSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
