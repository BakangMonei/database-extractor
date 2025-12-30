import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMigrationStatus, getMigrationLogs } from '../../store/slices/migrationSlice';

export default function StepMigrate() {
  const dispatch = useDispatch();
  const migrationJob = useSelector((state) => state.migration.migrationJob);
  const migrationStatus = useSelector((state) => state.migration.migrationStatus);
  const migrationLogs = useSelector((state) => state.migration.migrationLogs);
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
    if (migrationStatus && (migrationStatus.status === 'completed' || migrationStatus.status === 'failed')) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [migrationStatus]);

  if (!migrationStatus) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Migration Progress</h2>
      <p className="text-gray-600 mb-6">Job ID: {migrationJob}</p>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
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
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
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
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logs</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {migrationLogs.length === 0 && <div className="text-gray-500">No logs yet...</div>}
          {migrationLogs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              <span
                className={
                  log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-gray-100'
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start New Migration
          </button>
        </div>
      )}
    </div>
  );
}
