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
  const sourceConfig = useSelector(state => state.migration.sourceConfig);
  const destinationConfig = useSelector(state => state.migration.destinationConfig);
  const sourceCollections = useSelector(state => state.migration.sourceCollections);
  const destinationTables = useSelector(state => state.migration.destinationTables);
  const selectedSourceCollection = useSelector(state => state.migration.selectedSourceCollection);
  const selectedDestinationTable = useSelector(state => state.migration.selectedDestinationTable);
  const loading = useSelector(state => state.migration.loading);

  useEffect(() => {
    // Auto-discover on mount
    if (sourceConfig && sourceCollections.length === 0) {
      dispatch(discoverCollections(sourceConfig));
    }
    if (destinationConfig && destinationTables.length === 0) {
      dispatch(discoverCollections(destinationConfig));
    }
  }, [
    dispatch,
    sourceConfig,
    destinationConfig,
    sourceCollections.length,
    destinationTables.length,
  ]);

  const handleNext = () => {
    if (selectedSourceCollection && selectedDestinationTable) {
      dispatch(setStep(5));
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Discover Data Structures</h2>
      <p className="mb-6 text-gray-600">Select source collection and destination table</p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Source Collections */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Source Collections</h3>
          {loading && <p className="text-gray-500">Discovering collections...</p>}
          {!loading && sourceCollections.length === 0 && (
            <p className="text-gray-500">No collections found</p>
          )}
          <div className="space-y-2">
            {sourceCollections.map(collection => (
              <button
                key={collection.name}
                onClick={() => dispatch(setSelectedSourceCollection(collection.name))}
                className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-all ${
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
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Destination Tables</h3>
          {loading && <p className="text-gray-500">Discovering tables...</p>}
          {!loading && destinationTables.length === 0 && (
            <p className="text-gray-500">No tables found</p>
          )}
          <div className="space-y-2">
            {destinationTables.map(table => (
              <div
                key={table.name}
                className={`w-full rounded-lg border-2 transition-all ${
                  selectedDestinationTable === table.name
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => dispatch(setSelectedDestinationTable(table.name))}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="font-medium text-gray-900">{table.name}</div>
                  {table.columnCount !== undefined && (
                    <div className="text-sm text-gray-500">{table.columnCount} columns</div>
                  )}
                  {table.schema?.primaryKeys && table.schema.primaryKeys.length > 0 && (
                    <div className="mt-1 text-xs text-indigo-600">
                      🔑 PK: {table.schema.primaryKeys.join(', ')}
                    </div>
                  )}
                </button>
                {selectedDestinationTable === table.name && table.schema && (
                  <div className="border-t border-gray-200 bg-white px-4 py-3">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Schema Details:</div>
                    {table.schema.columns && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-600 mb-1">Columns:</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {Object.entries(table.schema.columns).map(([colName, colInfo]) => (
                            <div key={colName} className="text-xs text-gray-700 flex items-center gap-2">
                              <span className="font-mono">{colName}</span>
                              <span className="text-gray-500">({colInfo.type})</span>
                              {table.schema.primaryKeys?.includes(colName) && (
                                <span className="px-1 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                                  PK
                                </span>
                              )}
                              {!colInfo.nullable && (
                                <span className="px-1 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                  NOT NULL
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {table.schema.foreignKeys && table.schema.foreignKeys.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Foreign Keys:</div>
                        <div className="space-y-1">
                          {table.schema.foreignKeys.map((fk, idx) => (
                            <div key={idx} className="text-xs text-gray-700">
                              <span className="font-mono">{fk.columnName}</span>
                              <span className="text-gray-500">
                                {' → '}
                                {fk.foreignTableName}.{fk.foreignColumnName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => dispatch(setStep(3))}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedSourceCollection || !selectedDestinationTable}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next: Map Fields →
        </button>
      </div>
    </div>
  );
}
