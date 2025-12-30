import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMigrationStatus, getMigrationLogs } from '../../store/slices/migrationSlice';

export default function StepMigrate() {
  const dispatch = useDispatch();
  const migrationJob = useSelector(state => state.migration.migrationJob);
  const migrationStatus = useSelector(state => state.migration.migrationStatus);
  const migrationLogs = useSelector(state => state.migration.migrationLogs);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (migrationJob) {
      // Poll for status updates
      intervalRef.current = setInterval(() => {
        dispatch(getMigrationStatus(migrationJob));
        dispatch(getMigrationLogs(migrationJob));
      }, 2000);

      // Initial fetch
      dispatch(getMigrationStatus(migrationJob));
      dispatch(getMigrationLogs(migrationJob));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch, migrationJob]);

  // Stop polling when migration is complete
  useEffect(() => {
    if (
      migrationStatus &&
      (migrationStatus.status === 'completed' || migrationStatus.status === 'failed')
    ) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [migrationStatus]);

  if (!migrationStatus) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Initializing migration...</p>
      </div>
    );
  }

  const progress = migrationStatus.progress || 0;
  const isComplete = migrationStatus.status === 'completed';
  const isFailed = migrationStatus.status === 'failed';
  const isRunning = migrationStatus.status === 'running';

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Migration Progress</h2>
      <p className="mb-6 text-gray-600">Job ID: {migrationJob}</p>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="h-4 w-full rounded-full bg-gray-200">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${
              isComplete ? 'bg-green-600' : isFailed ? 'bg-red-600' : 'bg-indigo-600'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Processed: {migrationStatus.processedRecords || 0}
          {migrationStatus.totalRecords && ` / ${migrationStatus.totalRecords}`} records
        </div>
      </div>

      {/* Status */}
      <div className="mb-8">
        <div
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
            isComplete
              ? 'bg-green-100 text-green-800'
              : isFailed
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
          }`}
        >
          {isComplete && '✓ Completed'}
          {isFailed && '✗ Failed'}
          {isRunning && '⏳ Running'}
          {!isComplete && !isFailed && !isRunning && '⏸ Paused'}
        </div>
      </div>

      {/* Logs */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Logs</h3>
        <div className="max-h-96 overflow-y-auto rounded bg-gray-900 p-4 font-mono text-sm text-gray-100">
          {migrationLogs.length === 0 && <div className="text-gray-500">No logs yet...</div>}
          {migrationLogs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{' '}
              <span
                className={
                  log.level === 'error'
                    ? 'text-red-400'
                    : log.level === 'warn'
                      ? 'text-yellow-400'
                      : 'text-gray-100'
                }
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isComplete && (
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Start New Migration
          </button>
        </div>
      )}
    </div>
  );
}
