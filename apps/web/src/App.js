import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MigrationWizard from './components/MigrationWizard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">DB Migrate</h1>
          <p className="text-sm text-gray-600">Open-source database migration tool</p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<MigrationWizard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
