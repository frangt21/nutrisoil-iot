// src/components/Header.jsx
import React from 'react';
import { Navbar, Container, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

function Header() {
    const { user, profile, signOut } = useAuth();
    
    // Usar el nombre y apellido del perfil si está disponible, si no, usar el email
    const userName = profile?.nombre
        ? `${profile.nombre} ${profile.apellido || ''}`.trim()
        : user?.email?.split('@')[0] || 'Usuario';

    const handleSignOut = async () => {
        try {
            await signOut();
            // La redirección ahora se maneja en el componente que lo llama o en App.js
            // Pero para asegurar, podemos forzar una recarga o redirección si es necesario.
            // window.location.href = '/'; // O usar useNavigate
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <Navbar className="main-header" expand="lg">
            <Container fluid>
                <Navbar.Collapse className="justify-content-end">
                    <NavDropdown title={userName} id="user-nav-dropdown">
                        <NavDropdown.Item href="/perfil">Mi Perfil</NavDropdown.Item>
                        <NavDropdown.Divider />
                        <NavDropdown.Item onClick={handleSignOut}>Cerrar Sesión</NavDropdown.Item>
                    </NavDropdown>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;