import React from 'react';
import { TestAuthProvider, useAuth } from './context/TestAuthContext';
import { TestLogin } from './components/auth/TestLogin';
import App from './components/App/App';

const AppContent: React.FC = () => {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <TestLogin onLogin={login} />;
  }

  return <App />;
};

function AppWrapper() {
  return (
    <TestAuthProvider>
      <AppContent />
    </TestAuthProvider>
  );
}

export default AppWrapper;
