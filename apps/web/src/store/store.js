import { configureStore } from '@reduxjs/toolkit';
import migrationReducer from './slices/migrationSlice';

export const store = configureStore({
  reducer: {
    migration: migrationReducer,
  },
});
