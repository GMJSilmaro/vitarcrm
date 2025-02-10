import Head from 'next/head';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { store } from 'store/store';
import { Fragment, useEffect } from 'react';
import { registerLicense } from '@syncfusion/ej2-base';
import ActivityTracker from '../components/ActivityTracker';
import LoadingOverlay from '../components/LoadingOverlay';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LogoProvider } from '../contexts/LogoContext';
import DefaultDashboardLayout from 'layouts/dashboard/DashboardIndexTop';
import DefaultMarketingLayout from 'layouts/marketing/DefaultLayout';
import MainLayout from '@/layouts/MainLayout';
import '../styles/theme.scss';

registerLicense(process.env.SYNCFUSION_LICENSE_KEY);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Separate Protected Layout Component
function ProtectedLayout({ children, router, isSignInPage }) {
  const { currentUser, isAdmin, workerId } = useAuth();

  useEffect(() => {
    if (!currentUser && !isSignInPage) {
      router.push('/authentication/sign-in');
      return;
    }

    const path = router.pathname;
    const adminPaths = ['/', '/dashboard', '/dashboard/overview'];

    if (currentUser) {
      if (isAdmin) {
        // Redirect admin away from user dashboard
        if (path.startsWith('/dashboard/user/')) {
          router.push('/');
        }
      } else {
        // Non-admin users
        if (adminPaths.includes(path)) {
          router.push(`/dashboard/user/${workerId}`);
        }
        // Check user dashboard access
        if (path.startsWith('/dashboard/user/')) {
          const targetWorkerId = router.query.workerId;
          if (targetWorkerId && targetWorkerId !== workerId) {
            router.push(`/dashboard/user/${workerId}`);
          }
        }
      }
    }
  }, [currentUser, isAdmin, workerId, router.pathname, router.query.workerId]);

  // Don't protect sign-in page
  if (isSignInPage) {
    return children;
  }

  // Show loading or return children based on auth state
  return currentUser ? children : <LoadingOverlay />;
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isSignInPage = router.pathname.startsWith('/authentication/');

  // Determine layout based on path
  const getLayout = () => {
    if (isSignInPage) {
      return ({ children }) => <>{children}</>;
    }

    if (router.pathname.startsWith('/dashboard') || router.pathname === '/') {
      return DefaultDashboardLayout;
    }

    return DefaultMarketingLayout;
  };

  const Layout = Component.Layout || getLayout();

  return (
    <Fragment>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' type='image/x-icon' href='/favicon.ico' />
      </Head>
      <AuthProvider>
        <LogoProvider>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <MainLayout showFooter={!isSignInPage}>
                <Layout>
                  <ProtectedLayout router={router} isSignInPage={isSignInPage}>
                    <Component {...pageProps} />
                    {!isSignInPage && <ActivityTracker />}
                  </ProtectedLayout>
                </Layout>
              </MainLayout>
            </QueryClientProvider>
          </Provider>

          <Toaster />
        </LogoProvider>
      </AuthProvider>
    </Fragment>
  );
}

export default MyApp;
