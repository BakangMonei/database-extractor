import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setStep } from '../store/slices/migrationSlice';
import StepSource from './steps/StepSource';
import StepDestination from './steps/StepDestination';
import StepConnection from './steps/StepConnection';
import StepDiscover from './steps/StepDiscover';
import StepMapping from './steps/StepMapping';
import StepSettings from './steps/StepSettings';
import StepMigrate from './steps/StepMigrate';

const steps = [
  { id: 1, name: 'Source', description: 'Select source database' },
  { id: 2, name: 'Destination', description: 'Select destination database' },
  { id: 3, name: 'Connection', description: 'Configure connections' },
  { id: 4, name: 'Discover', description: 'Discover data structures' },
  { id: 5, name: 'Mapping', description: 'Map fields' },
  { id: 6, name: 'Settings', description: 'Migration settings' },
  { id: 7, name: 'Migrate', description: 'Run migration' },
];

export default function MigrationWizard() {
  const dispatch = useDispatch();
  const currentStep = useSelector(state => state.migration.step);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepSource />;
      case 2:
        return <StepDestination />;
      case 3:
        return <StepConnection />;
      case 4:
        return <StepDiscover />;
      case 5:
        return <StepMapping />;
      case 6:
        return <StepSettings />;
      case 7:
        return <StepMigrate />;
      default:
        return <StepSource />;
    }
  };

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Step indicator */}
      <div className="border-b border-gray-200 px-6 py-4">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li
                key={step.id}
                className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}
              >
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div
                      className={`h-0.5 w-full ${
                        step.id < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
                <button
                  onClick={() => step.id <= currentStep && dispatch(setStep(step.id))}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    step.id < currentStep
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : step.id === currentStep
                        ? 'border-2 border-indigo-600 bg-white'
                        : 'border-2 border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      step.id < currentStep
                        ? 'bg-white'
                        : step.id === currentStep
                          ? 'bg-indigo-600'
                          : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </button>
                <div className="absolute left-1/2 mt-4 hidden -translate-x-1/2 sm:block">
                  <p
                    className={`text-xs font-medium ${
                      step.id === currentStep ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step content */}
      <div className="px-6 py-8">{renderStep()}</div>
    </div>
  );
}
