import Cookies from 'js-cookie';
import Link from 'next/link';

import { memo } from 'react';
import { Dropdown, Image } from 'react-bootstrap';
import { BoxArrowRight, Gear, Person } from 'react-bootstrap-icons';
import Swal from 'sweetalert2';
import { useLogo } from '@/contexts/LogoContext';
import TodayDate from '@/sub-components/dashboard/user/jobs/TodayDate';
import NotificationMenu from './NotificationMenu';

const UserLayoutHeader = ({ user }) => {
  const { logo } = useLogo();

  // Sign out function
  const handleSignOut = async () => {
    try {
      // First show confirmation alert
      const confirmResult = await Swal.fire({
        title: '<span class="fw-bold text-primary">Sign Out? 👋</span>',
        html: `
            <div class="text-center mb-2">
              <div class="spinner-border text-primary mb-2" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <div class="text-muted mb-2">Are you sure you want to sign out?</div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" 
                     style="width: 100%">
                </div>
              </div>
            </div>
          `,
        showCancelButton: true,
        confirmButtonText: 'Yes, Sign Out',
        cancelButtonText: 'Cancel',
        allowOutsideClick: false,
        customClass: {
          popup: 'shadow-lg',
          confirmButton: 'btn btn-primary px-4 me-2',
          cancelButton: 'btn btn-outline-secondary px-4',
        },
        buttonsStyling: false,
      });

      if (confirmResult.isConfirmed) {
        // Show loading state
        const loadingModal = Swal.fire({
          title: '<span class="fw-bold text-primary">Signing Out... 🔄</span>',
          html: `
              <div class="text-center mb-2">
                <div class="spinner-border text-primary mb-2" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <div class="text-muted mb-2">Clearing your session data...</div>
                <div class="progress" style="height: 6px;">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" 
                       role="progressbar" 
                       style="width: 15%">
                  </div>
                </div>
              </div>
            `,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: async (modal) => {
            try {
              // Store current time as last login
              localStorage.setItem('lastLoginTime', new Date().toISOString());

              // Update progress - 30%
              modal.querySelector('.progress-bar').style.width = '30%';
              modal.querySelector('.text-muted').textContent =
                'Disconnecting from VITAR services...';
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Perform logout API call with error handling
              try {
                const response = await fetch('/api/auth/logout', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: Cookies.get('email'),
                    workerId: Cookies.get('workerId'),
                  }),
                  credentials: 'include',
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.message || 'Logout failed');
                }
              } catch (apiError) {
                console.error('API Error:', apiError);
                // Continue with client-side logout even if API fails
              }

              // Update progress - 60%
              modal.querySelector('.progress-bar').style.width = '60%';
              modal.querySelector('.text-muted').textContent = 'Revoking access tokens...';
              await new Promise((resolve) => setTimeout(resolve, 800));

              // Clear cookies with proper options
              const cookiesToClear = ['customToken', 'uid', 'email', 'workerId', 'LAST_ACTIVITY'];

              cookiesToClear.forEach((cookie) => {
                Cookies.remove(cookie, {
                  path: '/',
                  domain: window.location.hostname,
                  secure: window.location.protocol === 'https:',
                  sameSite: 'Lax',
                });
              });

              // Clear local storage items
              localStorage.removeItem('welcomeShown');
              localStorage.removeItem('companyLogo');
              localStorage.removeItem('lastLoginTime');

              // Update progress - 90%
              modal.querySelector('.progress-bar').style.width = '90%';
              modal.querySelector('.text-muted').textContent = 'Finalizing sign out...';
              await new Promise((resolve) => setTimeout(resolve, 700));

              // Show success state
              modal.querySelector('.swal2-title').innerHTML =
                '<span class="fw-bold text-success">Successfully Signed Out! 🎉</span>';
              modal.querySelector('.swal2-html-container').innerHTML = `
                  <div class="text-center">
                    <div class="checkmark-circle mb-2">
                      <div class="checkmark draw"></div>
                    </div>
                    <div class="text-muted mb-2">You have been successfully signed out</div>
                    <div class="progress mb-2" style="height: 6px;">
                      <div class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                    </div>
                    <div class="countdown-text text-muted small mb-2">
                      Redirecting in <span class="fw-bold text-primary">3</span> seconds...
                    </div>
                  </div>
                `;

              // Countdown and redirect
              let countdown = 3;
              const countdownElement = modal.querySelector('.countdown-text .fw-bold');
              const countdownInterval = setInterval(() => {
                countdown--;
                if (countdownElement) {
                  countdownElement.textContent = countdown;
                }
                if (countdown <= 0) {
                  clearInterval(countdownInterval);
                  window.location.href = '/sign-in';
                }
              }, 1000);
            } catch (error) {
              console.error('Error during sign out process:', error);

              // Show error state but continue with redirect
              modal.querySelector('.swal2-title').innerHTML =
                '<span class="fw-bold text-warning">Sign Out Completed with Warnings</span>';
              modal.querySelector('.swal2-html-container').innerHTML = `
                  <div class="text-center">
                    <div class="text-muted mb-2">Sign out completed with some warnings</div>
                    <div class="text-muted small mb-2">You will be redirected to the login page...</div>
                    <div class="progress mb-2" style="height: 6px;">
                      <div class="progress-bar bg-warning" role="progressbar" style="width: 100%"></div>
                    </div>
                  </div>
                `;

              // Redirect after a short delay
              setTimeout(() => {
                window.location.href = '/sign-in';
              }, 2000);
            }
          },
        });
      }
    } catch (error) {
      console.error('Error in sign out process:', error);

      Swal.fire({
        icon: 'error',
        iconColor: '#1e40a6',
        title: '<span class="fw-bold text-danger">Sign Out Error</span>',
        text: 'An unexpected error occurred. Please try again or refresh the page.',
        showConfirmButton: true,
        confirmButtonText: 'Try Again',
        customClass: {
          popup: 'shadow-lg',
          confirmButton: 'btn btn-primary px-4',
        },
        buttonsStyling: false,
      });
    }
  };

  return (
    <div className='px-5 py-3 d-flex justify-content-between border boder-bottom'>
      {/* <Image src={logo} alt='Company Logo' style={{ height: '80px', width: 'auto' }} /> */}
      <div className='pe-3 d-flex align-items-center'>
        <TodayDate />
      </div>

      <div className='d-flex gap-2 align-items-center'>
        <div className='d-flex flex-column'>
          {user && (
            <>
              <h4 className='mb-0'>{user?.firstName || ''}</h4>
              <span className='text-muted'>ID: {user?.workerId || ''}</span>
            </>
          )}
        </div>

        <NotificationMenu />

        <Dropdown className='ms-2'>
          <Dropdown.Toggle
            as='a'
            className='rounded-circle d-inline-flex'
            style={{ width: '45px', height: '45px' }}
          >
            <UserAvatar userDetails={user} />
          </Dropdown.Toggle>

          <Dropdown.Menu
            className='dashboard-dropdown dropdown-menu-end mt-4'
            align='end'
            aria-labelledby='dropdownUser'
          >
            <Dropdown.Item as={Link} href='#'>
              <Person size={16} className='me-2' /> Profile
            </Dropdown.Item>
            <Dropdown.Item as={Link} href='#'>
              <Gear size={16} className='me-2' /> Settings
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleSignOut}>
              <BoxArrowRight size={16} className='me-2' /> Sign Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
};

const UserAvatar = memo(
  ({ userDetails }) => {
    return (
      <div
        className='position-relative'
        style={{
          width: '45px',
          height: '45px',
          display: 'inline-block',
          marginRight: '80px',
        }}
      >
        {userDetails?.profilePicture ? (
          <div
            style={{
              width: '45px',
              height: '45px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              alt='avatar'
              src={userDetails.profilePicture}
              className='rounded-circle'
              width={45}
              height={45}
              style={{
                objectFit: 'cover',
                border: '3px solid #e5e9f2',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              priority // Add priority to load image faster
            />
            <div
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '15px',
                height: '15px',
                backgroundColor: '#00d27a',
                borderRadius: '50%',
                border: '2px solid #fff',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: '45px',
              height: '45px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              alt='default avatar'
              src='/images/avatar/NoProfile.png'
              className='rounded-circle'
              width={45}
              height={45}
              style={{
                objectFit: 'cover',
                border: '3px solid #e5e9f2',
                backgroundColor: '#f8f9fa',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              priority // Add priority to load image faster
            />
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.userDetails?.profilePicture === nextProps.userDetails?.profilePicture &&
      prevProps.userDetails?.fullName === nextProps.userDetails?.fullName
    );
  }
);

export default UserLayoutHeader;
