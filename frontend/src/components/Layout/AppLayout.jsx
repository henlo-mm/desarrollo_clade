import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';

const AppLayout = ({ children }) => {
  const navigate = useNavigate();

  const start = (
    <Link to="/" style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
        <i className="pi pi-th-large" style={{ fontSize: '1.4rem', color: '#818cf8' }}></i>
        <span style={{ fontWeight: 700, fontSize: '1.15rem', color: '#e2e8f0', letterSpacing: '-0.02em' }}>
          Dev<span style={{ color: '#818cf8' }}>Manager</span>
        </span>
      </div>
    </Link>
  );

  const end = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <i className="pi pi-home" style={{ color: '#64748b', fontSize: '0.9rem' }}></i>
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Proyectos</span>
      </div>
      <span style={{ color: '#334155', fontSize: '0.8rem' }}>
        {new Date().toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <Menubar
        model={[]}
        start={start}
        end={end}
        style={{
          borderRadius: 0,
          border: 'none',
          borderBottom: '1px solid #1e293b',
          padding: '0.75rem 2rem',
          background: '#1e293b',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      />
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
