// src/layouts/MainLayout.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Container } from 'react-bootstrap';

function MainLayout({ children }) {
  return (
    <div className="d-flex">
      <Sidebar />
      {/* Añadimos la clase 'content-wrapper' a este div */}
      <div className="content-wrapper flex-grow-1"> 
        <Header />
        <Container fluid className="p-4 main-content">
          {children}
        </Container>
      </div>
    </div>
  );
}

export default MainLayout;