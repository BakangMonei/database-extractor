import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  setStep,
  discoverCollections,
  setSelectedSourceCollection,
  setSelectedDestinationTable,
} from '../../store/slices/migrationSlice';
import * as api from '../../services/api';
import DataPreviewModal from '../DataPreviewModal';

export default function StepDiscover() {
  const dispatch = useDispatch();
  const sourceConfig = useSelector(state => state.migration.sourceConfig);
  const destinationConfig = useSelector(state => state.migration.destinationConfig);
  const sourceCollections = useSelector(state => state.migration.sourceCollections);
  const destinationTables = useSelector(state => state.migration.destinationTables);
  const selectedSourceCollection = useSelector(state => state.migration.selectedSourceCollection);
  const selectedDestinationTable = useSelector(state => state.migration.selectedDestinationTable);
  const loading = useSelector(state => state.migration.loading);

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: '',
    data: null,
    schema: null,
  });

  useEffect(() => {
    // Auto-discover on mount
    if (sourceConfig && sourceCollections.length === 0) {
      dispatch(discoverCollections(sourceConfig)).then(result => {
        if (discoverCollections.fulfilled.match(result)) {
          const count = result.payload.collections?.length || 0;
          if (count > 0) {
            toast.success(`Found ${count} collection(s)`);
          }
        }
      });
    }
    if (destinationConfig && destinationTables.length === 0) {
      dispatch(discoverCollections(destinationConfig)).then(result => {
        if (discoverCollections.fulfilled.match(result)) {
          const count = result.payload.collections?.length || 0;
          if (count > 0) {
            toast.success(`Found ${count} table(s)`);
          }
        }
      });
    }
  }, [
    dispatch,
    sourceConfig,
    destinationConfig,
    sourceCollections.length,
    destinationTables.length,
  ]);

  const handlePreviewCollection = async (collectionName, isSource = true) => {
    try {
      toast.loading('Loading preview data...', { id: 'preview' });
      const config = isSource ? sourceConfig : destinationConfig;
      const [dataResult, schemaResult] = await Promise.all([
        api.previewData(config, collectionName, 10),
        api.inspectSchema(config, collectionName).catch(() => null),
      ]);

      setPreviewModal({
        isOpen: true,
        title: `${isSource ? 'Collection' : 'Table'}: ${collectionName}`,
        data: dataResult.data || [],
        schema: schemaResult?.schema || null,
      });
      toast.success('Preview loaded', { id: 'preview' });
    } catch (error) {
      toast.error('Failed to load preview', { id: 'preview' });
    }
  };

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
              <div
                key={collection.name}
                className={`w-full rounded-lg border-2 transition-all ${
                  selectedSourceCollection === collection.name
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    onClick={() => dispatch(setSelectedSourceCollection(collection.name))}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-gray-900">{collection.name}</div>
                    {collection.documentCount !== undefined && (
                      <div className="text-sm text-gray-500">{collection.documentCount} documents</div>
                    )}
                  </button>
                  <button
                    onClick={() => handlePreviewCollection(collection.name, true)}
                    className="ml-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Preview
                  </button>
                </div>
              </div>
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
                    <div className="mb-2 text-sm font-semibold text-gray-700">Schema Details:</div>
                    {table.schema.columns && (
                      <div className="mb-3">
                        <div className="mb-1 text-xs font-medium text-gray-600">Columns:</div>
                        <div className="max-h-32 space-y-1 overflow-y-auto">
                          {Object.entries(table.schema.columns).map(([colName, colInfo]) => (
                            <div
                              key={colName}
                              className="flex items-center gap-2 text-xs text-gray-700"
                            >
                              <span className="font-mono">{colName}</span>
                              <span className="text-gray-500">({colInfo.type})</span>
                              {table.schema.primaryKeys?.includes(colName) && (
                                <span className="rounded bg-indigo-100 px-1 py-0.5 text-xs text-indigo-700">
                                  PK
                                </span>
                              )}
                              {!colInfo.nullable && (
                                <span className="rounded bg-red-100 px-1 py-0.5 text-xs text-red-700">
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
                        <div className="mb-1 text-xs font-medium text-gray-600">Foreign Keys:</div>
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

      <DataPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        title={previewModal.title}
        data={previewModal.data}
        schema={previewModal.schema}
      />

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
