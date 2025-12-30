import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { setSourceConfig, setDestinationConfig, setStep, testConnection } from '../../store/slices/migrationSlice';

export default function StepConnection() {
  const dispatch = useDispatch();
  const source = useSelector((state) => state.migration.source);
  const destination = useSelector((state) => state.migration.destination);
  const sourceConfig = useSelector((state) => state.migration.sourceConfig);
  const destinationConfig = useSelector((state) => state.migration.destinationConfig);
  const connectionTesting = useSelector((state) => state.migration.connectionTesting);

  const {
    register: registerSource,
    handleSubmit: handleSubmitSource,
    formState: { errors: errorsSource },
  } = useForm({ defaultValues: sourceConfig || {} });

  const {
    register: registerDest,
    handleSubmit: handleSubmitDest,
    formState: { errors: errorsDest },
  } = useForm({ defaultValues: destinationConfig || {} });

  const onSubmitSource = async (data) => {
    let config = { type: source, ...data };
    
    // Parse serviceAccount JSON if provided
    if (data.serviceAccount && typeof data.serviceAccount === 'string') {
      try {
        config.serviceAccount = JSON.parse(data.serviceAccount);
      } catch (e) {
        // Invalid JSON, keep as string or handle error
        console.error('Invalid serviceAccount JSON', e);
      }
    }
    
    dispatch(setSourceConfig(config));
    
    // Test connection
    const result = await dispatch(testConnection({ config, type: 'source' }));
    if (result.payload.success) {
      // Connection successful
    }
  };

  const onSubmitDest = async (data) => {
    const config = { type: destination, ...data };
    dispatch(setDestinationConfig(config));
    
    // Test connection
    const result = await dispatch(testConnection({ config, type: 'destination' }));
    if (result.payload.success) {
      // Connection successful
    }
  };

  const handleNext = () => {
    if (sourceConfig && destinationConfig) {
      dispatch(setStep(4));
    }
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
                validate: (value) => {
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              placeholder='{"type": "service_account", "project_id": "...", ...}'
            />
            <p className="mt-1 text-sm text-gray-500">
              Paste your Firebase service account JSON here. For development, you can leave empty and use Firebase client SDK config.
            </p>
            {errorsSource.serviceAccount && (
              <p className="mt-1 text-sm text-red-600">{errorsSource.serviceAccount.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={connectionTesting.source}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {connectionTesting.source ? 'Testing...' : 'Test Connection'}
          </button>
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
          <button
            type="submit"
            disabled={connectionTesting.source}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {connectionTesting.source ? 'Testing...' : 'Test Connection'}
          </button>
        </form>
      );
    }

    return <div>Form for {source} not yet implemented</div>;
  };

  const renderDestinationForm = () => {
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
          <button
            type="submit"
            disabled={connectionTesting.destination}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {connectionTesting.destination ? 'Testing...' : 'Test Connection'}
          </button>
        </form>
      );
    }

    return <div>Form for {destination} not yet implemented</div>;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Connections</h2>
      <p className="text-gray-600 mb-6">Set up connection details for source and destination databases</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source Configuration */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Source: {source}</h3>
          {renderSourceForm()}
        </div>

        {/* Destination Configuration */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Destination: {destination}</h3>
          {renderDestinationForm()}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => dispatch(setStep(2))}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!sourceConfig || !destinationConfig}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Discover Data →
        </button>
      </div>
    </div>
  );
}
