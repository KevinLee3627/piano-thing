import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { trackSlice } from './trackSlice';
import { projectSlice } from './projectSlice';
import {
  persistReducer,
  persistStore,
  PERSIST,
  REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { projectRegistrySlice } from './projectRegistrySlice';

const persistConfig = {
  key: 'root',
  storage,
};

const rootReducer = combineReducers({
  tracks: trackSlice.reducer,
  project: projectSlice.reducer,
  projectRegistry: projectRegistrySlice.reducer, // 👈 new
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
