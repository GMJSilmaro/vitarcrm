// imports.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Container, Row, Col, Button, Card, Badge, Dropdown } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Swal from 'sweetalert2';
import Cookies from 'js-cookie';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { FaBell, FaPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { memo } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import WhatsNew from '@/components/dashboard/WhatsNew/index';
import { RouteGuard } from '@/components/RouteGuard';
import DefaultDashboardLayout from '@/layouts/dashboard/DashboardIndexTop';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Constants
const TIME_FILTERS = ['Today', 'This Week', 'This Month', 'This Year'];
const CHART_COLORS = {
  completed: '#28A745', // Success green
  pending: '#FFC107', // Warning yellow
  emergency: '#1e40a6', // Vitar red
  maintenance: '#17A2B8', // Info blue
  installation: '#FFB800', // Installation yellow
  repair: '#0D6EFD', // Repair blue
  other: '#6C757D', // Gray for other/unknown types
  default: '#6C757D', // Default gray color
};

const FilterButtons = memo(({ currentFilter, onFilterChange }) => {
  return (
    <div className='d-flex gap-2'>
      {TIME_FILTERS.map((filter) => (
        <Button
          key={filter}
          onClick={() => onFilterChange(filter)}
          variant={currentFilter === filter ? 'light' : 'outline-light'}
          className='filter-button'
          style={{
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
          }}
        >
          {filter}
        </Button>
      ))}
    </div>
  );
});

// Optionally add a display name for debugging purposes
FilterButtons.displayName = 'FilterButtons';

// LoadingOverlay Component
const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div className='spinner-border text-primary' role='status'>
        <span className='visually-hidden'>Loading...</span>
      </div>
    </div>
  );
};

// Helper Functions
const getDateRange = (period) => {
  // Create dates in local timezone
  const now = new Date();
  const start = new Date();
  const end = new Date();

  // Reset hours for consistent comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case 'Today':
      // No additional modification needed - already set for today
      break;
    case 'This Week':
      // Get Monday of current week
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
      break;
    case 'This Month':
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      break;
    case 'This Year':
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    default:
      // Default to today
      break;
  }

  return { start, end };
};

const useFirebaseCache = () => {
  const cache = useRef(new Map());
  const lastFetch = useRef(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchWithCache = useCallback(async (key, fetchFn) => {
    const now = Date.now();
    const cached = cache.current.get(key);

    if (cached && now - lastFetch.current < CACHE_DURATION) {
      console.log('Using cached data for:', key);
      return cached;
    }

    console.log('Fetching fresh data for:', key);
    const data = await fetchFn();
    cache.current.set(key, data);
    lastFetch.current = now;
    return data;
  }, []);

  return { fetchWithCache };
};

// Add this helper function after the constants
const generateDummyData = () => {
  // Generate random jobs for the last 30 days
  let jobs = [];
  const jobTypes = ['Installation', 'Maintenance', 'Repair', 'Emergency', 'Other'];
  const jobStatuses = ['Created', 'In Progress', 'Completed', 'Job Complete'];
  const now = new Date();

  // const JOB_STATUSES = [
  //   'Job Confirm',
  //   'Job In',
  //   'Job Validation',
  //   'Job Cancel',
  //   'Job Complete',
  //   'Job Reschedule',
  // ];

  // const CALIBRATION_CATEGORIES = [
  //   'Temperature Humidity',
  //   'Pressure',
  //   'Electrical',
  //   'Dimensional',
  //   'Volumetric',
  //   'Mass',
  // ]

  // for (let i = 0; i < 150; i++) {
  //   const daysAgo = Math.floor(Math.random() * 30);
  //   const hoursAgo = Math.floor(Math.random() * 24);
  //   const date = new Date(now);
  //   date.setDate(date.getDate() - daysAgo);
  //   date.setHours(date.getHours() - hoursAgo);

  //   jobs.push({
  //     id: `job-${i}`,
  //     jobContactType: jobTypes[Math.floor(Math.random() * jobTypes.length)],
  //     jobStatus: jobStatuses[Math.floor(Math.random() * jobStatuses.length)],
  //     createdAt: date,
  //     assignedWorkers: Array(Math.floor(Math.random() * 3) + 1)
  //       .fill(null)
  //       .map((_, index) => ({
  //         id: `worker-${index}`,
  //         name: `Technician ${index + 1}`,
  //       })),
  //   });
  // }

  jobs = [
    {
      id: 'job-0',
      jobContactType: 'Emergency',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-09T19:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-1',
      jobContactType: 'Repair',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-19T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-2',
      jobContactType: 'Installation',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-24T03:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-3',
      jobContactType: 'Maintenance',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-30T03:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-4',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-09T04:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-5',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-13T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-6',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-17T14:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-7',
      jobContactType: 'Repair',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-11T02:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-8',
      jobContactType: 'Emergency',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-02T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-9',
      jobContactType: 'Repair',
      jobStatus: 'Completed',
      createdAt: new Date('2025-07-04T15:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-10',
      jobContactType: 'Installation',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-20T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-11',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-29T05:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-12',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-09T05:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-13',
      jobContactType: 'Maintenance',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-29T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-14',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-04T03:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-15',
      jobContactType: 'Other',
      jobStatus: 'Completed',
      createdAt: new Date('2025-07-05T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-16',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-15T03:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-17',
      jobContactType: 'Other',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-26T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-18',
      jobContactType: 'Installation',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-17T04:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-19',
      jobContactType: 'Repair',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-18T18:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-20',
      jobContactType: 'Emergency',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-25T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-21',
      jobContactType: 'Emergency',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-02T12:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-22',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-27T20:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-23',
      jobContactType: 'Repair',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-27T05:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-24',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-11T22:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-25',
      jobContactType: 'Installation',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-06T16:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-26',
      jobContactType: 'Installation',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-29T02:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-27',
      jobContactType: 'Repair',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-12T22:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-28',
      jobContactType: 'Other',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-25T16:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-29',
      jobContactType: 'Other',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-30T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-30',
      jobContactType: 'Installation',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-28T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-31',
      jobContactType: 'Emergency',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-16T23:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-32',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-06T08:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-33',
      jobContactType: 'Installation',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-05T23:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-34',
      jobContactType: 'Installation',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-25T15:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-35',
      jobContactType: 'Other',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-05T17:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-36',
      jobContactType: 'Repair',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-05T09:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-37',
      jobContactType: 'Repair',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-26T13:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-38',
      jobContactType: 'Other',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-23T23:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-39',
      jobContactType: 'Emergency',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-06T11:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-40',
      jobContactType: 'Other',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-22T13:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-41',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-03T05:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-42',
      jobContactType: 'Emergency',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-01T04:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-43',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-22T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-44',
      jobContactType: 'Other',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-25T03:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-45',
      jobContactType: 'Maintenance',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-05T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-46',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-29T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-47',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-10T01:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-48',
      jobContactType: 'Installation',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-15T05:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-49',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-09T18:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-50',
      jobContactType: 'Installation',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-18T13:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-51',
      jobContactType: 'Emergency',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-22T00:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-52',
      jobContactType: 'Other',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-04T03:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-53',
      jobContactType: 'Other',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-22T23:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-54',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-09T20:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-55',
      jobContactType: 'Emergency',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-24T16:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-56',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-06T18:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-57',
      jobContactType: 'Installation',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-03T17:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-58',
      jobContactType: 'Emergency',
      jobStatus: 'Completed',
      createdAt: new Date('2025-07-05T09:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-59',
      jobContactType: 'Other',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-04T13:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-60',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-05T17:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-61',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-25T20:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-62',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-15T14:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-63',
      jobContactType: 'Maintenance',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-06T08:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-64',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-16T12:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-65',
      jobContactType: 'Installation',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-28T03:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-66',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-11T11:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-67',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-01T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-68',
      jobContactType: 'Emergency',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-26T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-69',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-05T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-70',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-18T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-71',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-21T02:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-72',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-05T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-73',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-12T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-74',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-03T14:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-75',
      jobContactType: 'Maintenance',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-03T09:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-76',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-01T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-77',
      jobContactType: 'Installation',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-21T03:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-78',
      jobContactType: 'Maintenance',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-14T19:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-79',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-19T16:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-80',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-03T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-81',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-25T02:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-82',
      jobContactType: 'Emergency',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-09T13:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-83',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-04T15:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-84',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-17T19:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-85',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-04T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-86',
      jobContactType: 'Emergency',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-16T18:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-87',
      jobContactType: 'Installation',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-25T09:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-88',
      jobContactType: 'Emergency',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-27T23:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-89',
      jobContactType: 'Emergency',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-16T17:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-90',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-23T18:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-91',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-20T04:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-92',
      jobContactType: 'Maintenance',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-09T12:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-93',
      jobContactType: 'Installation',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-03T14:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-94',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-07T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-95',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-03T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-96',
      jobContactType: 'Maintenance',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-11T12:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-97',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-10T16:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-98',
      jobContactType: 'Repair',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-21T09:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-99',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-23T09:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-100',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-02T11:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-101',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-18T04:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-102',
      jobContactType: 'Installation',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-21T00:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-103',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-14T14:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-104',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-19T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-105',
      jobContactType: 'Installation',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-13T13:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-106',
      jobContactType: 'Other',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-30T11:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-107',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-24T04:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-108',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-20T22:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-109',
      jobContactType: 'Emergency',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-20T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-110',
      jobContactType: 'Maintenance',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-27T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-111',
      jobContactType: 'Repair',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-23T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-112',
      jobContactType: 'Installation',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-02T09:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-113',
      jobContactType: 'Emergency',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-17T17:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-114',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-06T12:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-115',
      jobContactType: 'Repair',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-12T00:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-116',
      jobContactType: 'Emergency',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-24T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-117',
      jobContactType: 'Maintenance',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-22T12:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-118',
      jobContactType: 'Emergency',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-26T22:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-119',
      jobContactType: 'Repair',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-09T02:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-120',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-10T17:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-121',
      jobContactType: 'Maintenance',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-03T01:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-122',
      jobContactType: 'Maintenance',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-08T15:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-123',
      jobContactType: 'Installation',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-14T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-124',
      jobContactType: 'Installation',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-20T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-125',
      jobContactType: 'Installation',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-05T01:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-126',
      jobContactType: 'Emergency',
      jobStatus: 'Completed',
      createdAt: new Date('2025-07-05T02:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-127',
      jobContactType: 'Repair',
      jobStatus: 'Completed',
      createdAt: new Date('2025-07-05T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-128',
      jobContactType: 'Installation',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-26T12:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-129',
      jobContactType: 'Maintenance',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-13T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-130',
      jobContactType: 'Other',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-01T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-131',
      jobContactType: 'Installation',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-17T14:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-132',
      jobContactType: 'Installation',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-05T14:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-133',
      jobContactType: 'Emergency',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-29T23:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-134',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-03T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-135',
      jobContactType: 'Repair',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-08T07:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-136',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-11T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-137',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-17T15:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
    {
      id: 'job-138',
      jobContactType: 'Emergency',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-07-04T10:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-139',
      jobContactType: 'Other',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-24T11:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-140',
      jobContactType: 'Maintenance',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-24T22:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-141',
      jobContactType: 'Installation',
      jobStatus: 'Job Complete',
      createdAt: new Date('2025-06-23T13:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-142',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-07-02T20:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-143',
      jobContactType: 'Repair',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-06-13T13:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-144',
      jobContactType: 'Installation',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-21T04:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-145',
      jobContactType: 'Other',
      jobStatus: 'Created',
      createdAt: new Date('2025-06-21T02:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
        {
          id: 'worker-2',
          name: 'Technician 3',
        },
      ],
    },
    {
      id: 'job-146',
      jobContactType: 'Maintenance',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-26T05:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-147',
      jobContactType: 'Other',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-23T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-148',
      jobContactType: 'Emergency',
      jobStatus: 'In Progress',
      createdAt: new Date('2025-07-03T21:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
        {
          id: 'worker-1',
          name: 'Technician 2',
        },
      ],
    },
    {
      id: 'job-149',
      jobContactType: 'Emergency',
      jobStatus: 'Completed',
      createdAt: new Date('2025-06-08T06:35:17.955Z'),
      assignedWorkers: [
        {
          id: 'worker-0',
          name: 'Technician 1',
        },
      ],
    },
  ];

  return jobs;
};

// Main Component
const Overview = () => {
  // Router
  const router = useRouter();

  // State Management
  const [timeFilter, setTimeFilter] = useState('Today');
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [allJobs, setAllJobs] = useState([]);
  const [lastLoginTime, setLastLoginTime] = useState(null);

  // Dashboard Metrics
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [taskGrowth, setTaskGrowth] = useState(0);
  const [activeWorkers, setActiveWorkers] = useState(0);

  // Add cache hook
  const { fetchWithCache } = useFirebaseCache();

  // Add new state for filtered metrics
  const [filteredMetrics, setFilteredMetrics] = useState({
    totalTasks: 0,
    activeWorkers: 0,
    pendingTasks: 0,
    completedTasks: 0,
    taskGrowth: 0,
  });

  // Chart Data
  const [performanceData, setPerformanceData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Completed',
        data: [],
        backgroundColor: CHART_COLORS.completed,
      },
      {
        label: 'Pending/Created',
        data: [],
        backgroundColor: CHART_COLORS.pending,
      },
    ],
  });

  const [taskDistributionData, setTaskDistributionData] = useState({
    labels: [],
    datasets: [
      {
        data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        backgroundColor: [
          '#28A745',
          '#FFC107',
          '#1e40a6',
          '#17A2B8',
          '#FFB800',
          '#0D6EFD',
          '#6C757D',
        ],
      },
    ],
  });

  // Memoized Values
  const chartOptions = useMemo(
    () => ({
      bar: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 12, family: "'Inter', sans-serif" },
              color: '#495057',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              borderDash: [2],
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: { size: 12, family: "'Inter', sans-serif" },
              color: '#495057',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { size: 12, family: "'Inter', sans-serif" },
              usePointStyle: true,
              padding: 20,
              color: '#495057',
            },
          },
          tooltip: {
            backgroundColor: '#1e40a6', // Vitar red for tooltips
            titleFont: { size: 13, family: "'Inter', sans-serif" },
            bodyFont: { size: 12, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
          },
        },
      },
      pie: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 12, family: "'Inter', sans-serif" },
              usePointStyle: true,
              padding: 20,
              color: '#495057',
              generateLabels: (chart) => {
                const { labels, datasets } = chart.data;
                console.log({ datasets });
                return labels.map((label, index) => ({
                  text: `${label} (${datasets[0].data[index]})`,
                  fillStyle: datasets[0].backgroundColor[index],
                  strokeStyle: '#ffffff',
                  lineWidth: 1,
                  hidden: false,
                  index,
                }));
              },
            },
          },
          tooltip: {
            backgroundColor: '#1e40a6', // Vitar red for tooltips
            titleFont: { size: 13, family: "'Inter', sans-serif" },
            bodyFont: { size: 12, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.formattedValue;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.raw / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    }),
    []
  );

  // Enhanced updateDashboardStats function
  const updateDashboardStats = useCallback((filteredJobs, dateRange) => {
    console.log('Starting updateDashboardStats with:', {
      totalJobs: filteredJobs.length,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
    });

    try {
      // Calculate total tasks
      const totalFilteredTasks = filteredJobs.length;
      setTotalTasks(totalFilteredTasks);
      console.log('Total Tasks:', totalFilteredTasks);

      // Calculate active workers
      const uniqueWorkers = new Set(
        filteredJobs.flatMap(
          (job) =>
            job.assignedWorkers
              ?.filter((worker) => job.jobStatus === 'In Progress' || job.jobStatus === 'Created')
              ?.map((worker) => worker.id) || []
        )
      );
      setActiveWorkers(uniqueWorkers.size);
      console.log('Online Technicians:', uniqueWorkers.size);

      // Calculate pending tasks
      const pendingCount = filteredJobs.filter(
        (job) => job.jobStatus === 'Created' || job.jobStatus === 'In Progress'
      ).length;
      setPendingTasks(pendingCount);
      console.log('Pending Tasks:', pendingCount);

      // Calculate completed tasks
      const completedCount = filteredJobs.filter(
        (job) => job.jobStatus === 'Completed' || job.jobStatus === 'Job Complete'
      ).length;
      setCompletedToday(completedCount);
      console.log('Completed Tasks:', completedCount);

      // Calculate active jobs
      const activeCount = filteredJobs.filter((job) => job.jobStatus === 'In Progress').length;
      setActiveJobsCount(activeCount);
      console.log('Active Jobs:', activeCount);

      // Calculate new jobs (created in last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const newCount = filteredJobs.filter(
        (job) => job.jobStatus === 'Created' && job.createdAt >= twentyFourHoursAgo
      ).length;
      setNewJobsCount(newCount);
      console.log('New Jobs:', newCount);

      // Calculate growth rate
      const previousPeriodStart = new Date(dateRange.start);
      const periodDuration = dateRange.end.getTime() - dateRange.start.getTime();
      previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

      const previousJobs = filteredJobs.filter(
        (job) => job.createdAt >= previousPeriodStart && job.createdAt < dateRange.start
      );

      const growth =
        previousJobs.length === 0
          ? filteredJobs.length > 0
            ? 100
            : 0
          : Math.round(((filteredJobs.length - previousJobs.length) / previousJobs.length) * 100);
      setTaskGrowth(growth);
      console.log('Growth Rate:', growth);

      // Update filtered metrics state
      const newMetrics = {
        totalTasks: totalFilteredTasks,
        activeWorkers: uniqueWorkers.size,
        pendingTasks: pendingCount,
        completedTasks: completedCount,
        taskGrowth: growth,
      };
      setFilteredMetrics(newMetrics);
      console.log('Updated Metrics:', newMetrics);
    } catch (error) {
      console.error('Error in updateDashboardStats:', error);
      toast.error('Error updating dashboard statistics');
    }
  }, []);

  // Enhanced updateChartData function
  const updateChartData = useCallback((filteredJobs, period) => {
    console.log('updateChartData called with:', {
      filteredJobsCount: filteredJobs.length,
      period,
    });

    let performanceLabels = [];
    let completedData = [];
    let pendingData = [];
    let inProgressData = [];

    if (period === 'Today') {
      // Hourly data for today
      performanceLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      const hourlyData = Array(24)
        .fill(0)
        .map(() => ({
          completed: 0,
          pending: 0,
          inProgress: 0,
        }));

      filteredJobs.forEach((job) => {
        if (job.createdAt) {
          const hour = new Date(job.createdAt).getHours();
          switch (job.jobStatus) {
            case 'Completed':
            case 'Job Complete':
              hourlyData[hour].completed++;
              break;
            case 'Created':
              hourlyData[hour].pending++;
              break;
            case 'In Progress':
              hourlyData[hour].inProgress++;
              break;
          }
        }
      });

      completedData = hourlyData.map((h) => h.completed);
      pendingData = hourlyData.map((h) => h.pending);
      inProgressData = hourlyData.map((h) => h.inProgress);
    } else if (period === 'This Week') {
      // Daily data for the week
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      performanceLabels = days;
      const dailyData = days.map(() => ({
        completed: 0,
        pending: 0,
        inProgress: 0,
      }));

      filteredJobs.forEach((job) => {
        if (job.createdAt) {
          const dayIndex = new Date(job.createdAt).getDay();
          const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Adjust Sunday from 0 to 6

          switch (job.jobStatus) {
            case 'Completed':
            case 'Job Complete':
              dailyData[adjustedIndex].completed++;
              break;
            case 'Created':
              dailyData[adjustedIndex].pending++;
              break;
            case 'In Progress':
              dailyData[adjustedIndex].inProgress++;
              break;
          }
        }
      });

      completedData = dailyData.map((d) => d.completed);
      pendingData = dailyData.map((d) => d.pending);
      inProgressData = dailyData.map((d) => d.inProgress);
    } else if (period === 'This Month') {
      // Weekly data for the month
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
      performanceLabels = weeks;
      const weeklyData = weeks.map(() => ({
        completed: 0,
        pending: 0,
        inProgress: 0,
      }));

      filteredJobs.forEach((job) => {
        if (job.createdAt) {
          const date = new Date(job.createdAt);
          const weekIndex = Math.floor((date.getDate() - 1) / 7);

          switch (job.jobStatus) {
            case 'Completed':
            case 'Job Complete':
              weeklyData[weekIndex].completed++;
              break;
            case 'Created':
              weeklyData[weekIndex].pending++;
              break;
            case 'In Progress':
              weeklyData[weekIndex].inProgress++;
              break;
          }
        }
      });

      completedData = weeklyData.map((w) => w.completed);
      pendingData = weeklyData.map((w) => w.pending);
      inProgressData = weeklyData.map((w) => w.inProgress);
    } else if (period === 'This Year') {
      // Monthly data for the year
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      performanceLabels = months;
      const monthlyData = months.map(() => ({
        completed: 0,
        pending: 0,
        inProgress: 0,
      }));

      filteredJobs.forEach((job) => {
        if (job.createdAt) {
          const monthIndex = new Date(job.createdAt).getMonth();

          switch (job.jobStatus) {
            case 'Completed':
            case 'Job Complete':
              monthlyData[monthIndex].completed++;
              break;
            case 'Created':
              monthlyData[monthIndex].pending++;
              break;
            case 'In Progress':
              monthlyData[monthIndex].inProgress++;
              break;
          }
        }
      });

      completedData = monthlyData.map((m) => m.completed);
      pendingData = monthlyData.map((m) => m.pending);
      inProgressData = monthlyData.map((m) => m.inProgress);
    }

    // Update performance chart data
    setPerformanceData({
      labels: performanceLabels,
      datasets: [
        {
          label: 'Completed',
          data: completedData,
          backgroundColor: CHART_COLORS.completed,
        },
        {
          label: 'Created',
          data: pendingData,
          backgroundColor: CHART_COLORS.pending,
        },
        {
          label: 'In Progress',
          data: inProgressData,
          backgroundColor: CHART_COLORS.maintenance,
        },
      ],
    });

    // Update task distribution chart
    const jobTypes = filteredJobs.reduce((acc, job) => {
      let typeName = 'Other';

      if (job.jobContactType) {
        if (typeof job.jobContactType === 'string') {
          typeName = job.jobContactType;
        } else if (job.jobContactType.name) {
          typeName = job.jobContactType.name;
        }
      }

      // Normalize the type name
      typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1).toLowerCase();
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {});

    // Sort job types by count
    const sortedTypes = Object.entries(jobTypes)
      .sort(([, a], [, b]) => b - a)
      .reduce(
        (obj, [key, value]) => ({
          ...obj,
          [key]: value,
        }),
        {}
      );

    // Create color map for job types
    const typeColors = Object.keys(sortedTypes).map((type) => {
      const lowerType = type.toLowerCase();
      // If type is "Other" or unknown, use gray
      if (lowerType === 'other' || !CHART_COLORS[lowerType]) {
        return CHART_COLORS.other;
      }
      return CHART_COLORS[lowerType];
    });

    setTaskDistributionData({
      labels: Object.keys(sortedTypes),
      datasets: [
        {
          data: Object.values(sortedTypes),
          backgroundColor: typeColors,
          borderWidth: 1,
          borderColor: '#ffffff',
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
        },
      ],
    });
  }, []);

  // Enhanced filter jobs function with better date handling
  const filterJobsByDateRange = useCallback((jobs, dateRange) => {
    console.log('Filtering jobs with date range:', {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      totalJobs: jobs.length,
    });

    const filteredJobs = jobs.filter((job) => {
      // Skip invalid dates
      if (!job.createdAt || !(job.createdAt instanceof Date)) {
        console.log('Skipping job with invalid date:', job.id);
        return false;
      }

      // Normalize job date to start of day for consistent comparison
      const jobDate = new Date(job.createdAt);

      // Check if job is within range
      const isInRange = jobDate >= dateRange.start && jobDate <= dateRange.end;

      if (!isInRange) {
        // console.log('Job outside range:', {
        //   jobId: job.id,
        //   jobDate: jobDate.toISOString(),
        //   start: dateRange.start.toISOString(),
        //   end: dateRange.end.toISOString(),
        // });
      }

      return isInRange;
    });

    console.log('Filtered jobs result:', {
      totalJobs: jobs.length,
      filteredJobs: filteredJobs.length,
      period: dateRange.start.toLocaleDateString() + ' to ' + dateRange.end.toLocaleDateString(),
    });

    return filteredJobs;
  }, []);

  // Optimize data fetching
  const fetchInitialData = useCallback(async () => {
    try {
      setIsInitialLoading(true);

      // Cache user details fetch
      const currentEmail = Cookies.get('email');
      if (currentEmail) {
        const userData = await fetchWithCache(`user-${currentEmail}`, async () => {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', currentEmail));
          const querySnapshot = await getDocs(q);
          return querySnapshot.empty ? null : querySnapshot.docs[0].data();
        });

        if (userData) {
          setUserDetails(userData);
          if (userData.timestamp) {
            setLastLoginTime(
              new Date(userData.timestamp.seconds * 1000 + userData.timestamp.nanoseconds / 1000000)
            );
          }
        }
      }

      // Generate and use dummy jobs
      const dummyJobs = generateDummyData();
      console.log({ dummyJobs });
      setAllJobs(dummyJobs);

      // Initial calculations with dummy data
      const dateRange = getDateRange('Today');
      const filteredJobs = filterJobsByDateRange(dummyJobs, dateRange);
      updateDashboardStats(filteredJobs, dateRange);
      updateChartData(filteredJobs, 'Today');
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setIsInitialLoading(false);
    }
  }, [filterJobsByDateRange, updateDashboardStats, updateChartData]);

  // Optimize useEffect
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Memoize stats calculation
  const calculateStats = useMemo(
    () => ({
      pendingCount: allJobs.filter(
        (job) => job.jobStatus === 'Created' || job.jobStatus === 'In Progress'
      ).length,
      completedCount: allJobs.filter(
        (job) => job.jobStatus === 'Completed' || job.jobStatus === 'Job Complete'
      ).length,
      activeCount: allJobs.filter((job) => job.jobStatus === 'In Progress').length,
    }),
    [allJobs]
  );

  // Modified handleTimeFilterChange
  const handleTimeFilterChange = useCallback(
    (period) => {
      console.log('Time filter changed to:', period);
      setTimeFilter(period);
      setIsLoading(true);

      try {
        const dateRange = getDateRange(period);
        console.log('Date range:', {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const filteredJobs = filterJobsByDateRange(allJobs, dateRange);
        console.log('Filtered jobs:', filteredJobs.length);

        // State updates will automatically be batched in React 18
        updateDashboardStats(filteredJobs, dateRange);
        updateChartData(filteredJobs, period);
      } catch (error) {
        console.error('Error updating dashboard:', error);
        toast.error('Error updating filter');
      } finally {
        setIsLoading(false);
      }
    },
    [allJobs, filterJobsByDateRange, updateDashboardStats, updateChartData]
  );
  // Navigation handlers
  const handleNewTask = () => router.push('/404');

  // Add state for WhatsNew modal
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const handleWhatsNewClick = () => {
    const stats = [
      {
        value: newJobsCount,
        label: 'New Jobs',
      },
      {
        value: activeJobsCount,
        label: 'Active Jobs',
      },
    ];

    setShowWhatsNew(true);
  };

  return (
    <div className='dashboard-wrapper'>
      <LoadingOverlay isLoading={isLoading || isInitialLoading} />

      <DashboardHeader
        title='CRM & Calibration Dashboard'
        subtitle='Welcome back,'
        userName={userDetails?.fullName}
        onWhatsNewClick={handleWhatsNewClick}
        onCreateClick={handleNewTask}
        FilterComponent={FilterButtons}
        currentFilter={timeFilter}
        onFilterChange={handleTimeFilterChange}
        customStyle='dashboard-header'
      />

      {/* Dashboard Content */}
      <Container>
        {/* Stats Row */}
        <Row className='g-4 mb-4'>
          {/* Total Jobs Card */}
          <Col lg={3} sm={6}>
            <Card>
              <Card.Body>
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    <p className='text-muted mb-1'>Total Jobs ({timeFilter})</p>
                    <h3 className='mb-1'>{totalTasks}</h3>
                    <span className={`text-${taskGrowth >= 0 ? 'success' : 'danger'}`}>
                      <i className={`fas fa-arrow-${taskGrowth >= 0 ? 'up' : 'down'} me-1`}></i>
                      {Math.abs(taskGrowth)}% {taskGrowth >= 0 ? 'increase' : 'decrease'}
                    </span>
                  </div>
                  <div className='stat-icon'>
                    <i className='fas fa-tasks' style={{ color: '#1e40a6' }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Active Workers Card */}
          <Col lg={3} sm={6}>
            <Card>
              <Card.Body>
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    <p className='text-muted mb-1'>Online Technicians ({timeFilter})</p>
                    <h3 className='mb-1'>{activeWorkers}</h3>
                    <Badge bg={activeWorkers > 0 ? 'success' : 'warning'}>
                      {activeWorkers > 0 ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className='stat-icon'>
                    <i className='fas fa-users' style={{ color: '#28A745' }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Pending Jobs Card */}
          <Col lg={3} sm={6}>
            <Card>
              <Card.Body>
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    <p className='text-muted mb-1'>Pending Jobs ({timeFilter})</p>
                    <h3 className='mb-1'>{pendingTasks}</h3>
                    <Badge bg={pendingTasks > 5 ? 'danger' : 'danger'}>
                      {pendingTasks > 5 ? 'Critical' : 'Urgent'}
                    </Badge>
                  </div>
                  <div className='stat-icon'>
                    <i className='fas fa-clock' style={{ color: '#FFC107' }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Completed Jobs Card */}
          <Col lg={3} sm={6}>
            <Card>
              <Card.Body>
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    <p className='text-muted mb-1'>Completed ({timeFilter})</p>
                    <h3 className='mb-1'>{completedToday}</h3>
                    <Badge
                      bg={
                        completedToday >= totalTasks * 0.7
                          ? 'success'
                          : completedToday >= totalTasks * 0.4
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {completedToday >= totalTasks * 0.7
                        ? 'Excellent'
                        : completedToday >= totalTasks * 0.4
                        ? 'On Track'
                        : 'Needs Attention'}
                    </Badge>
                  </div>
                  <div className='stat-icon'>
                    <i className='fas fa-check-circle' style={{ color: '#28A745' }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row className='g-4'>
          <Col lg={8}>
            <Card>
              <Card.Body>
                <h5 className='mb-4'>Performance Overview</h5>
                <div style={{ height: '350px' }}>
                  <Bar data={performanceData} options={chartOptions.bar} />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <Card.Body>
                <h5 className='mb-4'>Field Service Distribution</h5>
                <div style={{ height: '300px' }}>
                  <Pie data={taskDistributionData} options={chartOptions.pie} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <WhatsNew
        show={showWhatsNew}
        onHide={() => setShowWhatsNew(false)}
        userDetails={userDetails}
        lastLoginTime={lastLoginTime}
        stats={[
          {
            value: newJobsCount,
            label: 'New Jobs',
          },
          {
            value: activeJobsCount,
            label: 'Active Jobs',
          },
        ]}
      />
    </div>
  );
};

// Wrap the export with RouteGuard and specify the layout
export default function ProtectedOverview() {
  return (
    <RouteGuard>
      <Overview />
    </RouteGuard>
  );
}

// Add this line to specify the layout
ProtectedOverview.Layout = DefaultDashboardLayout;
