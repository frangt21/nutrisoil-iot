// src/components/Header.jsx
import React from 'react';
import { Navbar, Container, NavDropdown } from 'react-bootstrap';

function Header() {
    // Datos del usuario (esto vendría de un context o estado global en una app real)
    const user = { name: 'Nicolás Meneses' };

    return (
        <Navbar className="main-header" expand="lg">
            <Container fluid>
                <Navbar.Collapse className="justify-content-end">
                    <NavDropdown title={user.name} id="user-nav-dropdown">
                        <NavDropdown.Item href="/perfil">Mi Perfil</NavDropdown.Item>
                        <NavDropdown.Divider />
                        <NavDropdown.Item href="/">Cerrar Sesión</NavDropdown.Item>
                    </NavDropdown>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;