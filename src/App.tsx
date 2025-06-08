import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  return (
    <>
      <Dashboard />
      <Toaster />
    </>
  );
}

export default App;