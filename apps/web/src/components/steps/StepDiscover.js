import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setStep,
  discoverCollections,
  setSelectedSourceCollection,
  setSelectedDestinationTable,
} from '../../store/slices/migrationSlice';

export default function StepDiscover() {
  const dispatch = useDispatch();
  const sourceConfig = useSelector((state) => state.migration.sourceConfig);
  const destinationConfig = useSelector((state) => state.migration.destinationConfig);
  const sourceCollections = useSelector((state) => state.migration.sourceCollections);
  const destinationTables = useSelector((state) => state.migration.destinationTables);
  const selectedSourceCollection = useSelector((state) => state.migration.selectedSourceCollection);
  const selectedDestinationTable = useSelector((state) => state.migration.selectedDestinationTable);
  const loading = useSelector((state) => state.migration.loading);

  useEffect(() => {
    // Auto-discover on mount
    if (sourceConfig && sourceCollections.length === 0) {
      dispatch(discoverCollections(sourceConfig));
    }
    if (destinationConfig && destinationTables.length === 0) {
      dispatch(discoverCollections(destinationConfig));
    }
  }, [dispatch, sourceConfig, destinationConfig, sourceCollections.length, destinationTables.length]);

  const handleNext = () => {
    if (selectedSourceCollection && selectedDestinationTable) {
      dispatch(setStep(5));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Data Structures</h2>
      <p className="text-gray-600 mb-6">Select source collection and destination table</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source Collections */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Collections</h3>
          {loading && <p className="text-gray-500">Discovering collections...</p>}
          {!loading && sourceCollections.length === 0 && (
            <p className="text-gray-500">No collections found</p>
          )}
          <div className="space-y-2">
            {sourceCollections.map((collection) => (
              <button
                key={collection.name}
                onClick={() => dispatch(setSelectedSourceCollection(collection.name))}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedSourceCollection === collection.name
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{collection.name}</div>
                {collection.documentCount !== undefined && (
                  <div className="text-sm text-gray-500">{collection.documentCount} documents</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Destination Tables */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Destination Tables</h3>
          {loading && <p className="text-gray-500">Discovering tables...</p>}
          {!loading && destinationTables.length === 0 && (
            <p className="text-gray-500">No tables found</p>
          )}
          <div className="space-y-2">
            {destinationTables.map((table) => (
              <button
                key={table.name}
                onClick={() => dispatch(setSelectedDestinationTable(table.name))}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedDestinationTable === table.name
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{table.name}</div>
                {table.columnCount !== undefined && (
                  <div className="text-sm text-gray-500">{table.columnCount} columns</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => dispatch(setStep(3))}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedSourceCollection || !selectedDestinationTable}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Map Fields →
        </button>
      </div>
    </div>
  );
}
