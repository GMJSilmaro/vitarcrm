import DataTablePagination from '@/components/common/DataTablePagination';
import DataTableSearch from '@/components/common/DataTableSearch';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { NOTIFICATION_ICON_MAP } from '@/constant/notification';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { formatRelative, subDays } from 'date-fns';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import _ from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Dropdown, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import {
  HouseDoorFill,
  ThreeDotsVertical,
  Trash,
  Bell,
  Check,
  CheckAll,
  Envelope,
  EnvelopeExclamation,
  EnvelopeCheck,
  ExclamationTriangleFill,
  Grid,
} from 'react-bootstrap-icons';

const NotificationList = () => {
  const auth = useAuth();
  const router = useRouter();
  const { workerId } = router.query;

  const columnHelper = createColumnHelper();

  const [notifications, setNotifications] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });

  const [loadingNotificationId, setLoadingNotificationId] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { markAsRead, markAsUnread, markAsAllRead, markAsAllUnread, remove } = useNotifications();

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

  const isReadAll = useMemo(() => {
    return notifications.data.every((notification) => notification.isReadBy.includes(auth.uid));
  }, [notifications.data, auth]);

  const readNotifications = useMemo(() => {
    return notifications.data.filter((notification) => notification.isReadBy.includes(auth.uid))
      .length;
  }, [notifications.data, auth]);

  const unreadNotifications = useMemo(() => {
    return notifications.data.filter((notification) => !notification.isReadBy.includes(auth.uid))
      .length;
  }, [notifications.data, auth]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor((row) => row, {
        id: 'notification',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('module', {
        filterFn: 'equalsString',
      }),
      columnHelper.accessor('title', {}),
      columnHelper.accessor('message', {}),
      columnHelper.accessor(
        (row) => {
          return row.isReadBy.includes(auth.uid);
        },
        {
          id: 'isRead',
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);
            return value === filterValue;
          },
        }
      ),
    ];
  }, [auth.role, auth.uid]);

  const table = useReactTable({
    data: notifications.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const activeIsReadFilter = useMemo(() => {
    if (!table) return;
    return table.getState().columnFilters?.find((filter) => filter.id === 'isRead')?.value;
  }, [table, JSON.stringify(table?.getState().columnFilters)]);

  const handleSetIsReadFilterByKey = useCallback(
    (key) => {
      if (!table) return;

      const isReadColumn = table.getColumn('isRead');

      if (!isReadColumn) return;

      switch (key) {
        case 'all':
          isReadColumn.setFilterValue(undefined);
          break;
        case 'read':
          isReadColumn.setFilterValue(true);
          break;
        case 'unread':
          isReadColumn.setFilterValue(false);
          break;
        default:
          isReadColumn.setFilterValue(undefined);
      }
    },
    [table]
  );

  const activeModuleFilter = useMemo(() => {
    if (!table) return;

    const value = table.getState().columnFilters?.find((filter) => filter.id === 'module')?.value;

    if (!value) return { title: 'All Modules', value: '' };
    else return { title: _.startCase(value), value };
  }, [table, JSON.stringify(table?.getState().columnFilters)]);

  const handleSetModileFilter = useCallback(
    (value) => {
      if (!table) return;

      const moduleColumn = table.getColumn('module');

      if (!moduleColumn) return;

      moduleColumn.setFilterValue(value);
    },
    [table]
  );

  const notificationCountsByModule = useMemo(() => {
    if (!notifications.data) return {};

    const countsByModule = notifications.data.reduce((acc, notification) => {
      const moduleValue = notification.module;
      acc[moduleValue] = (acc[moduleValue] ?? 0) + 1;
      acc.total = (acc.total ?? 0) + 1;
      return acc;
    }, {});

    return countsByModule;
  }, [notifications.data]);

  //* query notifications
  useEffect(() => {
    if (!auth) return;

    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const myNotifications = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((notif) => !notif.isDeletedBy.includes(auth.uid))
            .filter(
              (notif) =>
                notif.target.includes(auth.uid) ||
                notif.target.includes(auth.role) ||
                notif.target.includes('all')
            );

          setNotifications({
            data: myNotifications,
            isLoading: false,
            isError: false,
          });
        } else {
          setNotifications({ data: [], isLoading: false, isError: false });
        }
      },
      (err) => {
        console.error(err.message);
        setNotifications({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return (
    <>
      <GeeksSEO title='Nofitications - VITAR Group | Portal' />

      <ContentHeader
        title='Nofication List'
        description='Stay updated with your latest notifications'
        badgeText='Notifications Management'
        badgeText2='Alerts'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },

          {
            text: 'Notifications',
            link: '/notifications',
            icon: <Bell className='me-2' size={14} />,
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between pb-3 w-100 border border-start-0 border-end-0 border-top-0'>
            <DataTableSearch table={table} />

            <div className='d-flex gap-2'>
              <Dropdown drop='down-centered'>
                <Dropdown.Toggle variant='light'>
                  <Grid size={20} className='text-primary me-2' />
                  <span className='me-2'>{activeModuleFilter.title}</span>

                  {activeModuleFilter.value !== '' && (
                    <Badge pill>{notificationCountsByModule[activeModuleFilter.value]}</Badge>
                  )}

                  {activeModuleFilter.value === '' && (
                    <Badge pill>{notificationCountsByModule?.total}</Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    className='d-flex justify-content-between align-items-center gap-3'
                    onClick={() => handleSetModileFilter('')}
                    active={activeModuleFilter.value === ''}
                  >
                    <span className='me-2'>All Modules</span>
                    {notificationCountsByModule?.total > 0 && (
                      <Badge pill>{notificationCountsByModule?.total}</Badge>
                    )}
                  </Dropdown.Item>

                  {Object.keys(NOTIFICATION_ICON_MAP)
                    .filter((key) => key !== 'default')
                    .map((key) => (
                      <Dropdown.Item
                        className='d-flex justify-content-between align-items-center gap-3'
                        onClick={() => handleSetModileFilter(key)}
                        key={key}
                        active={activeModuleFilter.value === key}
                      >
                        <span className='me-2'>{_.startCase(key)}</span>

                        {notificationCountsByModule?.[key] > 0 && (
                          <Badge pill>{notificationCountsByModule?.[key]}</Badge>
                        )}
                      </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
              </Dropdown>

              <Button
                className={activeIsReadFilter === undefined ? 'border border-primary' : ''}
                variant='light'
                onClick={() => handleSetIsReadFilterByKey('all')}
                disabled={notifications.isLoading}
              >
                <Envelope size={20} className='text-primary me-2' />
                <span className='me-2'>All Notifications</span>
                {notifications.data.length > 0 && <Badge pill>{notifications.data.length}</Badge>}
              </Button>

              <Button
                className={activeIsReadFilter === true ? 'border border-primary' : ''}
                variant='light'
                onClick={() => handleSetIsReadFilterByKey('read')}
                disabled={notifications.isLoading}
              >
                <EnvelopeCheck size={20} className='text-primary me-2' />
                <span className='me-2'>Read</span>
                {readNotifications > 0 && <Badge pill>{readNotifications}</Badge>}
              </Button>

              <Button
                className={activeIsReadFilter === false ? 'border border-primary' : ''}
                variant='light'
                onClick={() => handleSetIsReadFilterByKey('unread')}
                disabled={notifications.isLoading}
              >
                <EnvelopeExclamation size={20} className='text-primary me-2' />
                <span className='me-2'>Unread</span>
                {unreadNotifications > 0 && <Badge pill>{unreadNotifications}</Badge>}
              </Button>

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
                    Mark all as {isReadAll ? 'UnRead' : 'Read'}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className='d-flex flex-column'>
            {!notifications.isLoading && notifications.isError && (
              <div
                className='d-flex flex-column justify-content-center align-items-center gap-2'
                style={{ height: 300 }}
              >
                <ExclamationTriangleFill className='me-2 text-danger' size={60} />
                <span>Error Fetching Notifications</span>
              </div>
            )}

            {notifications.isLoading && !notifications.isError && (
              <div
                className='d-flex justify-content-center align-items-center'
                style={{ height: 300 }}
              >
                <Spinner className='me-2' animation='border' size='sm' /> Loading...
              </div>
            )}

            {table.getRowModel().rows &&
              table.getRowModel().rows.length === 0 &&
              !notifications.isLoading && (
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

            {table.getRowModel().rows &&
              table.getRowModel().rows.length > 0 &&
              !notifications.isLoading &&
              !notifications.isError &&
              table.getRowModel().rows.map(({ original: notification }, i) => {
                const Icon = NOTIFICATION_ICON_MAP?.[notification.module] || NOTIFICATION_ICON_MAP['default']; //prettier-ignore

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
                      onClick={() => handleMarkAsRead(notification.id)}
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

            <DataTablePagination table={table} />
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default NotificationList;
