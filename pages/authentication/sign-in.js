import { Fragment, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Card,
  Form,
  Button,
  Image,
  Spinner,
  InputGroup,
  Container,
  Row,
  Col,
} from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useSettings } from '../../hooks/useSettings';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { SessionManager } from '../../utils/sessionManager';

// Update the loadingMessages array with more realistic steps
const loadingMessages = [
  {
    title: '<span class="fw-bold text-primary">Welcome Back! 👋</span>',
    message: 'Verifying your credentials...',
    progress: 15,
  },
  {
    title: '<span class="fw-bold text-primary">Authenticating! 🔐</span>',
    message: 'Establishing secure connection...',
    progress: 30,
  },
  {
    title: '<span class="fw-bold text-primary">Connecting to VITAR Database! 🔄</span>',
    message: 'Initializing VITAR Database connection...',
    progress: 45,
  },
  {
    title: '<span class="fw-bold text-primary">Setting Up! ⚡</span>',
    message: 'Creating session and retrieving company databases...',
    progress: 60,
  },
  {
    title: '<span class="fw-bold text-primary">Almost Ready! 📊</span>',
    message: 'Loading user permissions and preferences...',
    progress: 75,
  },
  {
    title: '<span class="fw-bold text-primary">Final Steps! 🚀</span>',
    message: 'Synchronizing with VITAR services...',
    progress: 90,
  },
];

const LoadingMessage = () => {
  const messages = [
    'Preparing your workspace...',
    'Checking credentials...',
    'Almost there...',
    'Starting up the engines...',
    'Loading your dashboard...',
    'Connecting to services...',
    'Configuring your settings...',
    'Getting everything ready...',
  ];

  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      const messageElement = document.getElementById('loading-message');
      if (messageElement) {
        messageElement.style.opacity = '0';
      }

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setMessage(messages[currentIndex]);

        if (messageElement) {
          messageElement.style.opacity = '1';
        }
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className='fw-semibold mb-2'>Signing in...</div>
      <small
        id='loading-message'
        className='text-muted'
        style={{
          display: 'block',
          transition: 'opacity 0.5s ease-in-out',
          opacity: 1,
        }}
      >
        {message}
      </small>
    </div>
  );
};

const SignIn = () => {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    return () => {
      Swal.close();
      setIsLoading(false);
    };
  }, []);

  const handleAuthentication = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      return data;
    } catch (error) {
      console.error('Authentication Error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Show initial loading state
      const loadingModal = await Swal.fire({
        title: loadingMessages[0].title,
        html: `
          <div class="text-center mb-4">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <div class="text-muted mb-3">${loadingMessages[0].message}</div>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar progress-bar-striped progress-bar-animated" 
                   role="progressbar" 
                   style="width: ${loadingMessages[0].progress}%">
              </div>
            </div>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: async (modal) => {
          try {
            // Just call signIn directly - it will handle the API call
            const signInSuccess = await signIn(email, password);

            console.log({ signInSuccess });

            if (!signInSuccess) {
              throw new Error('Authentication failed');
            }

            // Continue with your loading messages and success state
            // Simulate connection steps with proper error handling
            for (let i = 1; i < loadingMessages.length; i++) {
              await new Promise((resolve) => setTimeout(resolve, 400));

              modal.querySelector('.swal2-title').innerHTML = loadingMessages[i].title;
              modal.querySelector('.swal2-html-container').innerHTML = `
                <div class="text-center mb-2">
                  <div class="spinner-border text-primary mb-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <div class="text-muted mb-2">${loadingMessages[i].message}</div>
                  <div class="progress" style="height: 6px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" 
                         style="width: ${loadingMessages[i].progress}%">
                    </div>
                  </div>
                </div>
              `;
            }

            // Show success state
            modal.querySelector('.swal2-title').innerHTML =
              '<span class="fw-bold text-success">Connection Established! 🎉</span>';
            modal.querySelector('.swal2-html-container').innerHTML = `
              <div class="text-center">
                <div class="checkmark-circle mb-2">
                  <div class="checkmark draw"></div>
                </div>
                <div class="text-muted mb-2">Welcome back! Redirecting to dashboard...</div>
                <div class="progress mb-2" style="height: 6px;">
                  <div class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                </div>
                <button class="btn btn-primary px-4 py-2 mt-3">
                  Go to Dashboard
                </button>
              </div>
            `;

            // const redirectButton = modal.querySelector('.btn-primary');
            // redirectButton.addEventListener('click', () => {
            //   Swal.close();
            //   router.push('/');
            // });

            // Auto redirect after 2 seconds
            // setTimeout(() => {
            //   Swal.close();
            //   router.push('/');
            // }, 2000);
          } catch (error) {
            console.error('Authentication Error:', error);
            Swal.close();

            await Swal.fire({
              icon: 'error',
              title: 'Authentication Failed',
              text: error.message || 'Unable to connect. Please try again.',
              confirmButtonText: 'Try Again',
              showCancelButton: true,
              cancelButtonText: 'Need Help?',
              customClass: {
                popup: 'shadow-lg',
                confirmButton: 'btn btn-primary px-4 me-2',
                cancelButton: 'btn btn-outline-secondary px-4',
              },
              buttonsStyling: false,
            });
          }
        },
      });
    } catch (error) {
      console.error('Login Error:', error);
      toast.error(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Fragment>
      <Toaster
        position='top-center'
        toastOptions={{
          id: 'login-notification',
          style: { zIndex: 9999 },
        }}
      />

      <Container fluid className='p-0'>
        <Row className='g-0 min-vh-100'>
          {/* Left side with field service background */}
          <Col md={6} className='d-none d-md-block position-relative'>
            <div className='bg-image h-100'>
              <div className='overlay-gradient d-flex flex-column justify-content-center text-white p-5 h-100'>
                <h1 className='display-4 fw-bold mb-4'>Welcome Back!</h1>
                <p className='lead'>
                  Access your CRM & Calibration Management dashboard and manage your operations
                  efficiently.
                </p>
              </div>
            </div>
          </Col>

          {/* Right side - Sign In Form */}
          <Col
            md={6}
            className='d-flex align-items-center justify-content-center bg-white p-4 p-md-5'
          >
            <Card className='border-0 w-100 shadow-lg'>
              <Card.Body className='p-4 p-md-5'>
                <div className='text-center mb-5'>
                  <Image
                    src='/images/VITARLOGO.svg'
                    alt='Vitar Logo'
                    className='mb-4 img-fluid mw-100'
                  />
                  <h2 className='fw-bold text-dark mb-3'>Sign In</h2>
                  <p className='text-muted'>Enter your credentials to continue</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Form.Group className='mb-4' controlId='email'>
                    <Form.Label className='fw-semibold text-dark'>Email Address</Form.Label>
                    <InputGroup className='shadow-sm'>
                      <InputGroup.Text className='bg-light border-0'>
                        <FaEnvelope className='text-primary' />
                      </InputGroup.Text>
                      <Form.Control
                        type='email'
                        placeholder='name@email.com'
                        className='border-0 py-2.5'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className='mb-4' controlId='password'>
                    <InputGroup className='shadow-sm'>
                      <InputGroup.Text className='bg-light border-0'>
                        <FaLock className='text-muted' />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Enter your password'
                        className='border-0 py-2.5'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                      <Button
                        variant='light'
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className='mb-4'>
                    <Form.Check
                      type='checkbox'
                      id='rememberMe'
                      label='Remember me'
                      className='text-muted'
                    />
                  </Form.Group>

                  <Button
                    variant='primary'
                    type='submit'
                    className='w-75 py-3 mb-4 rounded-pill shadow-sm mx-auto d-block'
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className='d-flex align-items-center justify-content-center'>
                        <Spinner animation='border' size='sm' className='me-2' />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className='text-center'>
                    <p className='text-muted small'>
                      By signing in, you agree to our{' '}
                      <Link href='#' className='text-primary text-decoration-none'>
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href='#' className='text-primary text-decoration-none'>
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style jsx global>{`
        .bg-image {
          background-image: url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1470&h=850');
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .overlay-gradient {
          background: linear-gradient(
            135deg,
            rgba(50, 50, 50, 0.85) 0%,
            rgba(25, 25, 25, 0.85) 100%
          );
          backdrop-filter: blur(2px);
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .card {
          border-radius: 1rem;
          transition: all 0.3s ease;
        }

        .form-control,
        .input-group-text {
          border: none;
          padding: 0.75rem 1rem;
        }

        .input-group {
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .display-4 {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.2;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          color: #ffffff;
        }

        .lead {
          font-size: 1.25rem;
          font-weight: 300;
          line-height: 1.6;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .display-4 {
            font-size: 2.5rem;
          }
          .lead {
            font-size: 1.1rem;
          }
        }

        /* Animation classes */
        .animated {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }

        .fadeInUp {
          animation-name: fadeInUp;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 20px, 0);
          }

          to {
            opacity: 1;
            transform: none;
          }
        }

        :root {
          --toaster-z-index: 9999;
        }

        .loading-toast {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          background: white !important;
          z-index: 9999 !important;
        }

        .bg-gradient-overlay {
          background: linear-gradient(rgba(0, 97, 242, 0.8), rgba(105, 0, 242, 0.8));
        }

        .img-fluid {
          max-width: 100%;
          height: auto;
        }

        /* Input Field Animations and Styling */
        .input-group {
          border-radius: 0.75rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .input-group:focus-within {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 97, 242, 0.1);
        }

        .form-control,
        .input-group-text {
          border: none;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
        }

        .input-group:focus-within .input-group-text {
          background-color: #f8f9ff; /* Matching background for the icon container */
          color: #0061f2;
        }

        .input-group:focus-within .text-primary {
          transform: scale(1.1); /* Slightly enlarge the icon */
        }

        /* Optional: Add a subtle scale animation when clicking the input */
        .form-control:active {
          transform: scale(0.995);
        }

        /* Input Label Animation */
        .form-label {
          transition: all 0.3s ease;
          position: relative;
        }

        .form-label::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, #0061f2 0%, #6900f2 100%);
          transition: width 0.3s ease;
        }

        .input-group:focus-within + .form-label::after {
          width: 100%;
        }

        /* Enhanced placeholder animation */
        .form-control::placeholder {
          transition: all 0.3s ease;
        }

        .form-control:focus::placeholder {
          opacity: 0.7;
          transform: translateX(5px);
        }

        /* Add a subtle pulse animation to the icon when focused */
        @keyframes iconPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .input-group:focus-within .input-group-text svg {
          animation: iconPulse 1s ease infinite;
          color: #0061f2;
        }

        /* Add a gentle glow effect */
        .input-group:focus-within {
          box-shadow: 0 0 0 3px rgba(0, 97, 242, 0.1);
        }

        /* Smooth transition for the entire form group */
        .form-group {
          transition: all 0.3s ease;
        }

        .form-group:focus-within {
          transform: translateY(-2px);
        }

        /* SweetAlert2 Custom Styles */
        .swal2-popup {
          border-radius: 1rem;
          padding: 1.5rem;
          max-width: 400px;
        }

        .swal2-icon {
          border-width: 3px !important;
          margin: 1.5rem auto !important;
        }

        .swal2-title {
          font-size: 1.5rem !important;
          margin: 0 0 0.5rem 0 !important;
          padding: 0 !important;
        }

        .swal2-html-container {
          margin: 0 !important;
          line-height: 1.5;
        }

        .swal2-actions {
          margin-top: 1.5rem !important;
        }

        .list-unstyled {
          padding-left: 0;
          list-style: none;
        }

        .alert-info {
          background-color: #f8f9fa;
          border-left: 4px solid #0061f2;
          padding: 1rem;
        }

        .shadow-lg {
          box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
        }

        /* Animation for error icon */
        @keyframes errorPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        .swal2-icon.swal2-error {
          animation: errorPulse 1s ease-in-out;
        }

        /* Loading Animation Styles */
        .progress {
          background-color: #e9ecef;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        /* Optimize animations */
        .swal2-popup {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }

        .swal2-show {
          animation: swal2-show 0.3s ease-out;
        }

        .swal2-hide {
          animation: swal2-hide 0.15s ease-in forwards;
        }

        @keyframes swal2-show {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes swal2-hide {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0;
          }
        }

        /* Success Alert Styles */
        .swal2-success-ring {
          border-color: #0061f2 !important;
        }

        .swal2-icon.swal2-success {
          border-color: #0061f2 !important;
          color: #0061f2 !important;
        }

        .swal2-icon.swal2-success [class^='swal2-success-line'] {
          background-color: #0061f2 !important;
        }

        .swal2-timer-progress-bar {
          height: 0.25rem !important;
          opacity: 0.7;
          background: linear-gradient(to right, #0061f2, #6900f2) !important;
          transition: width 0.1s ease-in-out;
        }

        /* Pulse Animation for Button */
        .pulse-animation {
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 97, 242, 0.7);
          }

          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(0, 97, 242, 0);
          }

          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 97, 242, 0);
          }
        }

        /* Progress Bar Animation */
        .swal2-timer-progress-bar {
          height: 0.25rem !important;
          opacity: 0.7;
          background: linear-gradient(to right, #0061f2, #6900f2) !important;
          transition: width 0.1s ease-in-out;
        }

        /* Success Message Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 20px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        .animated {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }

        .fadeInUp {
          animation-name: fadeInUp;
        }

        /* Container Styles */
        .countdown-text {
          font-size: 1.1rem;
          color: #6c757d;
        }

        .countdown-text strong {
          color: #0061f2;
          font-size: 1.2rem;
        }

        /* Error Alert Styles */
        .swal2-icon.swal2-error {
          border-color: #1e40a6;
          color: #1e40a6;
        }

        .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
          background-color: #1e40a6;
        }

        .animated {
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 20px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        .fadeInUp {
          animation-name: fadeInUp;
        }

        /* Ensure proper z-index stacking */
        .swal2-container {
          z-index: 9999;
        }

        /* Smooth transition for buttons */
        .btn {
          transition: all 0.2s ease-in-out;
        }

        .btn:active {
          transform: scale(0.95);
        }

        /* Spinner customization */
        .spinner-border {
          width: 2.5rem;
          height: 2.5rem;
          border-width: 0.25em;
        }

        /* Checkmark animation */
        .checkmark-circle {
          width: 40px;
          height: 40px;
          position: relative;
          display: inline-block;
          vertical-align: top;
          margin-left: auto;
          margin-right: auto;
        }

        .checkmark {
          width: 24px;
          height: 48px;
          position: absolute;
          transform: rotate(45deg);
          left: 14px;
          top: 0px;
        }

        .checkmark.draw:after {
          content: '';
          width: 6px;
          height: 0;
          background-color: #198754;
          position: absolute;
          right: 0;
          top: 0;
          animation: drawCheck 0.2s ease-in-out 0s forwards;
        }

        .checkmark.draw::before {
          content: '';
          width: 0;
          height: 6px;
          background-color: #198754;
          position: absolute;
          left: 0;
          bottom: 0;
          animation: drawCheck 0.2s ease-in-out 0.2s forwards;
        }

        @keyframes drawCheck {
          0% {
            width: 0;
            height: 0;
          }
          100% {
            width: 100%;
            height: 100%;
          }
        }

        /* Progress bar enhancement */
        .progress {
          background-color: #e9ecef;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .progress-bar-animated {
          animation: progress-bar-stripes 1s linear infinite;
        }

        /* Modal enhancement */
        .swal2-popup {
          padding: 1.5rem;
        }

        .swal2-title {
          font-size: 1.5rem !important;
          margin-bottom: 1rem !important;
        }

        .text-muted {
          color: #6c757d !important;
          font-size: 1.1rem;
        }

        /* Countdown text styling */
        .countdown-text {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-bottom: 1rem;
        }

        /* Animation for countdown */
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            opacity: 1;
          }
        }

        .countdown-text .fw-bold {
          animation: pulse 1s infinite;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
          border: none;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 0, 0, 0.2);
        }

        .text-primary {
          color: #ff0000 !important;
        }

        .form-control:focus {
          box-shadow: none;
          border-color: #ff0000;
        }

        .input-group:focus-within .input-group-text {
          color: #ff0000;
        }

        .form-label::after {
          background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
        }

        .input-group:focus-within .input-group-text svg {
          color: #ff0000;
        }

        .input-group:focus-within {
          box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.1);
        }

        .alert-info {
          border-left: 4px solid #ff0000;
        }

        .progress-bar {
          background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
        }

        .swal2-success-ring {
          border-color: #ff0000 !important;
        }

        .swal2-icon.swal2-success {
          border-color: #ff0000 !important;
          color: #ff0000 !important;
        }

        .swal2-icon.swal2-success [class^='swal2-success-line'] {
          background-color: #ff0000 !important;
        }

        .swal2-timer-progress-bar {
          background: linear-gradient(to right, #ff0000, #cc0000) !important;
        }

        .countdown-text strong {
          color: #ff0000;
        }
      `}</style>
    </Fragment>
  );
};

export default SignIn;
