import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

// Async thunks
export const testConnection = createAsyncThunk(
  'migration/testConnection',
  async ({ config, type }, { rejectWithValue }) => {
    try {
      const response = await api.testConnection(config);
      return { type, result: response };
    } catch (error) {
      // If error has a response structure (from API), use it
      if (error.success !== undefined) {
        return rejectWithValue({ type, result: error });
      }
      // Otherwise use the error message
      return rejectWithValue({
        type,
        result: { success: false, message: error.message || 'Connection test failed' },
      });
    }
  }
);

export const discoverCollections = createAsyncThunk(
  'migration/discoverCollections',
  async config => {
    const response = await api.discoverCollections(config);
    return response;
  }
);

export const inspectSchema = createAsyncThunk(
  'migration/inspectSchema',
  async ({ config, name }) => {
    const response = await api.inspectSchema(config, name);
    return response;
  }
);

export const startMigration = createAsyncThunk('migration/startMigration', async config => {
  const response = await api.startMigration(config);
  return response;
});

export const getMigrationStatus = createAsyncThunk('migration/getStatus', async jobId => {
  const response = await api.getMigrationStatus(jobId);
  return response;
});

export const getMigrationLogs = createAsyncThunk('migration/getLogs', async jobId => {
  const response = await api.getMigrationLogs(jobId);
  return response;
});

const initialState = {
  step: 1, // 1: source, 2: destination, 3: connection, 4: discover, 5: mapping, 6: settings, 7: migrate
  source: null,
  destination: null,
  sourceConfig: null,
  destinationConfig: null,
  sourceCollections: [],
  destinationTables: [],
  selectedSourceCollection: null,
  selectedDestinationTable: null,
  mapping: [],
  settings: {
    batchSize: 100,
    upsert: false,
    dryRun: false,
    retries: 3,
    createTable: false,
  },
  connectionTesting: {
    source: false,
    destination: false,
  },
  connectionStatus: {
    source: null, // { success: boolean, message: string } | null
    destination: null,
  },
  migrationJob: null,
  migrationStatus: null,
  migrationLogs: [],
  loading: false,
  error: null,
};

const migrationSlice = createSlice({
  name: 'migration',
  initialState,
  reducers: {
    setStep: (state, action) => {
      state.step = action.payload;
    },
    setSource: (state, action) => {
      state.source = action.payload;
      state.sourceConfig = null;
      state.sourceCollections = [];
    },
    setDestination: (state, action) => {
      state.destination = action.payload;
      state.destinationConfig = null;
      state.destinationTables = [];
    },
    setSourceConfig: (state, action) => {
      state.sourceConfig = action.payload;
    },
    setDestinationConfig: (state, action) => {
      state.destinationConfig = action.payload;
    },
    setSourceCollections: (state, action) => {
      state.sourceCollections = action.payload;
    },
    setDestinationTables: (state, action) => {
      state.destinationTables = action.payload;
    },
    setSelectedSourceCollection: (state, action) => {
      state.selectedSourceCollection = action.payload;
    },
    setSelectedDestinationTable: (state, action) => {
      state.selectedDestinationTable = action.payload;
    },
    setMapping: (state, action) => {
      state.mapping = action.payload;
    },
    setSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Test connection
      .addCase(testConnection.pending, (state, action) => {
        const type = action.meta.arg.type;
        state.connectionTesting[type] = true;
        state.error = null;
      })
      .addCase(testConnection.fulfilled, (state, action) => {
        const type = action.payload.type;
        state.connectionTesting[type] = false;
        // Store connection status
        state.connectionStatus[type] = {
          success: action.payload.result?.success || false,
          message: action.payload.result?.message || 'Connection test completed',
        };
      })
      .addCase(testConnection.rejected, (state, action) => {
        const type = action.meta.arg.type;
        state.connectionTesting[type] = false;
        // Use the payload if available (from rejectWithValue), otherwise use error message
        const errorMessage = action.payload?.result?.message || action.error?.message || 'Connection test failed';
        state.error = errorMessage;
        // Store connection status
        state.connectionStatus[type] = {
          success: false,
          message: errorMessage,
        };
      })
      // Discover collections
      .addCase(discoverCollections.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(discoverCollections.fulfilled, (state, action) => {
        state.loading = false;
        // Determine if source or destination based on current step
        if (state.step === 4) {
          state.sourceCollections = action.payload.collections;
        } else {
          state.destinationTables = action.payload.collections;
        }
      })
      .addCase(discoverCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Start migration
      .addCase(startMigration.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startMigration.fulfilled, (state, action) => {
        state.loading = false;
        state.migrationJob = action.payload.jobId;
        state.step = 7;
      })
      .addCase(startMigration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Get migration status
      .addCase(getMigrationStatus.fulfilled, (state, action) => {
        state.migrationStatus = action.payload.job;
      })
      // Get migration logs
      .addCase(getMigrationLogs.fulfilled, (state, action) => {
        state.migrationLogs = action.payload.logs;
      });
  },
});

export const {
  setStep,
  setSource,
  setDestination,
  setSourceConfig,
  setDestinationConfig,
  setSourceCollections,
  setDestinationTables,
  setSelectedSourceCollection,
  setSelectedDestinationTable,
  setMapping,
  setSettings,
  clearError,
} = migrationSlice.actions;

export default migrationSlice.reducer;
