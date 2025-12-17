import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { User } from './types';
import { authService } from './services/authService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin config to toggle registration
  const ALLOW_REGISTRATION = true; 

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  return (
    <>
      {!user ? (
        <AuthScreen onLogin={handleLogin} allowRegistration={ALLOW_REGISTRATION} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;