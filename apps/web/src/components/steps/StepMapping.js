import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setStep, setMapping } from '../../store/slices/migrationSlice';
import * as api from '../../services/api';

export default function StepMapping() {
  const dispatch = useDispatch();
  const sourceConfig = useSelector(state => state.migration.sourceConfig);
  const destinationConfig = useSelector(state => state.migration.destinationConfig);
  const selectedSourceCollection = useSelector(state => state.migration.selectedSourceCollection);
  const selectedDestinationTable = useSelector(state => state.migration.selectedDestinationTable);

  const [sourceSchema, setSourceSchema] = useState(null);
  const [fieldMappings, setFieldMappings] = useState([]);

  useEffect(() => {
    // Load schemas
    if (selectedSourceCollection && sourceConfig) {
      api.inspectSchema(sourceConfig, selectedSourceCollection).then(result => {
        setSourceSchema(result.schema);
        // Auto-generate mappings
        const autoMappings = Object.keys(result.schema).map(field => ({
          sourceField: field,
          targetField: field,
          sourceType: Array.isArray(result.schema[field])
            ? result.schema[field][0]
            : result.schema[field],
          targetType: 'string', // Default, user can change
        }));
        setFieldMappings(autoMappings);
      });
    }

    // Destination schema can be used for validation in the future
    if (selectedDestinationTable && destinationConfig) {
      api.inspectSchema(destinationConfig, selectedDestinationTable);
    }
  }, [selectedSourceCollection, selectedDestinationTable, sourceConfig, destinationConfig]);

  const handleMappingChange = (index, field, value) => {
    const newMappings = [...fieldMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setFieldMappings(newMappings);
  };

  const handleNext = () => {
    dispatch(setMapping(fieldMappings));
    dispatch(setStep(6));
  };

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Field Mapping</h2>
      <p className="mb-6 text-gray-600">
        Map source fields to destination fields ({selectedSourceCollection} →{' '}
        {selectedDestinationTable})
      </p>

      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Source Field
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Target Field
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Source Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Target Type
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {fieldMappings.map((mapping, index) => (
              <tr key={index}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {mapping.sourceField}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <input
                    type="text"
                    value={mapping.targetField}
                    onChange={e => handleMappingChange(index, 'targetField', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {mapping.sourceType}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    value={mapping.targetType}
                    onChange={e => handleMappingChange(index, 'targetType', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="integer">Integer</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="timestamp">Timestamp</option>
                    <option value="json">JSON</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => dispatch(setStep(4))}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Next: Settings →
        </button>
      </div>
    </div>
  );
}
