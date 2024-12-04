import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [workerId, setWorkerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setUserRole(Cookies.get('userRole') || null);
          setWorkerId(Cookies.get('workerId') || null);
          setLoading(false);
        }, (error) => {
          console.error('Auth state change error:', error);
          setError(error);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    userRole,
    workerId,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
}