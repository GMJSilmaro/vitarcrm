import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { SessionManager } from '@/utils/sessionManager';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

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
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
  let activityTimer;
  const router = useRouter();

  // Sign in with session management
  const signIn = async (email, password) => {
    try {
      // Check for existing session
      const hasExistingSession = await SessionManager.checkExistingSession(email);
      if (hasExistingSession) {
        await Swal.fire({
          icon: 'error',
          title: 'Active Session Detected',
          text: 'Another session is already active. Please sign out from other devices first.',
          confirmButtonColor: '#dc3545',
          confirmButtonText: 'Understood'
        });
        return false;
      }

      // Create new session
      const sessionCreated = await SessionManager.createSession(email);
      if (!sessionCreated) {
        throw new Error('Failed to create session');
      }

      // Set current user after successful session creation
      setCurrentUser({ email });
      setUserRole(Cookies.get('userRole'));
      setWorkerId(Cookies.get('workerId'));

      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Sign out with session cleanup
  const signOut = async () => {
    try {
      // Call logout API endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: currentUser?.email })
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      if (currentUser) {
        await SessionManager.endSession(currentUser.email);
      }
      
      // Clear cookies and state
      Cookies.remove('userRole');
      Cookies.remove('workerId');
      setCurrentUser(null);
      setUserRole(null);
      setWorkerId(null);

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Signed Out Successfully',
        text: 'You have been safely logged out.',
        timer: 2000,
        showConfirmButton: false
      });

      router.push('/authentication/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      // Show error message
      await Swal.fire({
        icon: 'error',
        title: 'Sign Out Error',
        text: 'There was a problem signing you out. Please try again.',
        confirmButtonColor: '#dc3545'
      });
      throw error;
    }
  };

  // Handle user activity
  const handleUserActivity = () => {
    if (currentUser) {
      SessionManager.updateLastActive(currentUser.email);
      clearTimeout(activityTimer);
      activityTimer = setTimeout(handleIdle, IDLE_TIMEOUT);
    }
  };

  // Handle idle timeout
  const handleIdle = async () => {
    if (currentUser) {
      await SessionManager.endSession(currentUser.email);
      await Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your session has expired due to inactivity. Please sign in again.',
        confirmButtonColor: '#dc3545',
        timer: 5000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      await signOut();
    }
  };

  // Set up activity listeners
  useEffect(() => {
    if (currentUser) {
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      activityTimer = setTimeout(handleIdle, IDLE_TIMEOUT);
    }

    return () => {
      if (currentUser) {
        SessionManager.endSession(currentUser.email);
      }
      clearTimeout(activityTimer);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [currentUser]);

  // Initialize loading state
  useEffect(() => {
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    userRole,
    workerId,
    loading,
    error,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
}