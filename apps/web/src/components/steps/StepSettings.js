import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setStep, setSettings, startMigration } from '../../store/slices/migrationSlice';

export default function StepSettings() {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.migration.settings);
  const sourceConfig = useSelector(state => state.migration.sourceConfig);
  const destinationConfig = useSelector(state => state.migration.destinationConfig);
  const selectedSourceCollection = useSelector(state => state.migration.selectedSourceCollection);
  const selectedDestinationTable = useSelector(state => state.migration.selectedDestinationTable);
  const mapping = useSelector(state => state.migration.mapping);
  const loading = useSelector(state => state.migration.loading);

  const handleSettingChange = (field, value) => {
    dispatch(setSettings({ [field]: value }));
  };

  const handleStartMigration = () => {
    const migrationConfig = {
      source: sourceConfig,
      destination: destinationConfig,
      mappings: [
        {
          sourceCollection: selectedSourceCollection,
          targetTable: selectedDestinationTable,
          fieldMappings: mapping,
        },
      ],
      settings,
    };

    dispatch(startMigration(migrationConfig));
  };

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Migration Settings</h2>
      <p className="mb-6 text-gray-600">Configure migration parameters</p>

      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Batch Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Batch Size</label>
              <input
                type="number"
                value={settings.batchSize}
                onChange={e => handleSettingChange('batchSize', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                min={1}
                max={10000}
              />
              <p className="mt-1 text-sm text-gray-500">Number of records to process per batch</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Retry Attempts</label>
              <input
                type="number"
                value={settings.retries}
                onChange={e => handleSettingChange('retries', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                min={0}
                max={10}
              />
              <p className="mt-1 text-sm text-gray-500">Number of retry attempts on failure</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Migration Options</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.upsert}
                onChange={e => handleSettingChange('upsert', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Upsert (update existing records)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.createTable}
                onChange={e => handleSettingChange('createTable', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Create table if it doesn't exist</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.dryRun}
                onChange={e => handleSettingChange('dryRun', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Dry run (test without writing data)
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => dispatch(setStep(5))}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back
        </button>
        <button
          onClick={handleStartMigration}
          disabled={loading}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Start Migration'}
        </button>
      </div>
    </div>
  );
}
