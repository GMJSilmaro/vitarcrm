/**
 * This layout will be applicable if you want Navigation bar on top side or horizontal style navigation in Dashboard.
 */

// import node module libraries
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Container, Nav, Navbar, Image, NavDropdown, Badge } from 'react-bootstrap';

// import sub components
import QuickMenu from '../QuickMenu';

// import routes file
import { getNavbarItems } from 'routes/dashboard/NavbarTopRoutes';

// import utility function
import { useLogo } from '../../contexts/LogoContext';
import { useAuth } from '@/contexts/AuthContext';

const DashboardIndexTop = (props) => {
  const auth = useAuth();
  const { logo } = useLogo();
  const [expandedMenu, setExpandedMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const navbarItems = useMemo(() => {
    return getNavbarItems(auth.role);
  }, [auth.role]);

  const handleMouseEnter = (itemId) => {
    setActiveDropdown(itemId);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
    setActiveSubmenu(null);
  };

  const handleSubmenuEnter = (itemId) => {
    setActiveSubmenu(itemId);
  };

  const handleSubmenuLeave = () => {
    setActiveSubmenu(null);
  };

  // Add this helper function to render icons
  const renderIcon = (iconName) => {
    const Icons = require('react-bootstrap-icons');
    const IconComponent = Icons[iconName];

    return IconComponent ? <IconComponent size={16} className='me-2' /> : null;
  };

  const renderSubmenuItems = (submenu) => {
    if (submenu.header) {
      return (
        <h4 className='dropdown-header' key={submenu.id}>
          {submenu.header_text}
        </h4>
      );
    }

    if (submenu.children) {
      return (
        <div
          key={submenu.id}
          className='dropdown-item dropdown-submenu position-relative'
          onMouseEnter={() => handleSubmenuEnter(submenu.id)}
          onMouseLeave={handleSubmenuLeave}
          style={{ cursor: 'pointer', paddingBottom: '8px' }}
        >
          <span className='d-flex align-items-center justify-content-between w-100'>
            <span>
              {submenu.icon && renderIcon(submenu.icon)}
              {submenu.menuitem}
            </span>
            <i className='bi bi-chevron-right ms-2'></i>
          </span>
          <div
            className={`dropdown-menu ${activeSubmenu === submenu.id ? 'show' : ''}`}
            style={{
              position: 'absolute',
              top: 0,
              left: '100%',
              marginTop: 0,
              marginLeft: '1px',
              padding: '8px 0',
            }}
          >
            {submenu.children.map(renderSubmenuItems)}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={submenu.id}
        href={submenu.link || '#'}
        className='dropdown-item'
        onClick={() => setExpandedMenu(false)}
        style={{ paddingBottom: '8px' }}
      >
        {submenu.icon && renderIcon(submenu.icon)}
        {submenu.menuitem}
      </Link>
    );
  };

  const renderDropdownItems = (items) => {
    return items.map((item) => {
      if (item.children) {
        return (
          <NavDropdown
            key={item.id}
            title={
              <span>
                {item.icon && renderIcon(item.icon)}
                {item.menuitem}
                {item.badge && (
                  <Badge bg='primary' className='ms-2' style={{ fontSize: '0.8em' }}>
                    {item.badge}
                  </Badge>
                )}
              </span>
            }
            id={`nav-dropdown-${item.id}`}
            show={activeDropdown === item.id}
            onMouseEnter={() => handleMouseEnter(item.id)}
            onMouseLeave={handleMouseLeave}
            className='nav-item'
          >
            {item.children.map(renderSubmenuItems)}
          </NavDropdown>
        );
      }

      return item.link ? (
        <Nav.Link key={item.id} as={Link} href={item.link} className='nav-item'>
          {item.icon && renderIcon(item.icon)}
          {item.menuitem}
        </Nav.Link>
      ) : null;
    });
  };

  return (
    <div>
      {/* Main Navbar */}
      <Navbar bg='white' expand='lg' className='border-bottom py-5'>
        <Container fluid>
          {/* Logo */}
          <Navbar.Brand
            className='d-none mx-md-auto mx-lg-0  mx-auto d-md-block mb-3'
            as={Link}
            href='/'
          >
            <div style={{ height: '70px' }}>
              <Image
                className='img-fluid'
                src={logo}
                alt='Company Logo'
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </Navbar.Brand>

          {/* Search Box - Hidden for now */}
          {/* <div className='ms-lg-3 d-none d-md-none d-lg-block'></div> */}

          {/* Quick Menu */}
          <Nav className='ms-auto d-flex align-items-center'>
            <QuickMenu />
          </Nav>

          {/* Mobile Toggle */}
          <Navbar.Toggle
            aria-controls='navbarScroll'
            className='ms-3'
            onClick={() => setExpandedMenu(!expandedMenu)}
          >
            <span className='navbar-toggler-icon'></span>
          </Navbar.Toggle>
        </Container>
      </Navbar>

      {/* Secondary Navigation */}
      <Navbar expand='lg' className='bg-danger navbar-light bg-white border-bottom'>
        <Container fluid>
          <Navbar.Collapse id='navbarScroll' in={expandedMenu}>
            <Nav>{renderDropdownItems(navbarItems)}</Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content - Using responsive class instead of inline style */}
      <div className='main-content responsive-container'>{props.children}</div>
    </div>
  );
};

export default DashboardIndexTop;
