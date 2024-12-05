import { v4 as uuid } from 'uuid';
import { HouseDoorFill, PeopleFill, BriefcaseFill, CalendarWeekFill, PersonFill, PersonBadgeFill, PersonLinesFill, ListTask } from 'react-bootstrap-icons';

const NavbarDefault = [
	{
		id: uuid(),
		menuitem: 'Dashboard',
		link: '/dashboard',
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
		link: '/dashboard/master',
		badge: 'Work In Progress',
		icon: 'GearFill',
		hasSubmenu: true,
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Master Data Menu'
			},
			{
				id: uuid(),
				menuitem: 'Customers',
				icon: 'PersonFill',
				link: '/dashboard/customers/list'
			},
			{
				id: uuid(),
				menuitem: 'Sites',
				icon: 'BuildingFill',
				link: '/dashboard/locations/list'
			},
			{
				id: uuid(),
				menuitem: 'Calibration',
				icon: 'ThermometerHigh',
				hasSubmenu: true,
				children: [
					{
						id: uuid(),
						header: true,
						header_text: 'Calibration Menu'
					},
					{
						id: uuid(),
						menuitem: 'Temperature & Humidity',
						link: '/dashboard/calibration/temperature',
						icon: 'Thermometer'
					},
					{
						id: uuid(),
						menuitem: 'Pressure',
						link: '/dashboard/calibration/pressure',
						icon: 'Speedometer'
					},
					{
						id: uuid(),
						menuitem: 'Electrical',
						link: '/dashboard/calibration/electrical',
						icon: 'Lightning'
					},
					{
						id: uuid(),
						menuitem: 'Dimensional',
						link: '/dashboard/calibration/dimensional',
						icon: 'Rulers'
					},
					{
						id: uuid(),
						menuitem: 'Volumetric',
						link: '/dashboard/calibration/volumetric',
						icon: 'Droplet'
					},
					{
						id: uuid(),
						menuitem: 'Mechanical',
						link: '/dashboard/calibration/mechanical',
						icon: 'Gear'
					}
				]
			}
		]
	},
	{
		id: uuid(),
		menuitem: 'Manage Workers',
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
			}
		]
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
