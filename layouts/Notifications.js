import { NOTIFICATION_ICON_MAP } from '@/constant/notification';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelative } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, Dropdown, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import {
  Bell,
  Check,
  CheckAll,
  ExclamationTriangleFill,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';

//* notification property
//*  id: String
//*  icon: String
//*  target: String[] // "all", any roles, any user's uid
//*  title: String
//*  message: String
//*  data?: Record<String, any> // (additional Metadata) e.g. { redirectUrl: String }
//*  isReadBy: String[] // values can be user uid
//*  isDeletedBy: String[] // values can be user uid
//*  createdAt: ServerTimestamp

const Notifications = ({ notifications, setShow }) => {
  const auth = useAuth();
  const router = useRouter();
  const { workerId } = router.query;

  const [loadingNotificationId, setLoadingNotificationId] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { markAsRead, markAsUnread, markAsAllRead, markAsAllUnread, remove } = useNotifications();

  const isReadAll = useMemo(() => {
    return notifications.data.every((notification) => notification.isReadBy.includes(auth.uid));
  }, [notifications.data, auth]);

  const handleMarkAsRead = async (id) => {
    setLoadingNotificationId(id);
    await markAsRead(id);
    setLoadingNotificationId(null);
  };

  const handleMarkAsUnread = async (id) => {
    setLoadingNotificationId(id);
    await markAsUnread(id);
    setLoadingNotificationId(null);
  };

  const handleRemove = async (id) => {
    setLoadingNotificationId(id);
    await remove(id);
    setLoadingNotificationId(null);
  };

  const handleMarkAsAllRead = async () => {
    setIsLoading(true);
    await markAsAllRead(notifications.data.map((notification) => notification.id));
    setIsLoading(false);
  };

  const handleMarkAsAllUnread = async () => {
    setIsLoading(true);
    await markAsAllUnread(notifications.data.map((notification) => notification.id));
    setIsLoading(false);
  };

  return (
    <div className='notification'>
      {!notifications.isLoading && notifications.isError && (
        <div
          className='d-flex flex-column justify-content-center align-items-center gap-2'
          style={{ height: 300 }}
        >
          <ExclamationTriangleFill className='me-2 text-danger' size={60} />
          <span>Error Fetching Notifications</span>
        </div>
      )}

      {notifications.isLoading && !notifications.isError ? (
        <div className='d-flex justify-content-center align-items-center' style={{ height: 300 }}>
          <Spinner className='me-2' animation='border' size='sm' /> Loading...
        </div>
      ) : (
        <>
          <div className='d-flex justify-content-between align-items-end p-3 w-100 border border-start-0 border-end-0 border-top-0'>
            <h1 className='fs-4 fw-bold'>Notifications</h1>

            <Button
              variant='light'
              className='p-2 d-flex align-items-center'
              disabled={notifications.data.length === 0}
              onClick={isReadAll ? handleMarkAsAllUnread : handleMarkAsAllRead}
            >
              {isLoading ? (
                <>
                  <Spinner animation='border' size='sm' className='me-2' /> Loading...
                </>
              ) : (
                <>
                  <CheckAll size={20} className='text-primary me-2' />
                  Mark all as {isReadAll ? 'unread' : 'read'}
                </>
              )}
            </Button>
          </div>

          <div className='d-flex flex-column'>
            {!notifications.isLoading &&
              !notifications.isError &&
              notifications.data.length === 0 && (
                <div
                  className='d-flex flex-column justify-content-center align-items-center'
                  style={{ height: 300 }}
                >
                  <div className='position-relative mb-3' style={{ cursor: 'pointer' }}>
                    <Bell size={34} className='me-3' />

                    <Badge
                      pill
                      className='position-absolute'
                      bg='secondary'
                      style={{ fontSize: 11.5, top: -4, right: 8 }}
                    >
                      0
                    </Badge>
                  </div>
                  <h1 className='fs-5 fw-bold mb-0'>No Notifications yet</h1>
                  <p className='text-muted mb-0'>You have no notifications right now.</p>
                  <p className='text-muted mb-0'>Come back later.</p>
                </div>
              )}

            {notifications.data.length > 0 &&
              notifications.data.slice(0, 5).map((notification) => {
                const Icon = NOTIFICATION_ICON_MAP?.[notification.icon] || NOTIFICATION_ICON_MAP['default']; //prettier-ignore

                const Comp = notification?.data?.redirectUrl ? Link : 'div';
                const hrefPrefix = auth.role === 'technician' && workerId ? `/user/${workerId}` : ''; //prettier-ignore
                const isRead =  notification.isReadBy.includes(auth.uid) //prettier-ignore

                return (
                  <div
                    className='d-flex align-items-center p-3 gap-3 notification-item'
                    key={notification.id}
                  >
                    <div
                      className='d-flex justify-content-center align-items-center'
                      style={{ width: '10%' }}
                    >
                      <div
                        className='flex-shrink-0 d-flex justify-content-center align-items-center rounded-circle border bg-secondary-soft'
                        style={{ width: 40, height: 40 }}
                      >
                        <Icon size={20} className='text-primary' />
                      </div>
                    </div>

                    <Comp
                      className='flex-grow-1 d-flex flex-column'
                      href={`${hrefPrefix}${notification?.data?.redirectUrl}`}
                      style={{ width: '75%' }}
                      onClick={() => {
                        handleMarkAsRead(notification.id);
                        setShow(false);
                      }}
                    >
                      <OverlayTrigger
                        delay={{ show: 800 }}
                        overlay={<Tooltip>{notification.title}</Tooltip>}
                      >
                        <h1 className='fs-5 fw-semibo ld text-start mb-0 text-truncate'>
                          {notification.title}
                        </h1>
                      </OverlayTrigger>

                      <OverlayTrigger
                        delay={{ show: 800 }}
                        overlay={<Tooltip>{notification.message}</Tooltip>}
                      >
                        <small
                          className='text-muted text-start fs-6'
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {notification.message}
                        </small>
                      </OverlayTrigger>

                      <small className='fw-semibold font-bold text-capitalize fs-6 text-primary'>
                        {notification.createdAt
                          ? formatRelative(notification.createdAt.toDate(), new Date())
                          : ''}
                      </small>
                    </Comp>

                    <div
                      className={`flex-shrink-0 rounded-circle ${
                        isRead ? 'bg-transparent' : 'bg-primary'
                      }`}
                      style={{ width: 8, height: 8 }}
                    />

                    <div
                      style={{ width: '10%' }}
                      className='d-flex justify-content-center align-items-center'
                    >
                      <Dropdown drop='start' className=''>
                        <Dropdown.Toggle
                          as={Button}
                          variant='light'
                          className='px-2 custom-dropdown'
                          size='sm'
                          style={{ height: 'fit-content' }}
                        >
                          {loadingNotificationId === notification.id ? (
                            <Spinner animation='border' size='sm' />
                          ) : (
                            <ThreeDotsVertical size={16} />
                          )}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={async () => {
                              await (isRead
                                ? handleMarkAsUnread(notification.id)
                                : handleMarkAsRead(notification.id));
                            }}
                          >
                            <Check size={18} className='me-2' />
                            Mark as {isRead ? 'Unread' : 'Read'}
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleRemove(notification.id)}>
                            <Trash size={16} className='me-2' />
                            Delete Notification
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                );
              })}

            {notifications.data.length > 0 && (
              <div className='d-flex justify-center align-items-center py-3'>
                <Button
                  onClick={() => {
                    setShow(false);

                    if (auth.role === 'technician' && workerId) {
                      router.push(`/user/${workerId}/notifications`);
                      return;
                    }

                    router.push('/notifications');
                  }}
                  variant='link'
                  className='mx-auto p-0'
                  style={{ width: 'fit-content' }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
