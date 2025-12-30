import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  setSourceConfig,
  setDestinationConfig,
  setStep,
  testConnection,
  discoverCollections,
} from '../../store/slices/migrationSlice';
import * as api from '../../services/api';

export default function StepConnection() {
  const dispatch = useDispatch();
  const source = useSelector(state => state.migration.source);
  const destination = useSelector(state => state.migration.destination);
  const sourceConfig = useSelector(state => state.migration.sourceConfig);
  const destinationConfig = useSelector(state => state.migration.destinationConfig);
  const connectionTesting = useSelector(state => state.migration.connectionTesting);
  const connectionStatus = useSelector(state => state.migration.connectionStatus);
  const error = useSelector(state => state.migration.error);

  const {
    register: registerSource,
    handleSubmit: handleSubmitSource,
    formState: { errors: errorsSource },
  } = useForm({ defaultValues: sourceConfig || {} });

  const { register: registerDest, handleSubmit: handleSubmitDest } = useForm({
    defaultValues: destinationConfig || {},
  });

  const onSubmitSource = async data => {
    let config = { type: source, ...data };

    // Parse serviceAccount JSON if provided
    if (data.serviceAccount && typeof data.serviceAccount === 'string') {
      try {
        config.serviceAccount = JSON.parse(data.serviceAccount);
      } catch (e) {
        // Invalid JSON, keep as string or handle error
        console.error('Invalid serviceAccount JSON', e);
        toast.error('Invalid JSON in service account field');
        return;
      }
    }

    // Test connection first
    const result = await dispatch(testConnection({ config, type: 'source' }));
    // If fulfilled, check if successful
    if (testConnection.fulfilled.match(result)) {
      if (result.payload?.result?.success) {
        // Save config only if connection is successful
        dispatch(setSourceConfig(config));
        toast.success(result.payload.result.message || 'Connection successful!');
      } else {
        toast.error(result.payload?.result?.message || 'Connection failed');
      }
    } else if (testConnection.rejected.match(result)) {
      toast.error('Connection test failed');
    }
  };

  const onSubmitDest = async data => {
    const config = { type: destination, ...data };

    // Test connection first
    const result = await dispatch(testConnection({ config, type: 'destination' }));
    // If fulfilled, check if successful
    if (testConnection.fulfilled.match(result)) {
      if (result.payload?.result?.success) {
        // Save config only if connection is successful
        dispatch(setDestinationConfig(config));
        toast.success(result.payload.result.message || 'Connection successful!');
      } else {
        toast.error(result.payload?.result?.message || 'Connection failed');
      }
    } else if (testConnection.rejected.match(result)) {
      toast.error('Connection test failed');
    }
  };

  const handleDiscoverSource = async () => {
    if (!sourceConfig) {
      toast.error('Please test connection first');
      return;
    }
    try {
      toast.loading('Discovering collections...', { id: 'discover-source' });
      const result = await dispatch(discoverCollections(sourceConfig));
      if (discoverCollections.fulfilled.match(result)) {
        const count = result.payload.collections?.length || 0;
        toast.success(`Found ${count} collection(s)`, { id: 'discover-source' });
      } else {
        toast.error('Failed to discover collections', { id: 'discover-source' });
      }
    } catch (error) {
      toast.error('Failed to discover collections', { id: 'discover-source' });
    }
  };

  const handleDiscoverDestination = async () => {
    if (!destinationConfig) {
      toast.error('Please test connection first');
      return;
    }
    try {
      toast.loading('Discovering tables...', { id: 'discover-dest' });
      const result = await dispatch(discoverCollections(destinationConfig));
      if (discoverCollections.fulfilled.match(result)) {
        const count = result.payload.collections?.length || 0;
        toast.success(`Found ${count} table(s)`, { id: 'discover-dest' });
      } else {
        toast.error('Failed to discover tables', { id: 'discover-dest' });
      }
    } catch (error) {
      toast.error('Failed to discover tables', { id: 'discover-dest' });
    }
  };

  const handleNext = () => {
    if (!sourceConfig) {
      toast.error('Please test the source connection first');
      return;
    }
    if (!destinationConfig) {
      toast.error('Please test the destination connection first');
      return;
    }
    // Both configs exist, proceed to discover step
    dispatch(setStep(4));
  };

  const renderSourceForm = () => {
    if (source === 'firebase-firestore') {
      return (
        <form onSubmit={handleSubmitSource(onSubmitSource)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project ID</label>
            <input
              type="text"
              {...registerSource('projectId', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errorsSource.projectId && (
              <p className="mt-1 text-sm text-red-600">Project ID is required</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Service Account JSON (paste JSON content, or leave empty for client SDK)
            </label>
            <textarea
              {...registerSource('serviceAccount', {
                required: false,
                validate: value => {
                  if (!value || value.trim() === '') return true;
                  try {
                    JSON.parse(value);
                    return true;
                  } catch {
                    return 'Invalid JSON format';
                  }
                },
              })}
              rows={8}
              className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder='{"type": "service_account", "project_id": "...", ...}'
            />
            <p className="mt-1 text-sm text-gray-500">
              Paste your Firebase service account JSON here. For development, you can leave empty
              and use Firebase client SDK config.
            </p>
            {errorsSource.serviceAccount && (
              <p className="mt-1 text-sm text-red-600">{errorsSource.serviceAccount.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={connectionTesting.source}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {connectionTesting.source ? 'Testing...' : 'Test Connection'}
          </button>
          {connectionStatus.source && (
            <div
              className={`rounded-md p-3 ${
                connectionStatus.source.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{connectionStatus.source.message}</p>
            </div>
          )}
        </form>
      );
    }

    if (source === 'postgresql') {
      return (
        <form onSubmit={handleSubmitSource(onSubmitSource)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Host</label>
              <input
                type="text"
                {...registerSource('host', { required: true })}
                defaultValue="localhost"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <input
                type="number"
                {...registerSource('port', { required: true, valueAsNumber: true })}
                defaultValue={5432}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Database</label>
            <input
              type="text"
              {...registerSource('database', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <input
                type="text"
                {...registerSource('user', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...registerSource('password', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerSource('ssl')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Use SSL</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={connectionTesting.source}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {connectionTesting.source ? 'Testing...' : 'Test Connection'}
            </button>
            {connectionStatus.source?.success && (
              <button
                type="button"
                onClick={handleDiscoverSource}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Discover Collections
              </button>
            )}
          </div>
          {connectionStatus.source && (
            <div
              className={`rounded-md p-3 ${
                connectionStatus.source.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{connectionStatus.source.message}</p>
            </div>
          )}
        </form>
      );
    }

    if (source === 'supabase') {
      return (
        <form onSubmit={handleSubmitSource(onSubmitSource)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Connection String (recommended)
            </label>
            <input
              type="text"
              {...registerSource('connectionString', { required: false })}
              className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="postgres://user:password@host:port/database"
            />
            <p className="mt-1 text-sm text-gray-500">Or fill in the individual fields below</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Host</label>
              <input
                type="text"
                {...registerSource('host')}
                defaultValue="db.supabase.co"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <input
                type="number"
                {...registerSource('port', { valueAsNumber: true })}
                defaultValue={5432}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Database</label>
            <input
              type="text"
              {...registerSource('database', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <input
                type="text"
                {...registerSource('user', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...registerSource('password', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerSource('ssl')}
                defaultChecked={true}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Use SSL (required for Supabase)</span>
            </label>
          </div>
          {connectionStatus.source && (
            <div
              className={`rounded-md p-3 ${
                connectionStatus.source.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{connectionStatus.source.message}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={connectionTesting.source}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {connectionTesting.source ? 'Testing...' : 'Test Connection'}
          </button>
          {connectionStatus.source && (
            <div
              className={`rounded-md p-3 ${
                connectionStatus.source.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{connectionStatus.source.message}</p>
            </div>
          )}
        </form>
      );
    }

    return <div>Form for {source} not yet implemented</div>;
  };

  const renderDestinationForm = () => {
    if (destination === 'supabase') {
      return (
        <form onSubmit={handleSubmitDest(onSubmitDest)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Connection String (recommended)
            </label>
            <input
              type="text"
              {...registerDest('connectionString', { required: false })}
              className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="postgres://user:password@host:port/database"
            />
            <p className="mt-1 text-sm text-gray-500">Or fill in the individual fields below</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Host</label>
              <input
                type="text"
                {...registerDest('host')}
                defaultValue="db.supabase.co"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <input
                type="number"
                {...registerDest('port', { valueAsNumber: true })}
                defaultValue={5432}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Database</label>
            <input
              type="text"
              {...registerDest('database', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <input
                type="text"
                {...registerDest('user', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...registerDest('password', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerDest('ssl')}
                defaultChecked={true}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Use SSL (required for Supabase)</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={connectionTesting.destination}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {connectionTesting.destination ? 'Testing...' : 'Test Connection'}
            </button>
            {connectionStatus.destination?.success && (
              <button
                type="button"
                onClick={handleDiscoverDestination}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Discover Tables
              </button>
            )}
          </div>
          {connectionStatus.destination && (
            <div
              className={`rounded-md p-3 ${
                connectionStatus.destination.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{connectionStatus.destination.message}</p>
            </div>
          )}
        </form>
      );
    }

    if (destination === 'postgresql') {
      return (
        <form onSubmit={handleSubmitDest(onSubmitDest)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Host</label>
              <input
                type="text"
                {...registerDest('host', { required: true })}
                defaultValue="localhost"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <input
                type="number"
                {...registerDest('port', { required: true, valueAsNumber: true })}
                defaultValue={5432}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Database</label>
            <input
              type="text"
              {...registerDest('database', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <input
                type="text"
                {...registerDest('user', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...registerDest('password', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerDest('ssl')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Use SSL</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={connectionTesting.destination}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {connectionTesting.destination ? 'Testing...' : 'Test Connection'}
            </button>
            {connectionStatus.destination?.success && (
              <button
                type="button"
                onClick={handleDiscoverDestination}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Discover Tables
              </button>
            )}
          </div>
          {connectionStatus.destination && (
            <div
              className={`rounded-md p-3 ${
                connectionStatus.destination.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{connectionStatus.destination.message}</p>
            </div>
          )}
        </form>
      );
    }

    return <div>Form for {destination} not yet implemented</div>;
  };

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Configure Connections</h2>
      <p className="mb-6 text-gray-600">
        Set up connection details for source and destination databases
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Source Configuration */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Source: {source}</h3>
          {renderSourceForm()}
        </div>

        {/* Destination Configuration */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Destination: {destination}</h3>
          {renderDestinationForm()}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => dispatch(setStep(2))}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Next: Discover Data →
        </button>
      </div>
    </div>
  );
}
