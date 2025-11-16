import React from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap'; // integrar React Router con react-bootstrap
import './Sidebar.css'; // este archivo para estilos

function Sidebar() {
  return (
    <div className="sidebar-container bg-dark">
      <div className="sidebar-header">
        <h3 className="text-success">🌱 NutriSoil IoT</h3>
      </div>
      <Nav className="flex-column">
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
      </Nav>
    </div>
  );
}

export default Sidebar;