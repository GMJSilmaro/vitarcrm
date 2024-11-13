import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run auth listener if we're in the browser and auth is initialized
    if (typeof window !== 'undefined' && auth) {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
        }, (error) => {
          console.error('Auth state change error:', error);
          setError(error);
          setLoading(false);
        });

        // Cleanup subscription
        return () => unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error);
        setLoading(false);
      }
    } else {
      // If we're not in browser or auth isn't initialized, set loading to false
      setLoading(false);
    }
  }, []);

  // Provide loading state while Firebase auth is initializing
  if (loading) {
    return (
      <AuthContext.Provider value={{ currentUser: null, loading: true, error: null }}>
        {/* You can optionally render a loading spinner here */}
        <div>Loading...</div>
      </AuthContext.Provider>
    );
  }

  // If there was an error initializing auth, you might want to handle it
  if (error) {
    console.error('Auth error:', error);
    // You could render an error message or fallback UI here
  }

  const value = {
    currentUser,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}