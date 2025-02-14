import { v4 as uuid } from 'uuid';
import {
  HouseDoorFill,
  PeopleFill,
  BriefcaseFill,
  CalendarWeekFill,
  PersonFill,
  PersonBadgeFill,
  PersonLinesFill,
  ListTask,
} from 'react-bootstrap-icons';

const NavbarDefault = [
  {
    id: uuid(),
    menuitem: 'Dashboard',
    link: '/dashboard',
    icon: 'HouseDoorFill',
    children: [
      { id: uuid(), menuitem: 'Overview', link: '/dashboard', icon: 'HouseDoorFill' },
      {
        id: uuid(),
        menuitem: 'Certificate Editor',
        icon: 'FileEarmarkBarGraphFill',
        link: '/reports',
      },
    ],
    isAuthenticated: true,
  },
  {
    id: uuid(),
    menuitem: 'Customer Management',
    link: '/dashboard/master',
    icon: 'PersonFill',
    hasSubmenu: true,
    children: [
      {
        id: uuid(),
        header: true,
        header_text: 'CRM Management Menu',
      },
      {
        id: uuid(),
        menuitem: 'Customers',
        icon: 'PersonFill',
        link: '/customers',
        hasSubmenu: false,
      },
      {
        id: uuid(),
        menuitem: 'Sites',
        link: '/sites',
        icon: 'BuildingFill',
        hasSubmenu: true,
      },
    ],
  },
  {
    id: uuid(),
    menuitem: 'Vitar-Segatec',
    icon: 'GearFill',
    children: [
      {
        id: uuid(),
        header: true,
        header_text: 'Vitar-Segatec Management Menu',
      },
      {
        id: uuid(),
        menuitem: 'Technicians',
        link: '#',
        icon: 'PersonLinesFill',
        hasSubmenu: true,
        children: [
          {
            id: uuid(),
            menuitem: 'Technicians List',
            link: '/workers',
            icon: 'PersonLinesFill',
          },
          {
            id: uuid(),
            menuitem: 'Schedule',
            link: '/schedule',
            icon: 'CalendarWeekFill',
          },
        ],
      },
      {
        id: uuid(),
        menuitem: 'Calendar',
        link: '/jobs/calendar',
        icon: 'CalendarWeekFill',
      },
      {
        id: uuid(),
        menuitem: 'Jobs',
        link: '/jobs',
        icon: 'BriefcaseFill',
      },
      {
        id: uuid(),
        menuitem: 'Equipments',
        icon: 'ThermometerHigh',
        hasSubmenu: true,
        children: [
          {
            id: uuid(),
            header: true,
            header_text: 'Calibration Menu',
          },
          {
            id: uuid(),
            menuitem: 'Temperature & Humidity',
            link: '/dashboard/calibration/temperature & humidity',
            icon: 'Thermometer',
          },
          {
            id: uuid(),
            menuitem: 'Pressure',
            link: '/dashboard/calibration/pressure',
            icon: 'Speedometer',
          },
          {
            id: uuid(),
            menuitem: 'Electrical',
            link: '/dashboard/calibration/electrical',
            icon: 'Lightning',
          },
          {
            id: uuid(),
            menuitem: 'Dimensional',
            link: '/dashboard/calibration/dimensional',
            icon: 'Rulers',
          },
          {
            id: uuid(),
            menuitem: 'Volumetric',
            link: '/dashboard/calibration/volumetric',
            icon: 'Droplet',
          },
          {
            id: uuid(),
            menuitem: 'Mechanical',
            link: '/dashboard/calibration/mechanical',
            icon: 'Gear',
          },
        ],
      },
    ],
  },
];

//console.log('NavbarDefault:', JSON.stringify(NavbarDefault, null, 2));

export default NavbarDefault;
