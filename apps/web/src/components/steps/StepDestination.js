import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setDestination, setStep } from '../../store/slices/migrationSlice';

const databaseTypes = [
  { id: 'firebase-firestore', name: 'Firebase Firestore', icon: '🔥' },
  { id: 'mongodb', name: 'MongoDB', icon: '🍃' },
  { id: 'postgresql', name: 'PostgreSQL', icon: '🐘' },
  { id: 'mysql', name: 'MySQL', icon: '🗄️' },
];

export default function StepDestination() {
  const dispatch = useDispatch();
  const source = useSelector(state => state.migration.source);
  const destination = useSelector(state => state.migration.destination);

  // Filter out source database from options
  const availableTypes = databaseTypes.filter(db => db.id !== source);

  const handleSelect = type => {
    dispatch(setDestination(type));
    dispatch(setStep(3));
  };

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Select Destination Database</h2>
      <p className="mb-6 text-gray-600">Choose the database you want to migrate to</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {availableTypes.map(db => (
          <button
            key={db.id}
            onClick={() => handleSelect(db.id)}
            className={`relative rounded-lg border-2 p-6 text-left transition-all hover:shadow-md ${
              destination === db.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-4 text-4xl">{db.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{db.name}</h3>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={() => dispatch(setStep(1))}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Source Selection
        </button>
      </div>
    </div>
  );
}
