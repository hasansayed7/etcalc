import React, { useEffect } from 'react';

const notificationStyle = {
  position: 'fixed',
  top: '80px',
  right: '32px',
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
  transition: 'all 0.3s ease-in-out',
  border: '1.5px solid #90caf9',
  transform: 'translateY(0)',
  animation: 'slideIn 0.3s ease-out',
};

const errorStyle = {
  ...notificationStyle,
  background: 'rgba(211, 47, 47, 0.13)',
  color: '#c62828',
  border: '1.5px solid #ef9a9a',
};

const keyframes = `
@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`;

export default function Notification({ message, onClose, type = 'info' }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const style = type === 'error' ? errorStyle : notificationStyle;
  const icon = type === 'error' ? '❌' : 'ℹ️';

  return (
    <>
      <style>{keyframes}</style>
      <div style={style}>
        <span style={{fontSize: '1.3em', marginRight: 8}}>{icon}</span>
        {message}
      </div>
    </>
  );
} 