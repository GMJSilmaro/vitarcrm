import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from "react-redux";
import { store } from "store/store";
import { Fragment } from "react";
import { registerLicense } from "@syncfusion/ej2-base";
import ActivityTracker from '../components/ActivityTracker';
import LoadingOverlay from '../components/LoadingOverlay';
import { SettingsProvider } from '../contexts/SettingsContext';
import { Toaster } from 'react-hot-toast';
import { LogoProvider } from '../contexts/LogoContext';
import { AuthProvider } from '../contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import DefaultMarketingLayout from "layouts/marketing/DefaultLayout";
import DefaultDashboardLayout from "layouts/dashboard/DashboardIndexTop";
import MainLayout from "@/layouts/MainLayout";
import WorkerProfileLayout from "layouts/marketing/worker/ProfileLayout";
import "../styles/theme.scss";

registerLicense(process.env.SYNCFUSION_LICENSE_KEY);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

function AppContent({ Component, pageProps, router }) {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  
  const pageURL = process.env.baseURL + router.pathname;
  const title = "VITAR Group - CRM & Calibration Management System";
  const description = "VITAR Group's comprehensive CRM and Calibration Management System...";
  const keywords = "CRM System, Calibration Management...";

  const getLayout = () => {
    if (Component.Layout) {
      return Component.Layout;
    }

    if (router.pathname.startsWith('/user/')) {
      return WorkerProfileLayout;
    }

    if (router.pathname.includes("dashboard")) {
      return DefaultDashboardLayout;
    }

    return DefaultMarketingLayout;
  };

  const Layout = getLayout();

  const isSignInPage = router.pathname === '/sign-in' || 
                      router.pathname === '/authentication/sign-in';

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  useEffect(() => {
    const toastMessage = searchParams.get('toast');
    if (toastMessage) {
      toast.error(toastMessage, {
        duration: 5000,
        style: {
          background: '#fff',
          color: 'red',
          padding: '16px',
          borderLeft: '6px solid red',
          borderRadius: '4px'
        }
      });
    }
  }, [searchParams]);

  return (
    <Fragment>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content={keywords} />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <NextSeo
        title={title}
        description={description}
        canonical={pageURL}
        openGraph={{
          url: pageURL,
          title: title,
          description: description,
          site_name: process.env.siteName,
        }}
      />
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MainLayout showFooter={!isSignInPage}>
            <Layout>
              <Component {...pageProps} setIsLoading={setIsLoading} />
              {!router.pathname.startsWith('/authentication/') && <ActivityTracker />}
              <LoadingOverlay isLoading={isLoading} />
            </Layout>
          </MainLayout>
        </QueryClientProvider>
      </Provider>
     
    </Fragment>
  );
}

function MyApp(props) {
  // Wrap everything in providers, with AuthProvider as the outermost wrapper
  return (
    <AuthProvider>
      <LogoProvider>
        <SettingsProvider>
          <AppContent {...props} />
        </SettingsProvider>
      </LogoProvider>
    </AuthProvider>
  );
}

export default MyApp;

