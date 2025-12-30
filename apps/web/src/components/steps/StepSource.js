import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSource, setStep } from '../../store/slices/migrationSlice';

const databaseTypes = [
  { id: 'firebase-firestore', name: 'Firebase Firestore', icon: '🔥' },
  { id: 'mongodb', name: 'MongoDB', icon: '🍃' },
  { id: 'postgresql', name: 'PostgreSQL', icon: '🐘' },
  { id: 'mysql', name: 'MySQL', icon: '🗄️' },
];

export default function StepSource() {
  const dispatch = useDispatch();
  const source = useSelector((state) => state.migration.source);

  const handleSelect = (type) => {
    dispatch(setSource(type));
    dispatch(setStep(2));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Source Database</h2>
      <p className="text-gray-600 mb-6">Choose the database you want to migrate from</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {databaseTypes.map((db) => (
          <button
            key={db.id}
            onClick={() => handleSelect(db.id)}
            className={`relative rounded-lg border-2 p-6 text-left transition-all hover:shadow-md ${
              source === db.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <span className="text-4xl mr-4">{db.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{db.name}</h3>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
