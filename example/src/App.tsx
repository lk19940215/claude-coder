import React from 'react';
import { Outlet } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <div id="app" className="dark min-h-screen bg-[var(--bg-100)]">
      <Outlet />
    </div>
  );
};

export default App;
