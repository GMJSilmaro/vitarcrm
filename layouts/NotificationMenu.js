import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Dropdown, OverlayTrigger, Popover } from 'react-bootstrap';
import Notifications from './Notifications';
import { Bell } from 'react-bootstrap-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { auth, db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

const NotificationMenu = () => {
  const auth = useAuth();
  const [show, setShow] = useState(false);

  //TODO: cater redirect for techncian rotue and for non technician e.g admin, create a map based on role or just append /user/[uid] if technician
  const [notifications, setNotifications] = useState({
    data: [],
    isLoading: false,
    isError: false,
  });

  const unreadNotifications = useMemo(() => {
    return notifications.data.filter((notification) => !notification.isReadBy.includes(auth.uid))
      .length;
  }, [notifications.data, auth]);

  // //* query notifications
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
  }, [auth.uid, auth.role]);

  return (
    <OverlayTrigger
      onToggle={() => setShow((prev) => !prev)}
      show={show}
      rootClose
      trigger='click'
      placement='left'
      offset={[38, 405]}
      overlay={
        <Popover id='notification-dropdown' style={{ zIndex: 200 }}>
          <Notifications notifications={notifications} setShow={setShow} />
        </Popover>
      }
    >
      <div
        className='position-relative'
        style={{ cursor: 'pointer' }}
        onClick={() => setShow(true)}
      >
        <Bell size={34} />

        {unreadNotifications > 0 && (
          <Badge
            pill
            className='position-absolute'
            bg='danger'
            style={{ fontSize: 11.5, top: -4, right: -8 }}
          >
            {unreadNotifications}
          </Badge>
        )}
      </div>
    </OverlayTrigger>
  );
};

export default NotificationMenu;
