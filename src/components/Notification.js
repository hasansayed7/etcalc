import React, { useEffect } from 'react';

const notificationStyle = {
  position: 'fixed',
  top: '32px',
  left: '32px',
  zIndex: 9999,
  minWidth: '280px',
  maxWidth: '90vw',
  background: 'rgba(30, 136, 229, 0.13)',
  color: '#1565c0',
  padding: '18px 32px',
  borderRadius: '10px',
  boxShadow: '0 4px 24px rgba(30,136,229,0.12)',
  fontWeight: 600,
  fontSize: '1.08rem',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  opacity: 1,
  transition: 'opacity 0.4s',
  border: '1.5px solid #90caf9',
};

export default function Notification({ message, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div style={notificationStyle}>
      <span style={{fontSize: '1.3em', marginRight: 8}}>ℹ️</span>
      {message}
    </div>
  );
} 