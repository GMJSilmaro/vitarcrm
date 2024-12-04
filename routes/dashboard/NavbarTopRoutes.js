import { v4 as uuid } from 'uuid';
import { HouseDoorFill, PeopleFill, BriefcaseFill, CalendarWeekFill, PersonFill, PersonBadgeFill, PersonLinesFill, ListTask } from 'react-bootstrap-icons';

const NavbarDefault = [
	{
		id: uuid(),
		menuitem: 'Dashboard',
		link: '#',
		icon: 'HouseDoorFill',
		children: [
			{ id: uuid(), menuitem: 'Overview', link: '/dashboard'},
		],
		isAuthenticated: true,
	},
	// {
	// 	id: uuid(),
	// 	menuitem: 'Manage Customer',
	// 	link: '#',
	// 	icon: 'PeopleFill',
	// 	children: [
	// 		{
	// 			id: uuid(),
	// 			header: true,
	// 			header_text: 'Customer Menu'
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'Customers',
	// 			link: '/customers',
	// 			icon: 'PersonFill'
	// 		},
	// 		// {
	// 		// 	id: uuid(),
	// 		// 	menuitem: 'Service Locations',
				
	// 		// 	link: '/dashboard/locations/list',
	// 		// 	icon: 'GeoAltFill'
	// 		// },
	// 	],
	// 	isAuthenticated: true,
	// },
	// // {
	// 	id: uuid(),
	// 	menuitem: 'Manage Sites',
	// 	link: '#',
	// 	icon: 'BuildingFill',
	// 	children: [
	// 		{
	// 			id: uuid(),
	// 			header: true,
	// 			header_text: 'Sites Menu'
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'Sites',
	// 			link: '/sites',
	// 			icon: 'BuildingFill'
	// 		},
		
	// 	],
	// 	isAuthenticated: true,
	// },
	// {
	// 	id: uuid(),
	// 	menuitem: 'Manage Equipments',
	// 	link: '#',
	// 	icon: 'GearFill',
	// 	children: [
	// 		{
	// 			id: uuid(),
	// 			header: true,
	// 			header_text: 'Equipments Menu'
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'Calibration Equipments',
	// 			link: '/inventory',
	// 			icon: 'ThermometerFill'
	// 		},
	// 	],
	// 	isAuthenticated: true,
	// },
	{
		id: uuid(),
		menuitem: 'Master Data Management',
		link: '#',
		badge: 'Work In Progress',
		icon: 'GearFill',
		children: [
			{
				id: uuid(),
				menuitem: 'Customers',
				link: '#',
				icon: 'PersonFill',
				children: [
					{
						id: uuid(),
						menuitem: 'All Customers',
						link: '/dashboard/customers/list'
					},
					{
						id: uuid(),
						menuitem: 'Create Customers',
						link: '/dashboard/customers/create'
					}
				]
			},
			{
				id: uuid(),
				menuitem: 'Sites',
				link: '#',
				icon: 'BuildingFill',
				children: [
					{
						id: uuid(),
						menuitem: 'All Sites',
						link: '/dashboard/locations/list'
					},
					{
						id: uuid(),
						menuitem: 'Create Sites',
						link: '/dashboard/locations/create'
					}
				]
			},
			{
				id: uuid(),
				menuitem: 'Calibration',
				link: '#',
				icon: 'ThermometerHigh',	
				children: [
					{
						id: uuid(),
						menuitem: 'Temperature & Humidity',
						link: '/dashboard/calibration/temperature'
					},
					{
						id: uuid(),
						menuitem: 'Pressure',
						link: '/dashboard/calibration/pressure'
					},
					{
						id: uuid(),
						menuitem: 'Electrical',
						link: '/dashboard/calibration/electrical'
					},
					{
						id: uuid(),
						menuitem: 'Dimensional',
						link: '/dashboard/calibration/dimensional'
					},
					{
						id: uuid(),
						menuitem: 'Volumetric',
						link: '/dashboard/calibration/volumetric'
					},
					{
						id: uuid(),
						menuitem: 'Mechanical',
						link: '/dashboard/calibration/mechanical'
					},
				]
			}
		]
	},
	{
		id: uuid(),
		menuitem: 'Manage Workers',
		link: '#',
		icon: 'PeopleFill',
		
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Workers Menu'
			},
			{
				id: uuid(),
				menuitem: 'Workers',
				link: '/workers',
				icon: 'PersonLinesFill'
			},
			// {
			// 	id: uuid(),
			// 	menuitem: 'Workers Dispatch',
			// 	link: '/schedule',
			// 	icon: 'CalendarWeekFill'
			// },

		],
		isAuthenticated: true,
	},
	// {
	// 	id: uuid(),
	// 	menuitem: 'Manage Jobs',
	// 	link: '#',
	// 	icon: 'BriefcaseFill',
	// 	children: [
	// 		{
	// 			id: uuid(),
	// 			header: true,
	// 			header_text: 'Jobs Menu'
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'Jobs',
	// 			link: '/jobs',
	// 			icon: 'ListTask'
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'Jobs Calendar',
	// 			link: '/jobs/calendar',
	// 			icon: 'CalendarWeekFill'
	// 		},
	// 	],
	// 	isAuthenticated: true,
	// },
];

//console.log('NavbarDefault:', JSON.stringify(NavbarDefault, null, 2));

export default NavbarDefault;
