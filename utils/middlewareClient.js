import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

export async function logMiddlewareActivity(activity, path) {
  try {
    const response = await fetch('/api/logMiddlewareActivity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity,
        timestamp: new Date().toISOString(),
        workerId: Cookies.get('workerId') || 'UNKNOWN',
        path
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to log activity: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to log middleware activity:', error);
  }
}

export async function validateSession() {
  console.log('🔍 Validating session...');
  
  try {
    // Check essential cookies
    const essentialCookies = {
      customToken: Cookies.get('customToken'),
      uid: Cookies.get('uid'),
      workerId: Cookies.get('workerId'),
      userRole: Cookies.get('userRole')
    };

    // Log current cookie state
    console.log('🍪 Current cookies:', essentialCookies);

    // Check if any essential cookies are missing
    const missingCookies = Object.entries(essentialCookies)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingCookies.length > 0) {
      console.error('⚠️ Missing cookies:', missingCookies);
      return false;
    }

    // Additional validation for worker routes
    const pathname = window.location.pathname;
    if (pathname.startsWith('/user/')) {
      const urlWorkerId = pathname.split('/')[2];
      const currentWorkerId = essentialCookies.workerId;
      const userRole = essentialCookies.userRole;

      // Validate access to worker profile
      if (urlWorkerId && 
          urlWorkerId !== currentWorkerId && 
          !['admin', 'supervisor'].includes(userRole)) {
        console.error('⚠️ Unauthorized worker profile access');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return false;
  }
}

// Initialize session check with configurable interval
export const initializeSessionRenewalCheck = (router, interval = 30000) => {
  console.log('🚀 Initializing session check');
  
  let checkInterval;

  const checkSession = async () => {
    const isValid = await validateSession();
    if (!isValid) {
      console.log('❌ Invalid session detected');
      clearInterval(checkInterval);
      handleSessionError(router);
    }
  };
  
  // Initial check
  checkSession();
  
  // Set up interval
  checkInterval = setInterval(checkSession, interval);
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up session check interval');
    clearInterval(checkInterval);
  };
};

// Handle session errors
export const handleSessionError = (router) => {
  console.log('🚨 Handling session error');
  
  // Clear all cookies
  const cookies = Cookies.get();
  Object.keys(cookies).forEach(cookieName => {
    Cookies.remove(cookieName, { path: '/' });
  });

  // Show error message
  toast.error('Session expired. Please sign in again.', {
    duration: 5000,
    position: 'top-center'
  });

  // Redirect to sign-in
  router.push('/sign-in');
};

export async function validateWorkerAccess(targetWorkerId) {
  const currentWorkerId = Cookies.get('workerId');
  const userRole = Cookies.get('userRole');

  if (!currentWorkerId || !userRole) {
    console.error('⚠️ Missing worker credentials');
    return false;
  }

  const hasAccess = 
    targetWorkerId === currentWorkerId || 
    ['admin', 'supervisor'].includes(userRole);

  console.log('🔒 Worker access check:', {
    targetWorkerId,
    currentWorkerId,
    userRole,
    hasAccess
  });

  return hasAccess;
}