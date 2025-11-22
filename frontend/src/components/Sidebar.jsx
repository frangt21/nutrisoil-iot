import React, { useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { getProfile } from '../services/api';
import './Sidebar.css';

function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const profile = await getProfile();
        if (profile && profile.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    };
    checkAdmin();
  }, []);

  return (
    <div className="sidebar-container bg-dark">
      <div className="sidebar-header">
        <h3 className="text-success">🌱 NutriSoil IoT</h3>
      </div>
      <Nav className="flex-column">
        {isAdmin ? (
          <>
            <div className="sidebar-heading px-3 mt-2 mb-1 text-muted small">ADMINISTRACIÓN</div>
            <LinkContainer to="/admin/users">
              <Nav.Link className="text-warning">Gestión Usuarios</Nav.Link>
            </LinkContainer>
            <div className="sidebar-divider my-2 mx-3 border-top border-secondary"></div>
            <LinkContainer to="/perfil">
              <Nav.Link>Mi Perfil</Nav.Link>
            </LinkContainer>
          </>
        ) : (
          <>
            <LinkContainer to="/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/predios">
              <Nav.Link>Mis Predios</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/reportes">
              <Nav.Link>Reportes</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/perfil">
              <Nav.Link>Mi Perfil</Nav.Link>
            </LinkContainer>
          </>
        )}
      </Nav>
    </div>
  );
}

export default Sidebar;