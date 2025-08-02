import { v4 as uuid } from 'uuid';

export const getNavbarItems = (role) => {
  if (!role) return [];

  const roleBaseMenu = {
    admin: [
      {
        id: uuid(),
        menuitem: 'Dashboard',
        link: '/dashboard',
        icon: 'HouseDoorFill',
        children: [
          { id: uuid(), menuitem: 'Overview', link: '/dashboard', icon: 'HouseDoorFill' },
          // {
          //   id: uuid(),
          //   menuitem: 'Certificate Editor',
          //   icon: 'FileEarmarkBarGraphFill',
          //   link: '/reports',
          // },
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
            menuitem: 'Job Request',
            link: '/job-requests',
            icon: 'EnvelopePaperFill',
          },
          {
            id: uuid(),
            menuitem: 'Jobs',
            link: '/jobs',
            icon: 'BriefcaseFill',
          },
          {
            id: uuid(),
            menuitem: 'Job CN',
            link: '/job-cns',
            icon: 'ChatDotsFill',
          },
          {
            id: uuid(),
            menuitem: 'Reference Equipment',
            icon: 'Tools',
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
                link: '/reference-equipment/temperature & humidity',
                icon: 'Thermometer',
              },
              {
                id: uuid(),
                menuitem: 'Pressure',
                link: '/reference-equipment/pressure',
                icon: 'Speedometer',
              },
              {
                id: uuid(),
                menuitem: 'Electrical',
                link: '/reference-equipment/electrical',
                icon: 'Lightning',
              },
              {
                id: uuid(),
                menuitem: 'Dimensional',
                link: '/reference-equipment/dimensional',
                icon: 'Rulers',
              },
              {
                id: uuid(),
                menuitem: 'Volumetric',
                link: '/reference-equipment/volumetric',
                icon: 'Droplet',
              },
              {
                id: uuid(),
                menuitem: 'Mass',
                link: '/reference-equipment/mass',
                icon: 'BoxSeam',
              },
            ],
          },
          {
            id: uuid(),
            menuitem: 'Calibration Data',
            link: '/#',
            icon: 'ListColumns',
            children: [
              {
                id: uuid(),
                menuitem: 'Mass',
                link: '/#',
                icon: 'BoxSeam',
                children: [
                  {
                    id: uuid(),
                    menuitem: 'Correction, Uncertainty of the Standard Weight & Drift',
                    link: '/calibration-references/mass/cuswd',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'MPE',
                    link: '/calibration-references/mass/mpe',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'CK',
                    link: '/calibration-references/mass/ck',
                    icon: 'Table',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    supervisor: [
      {
        id: uuid(),
        menuitem: 'Dashboard',
        link: '/dashboard',
        icon: 'HouseDoorFill',
        children: [
          { id: uuid(), menuitem: 'Overview', link: '/dashboard', icon: 'HouseDoorFill' },
          // {
          //   id: uuid(),
          //   menuitem: 'Certificate Editor',
          //   icon: 'FileEarmarkBarGraphFill',
          //   link: '/reports',
          // },
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
            menuitem: 'Job Request',
            link: '/job-requests',
            icon: 'EnvelopePaperFill',
          },
          {
            id: uuid(),
            menuitem: 'Jobs',
            link: '/jobs',
            icon: 'BriefcaseFill',
          },
          {
            id: uuid(),
            menuitem: 'Job CN',
            link: '/jobs-cns',
            icon: 'ChatDotsFill',
          },
          {
            id: uuid(),
            menuitem: 'Reference Equipment',
            icon: 'Tools',
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
                link: '/reference-equipment/temperature & humidity',
                icon: 'Thermometer',
              },
              {
                id: uuid(),
                menuitem: 'Pressure',
                link: '/reference-equipment/pressure',
                icon: 'Speedometer',
              },
              {
                id: uuid(),
                menuitem: 'Electrical',
                link: '/reference-equipment/electrical',
                icon: 'Lightning',
              },
              {
                id: uuid(),
                menuitem: 'Dimensional',
                link: '/reference-equipment/dimensional',
                icon: 'Rulers',
              },
              {
                id: uuid(),
                menuitem: 'Volumetric',
                link: '/reference-equipment/volumetric',
                icon: 'Droplet',
              },
              {
                id: uuid(),
                menuitem: 'Mass',
                link: '/reference-equipment/mass',
                icon: 'BoxSeam',
              },
            ],
          },
          {
            id: uuid(),
            menuitem: 'Calibration Data',
            link: '/#',
            icon: 'ListColumns',
            children: [
              {
                id: uuid(),
                menuitem: 'Mass',
                link: '/#',
                icon: 'BoxSeam',
                children: [
                  {
                    id: uuid(),
                    menuitem: 'Correction, Uncertainty of the Standard Weight & Drift',
                    link: '/calibration-references/mass/cuswd',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'MPE',
                    link: '/calibration-references/mass/mpe',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'CK',
                    link: '/calibration-references/mass/ck',
                    icon: 'Table',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    sales: [
      {
        id: uuid(),
        menuitem: 'Dashboard',
        link: '/dashboard',
        icon: 'HouseDoorFill',
        children: [{ id: uuid(), menuitem: 'Overview', link: '/dashboard', icon: 'HouseDoorFill' }],
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
            menuitem: 'Job Request',
            link: '/job-requests',
            icon: 'EnvelopePaperFill',
          },
          {
            id: uuid(),
            menuitem: 'Jobs',
            link: '/jobs',
            icon: 'BriefcaseFill',
          },
        ],
      },
    ],
  };

  return roleBaseMenu?.[role] || [];
};
