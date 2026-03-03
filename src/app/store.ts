import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { trackSlice } from './trackSlice';
import { projectSlice } from './projectSlice';
import {
  createMigrate,
  persistReducer,
  persistStore,
  PERSIST,
  REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { projectRegistrySlice } from './projectRegistrySlice';

const migrations = {
  0: (state: any) => {
    const tracks = state?.tracks ?? {};
    const migratedTracks = Object.fromEntries(
      Object.entries(tracks).map(([id, track]: [string, any]) => [
        id,
        { volume: 1, ...track },
      ]),
    );
    return { ...state, tracks: migratedTracks };
  },
};

const persistConfig = {
  key: 'root',
  storage,
  migrate: createMigrate(migrations, { debug: false }),
};

const rootReducer = combineReducers({
  tracks: trackSlice.reducer,
  project: projectSlice.reducer,
  projectRegistry: projectRegistrySlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [PERSIST, REHYDRATE],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
