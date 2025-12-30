import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal component for previewing collection/table data
 */
export default function DataPreviewModal({ isOpen, onClose, title, data, schema }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {schema && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Schema</h4>
                <div className="rounded-md bg-gray-50 p-3">
                  <div className="space-y-1">
                    {Object.entries(schema.columns || {}).map(([colName, colInfo]) => (
                      <div key={colName} className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-medium">{colName}</span>
                        <span className="text-gray-500">({colInfo.type})</span>
                        {schema.primaryKeys?.includes(colName) && (
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">
                            PK
                          </span>
                        )}
                        {!colInfo.nullable && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                            NOT NULL
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data && data.length > 0 ? (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">
                  Preview Data ({data.length} records)
                </h4>
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(data[0]).map(key => (
                          <th
                            key={key}
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {data.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          {Object.entries(row).map(([key, value]) => (
                            <td
                              key={key}
                              className="whitespace-nowrap px-4 py-3 text-sm text-gray-900"
                            >
                              {typeof value === 'object' && value !== null
                                ? JSON.stringify(value).substring(0, 50) + '...'
                                : String(value).substring(0, 100)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 10 && (
                    <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500">
                      Showing first 10 of {data.length} records
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
