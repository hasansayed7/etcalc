import React, { useState } from 'react';
import bgCloud from '../assets/bg_cloud.png';
import logoLightPng from '../assets/et_light.png';

// SVG icons for better rendering
const UserIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{display:'block'}}><circle cx="12" cy="8" r="4" fill="#1976d2"/><path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" fill="#90caf9"/></svg>
);
const LockIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{display:'block'}}><rect x="6" y="10" width="12" height="8" rx="2" fill="#90caf9"/><path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="#1976d2" strokeWidth="2"/><circle cx="12" cy="15" r="1.5" fill="#1976d2"/></svg>
);
const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="7" ry="4" fill="#90caf9"/><circle cx="12" cy="12" r="2" fill="#1976d2"/></svg>
) : (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="7" ry="4" fill="#b0b8c1"/><path d="M4 4l16 16" stroke="#1976d2" strokeWidth="2"/></svg>
);

const fontStack = `'Inter', 'Roboto', 'Segoe UI', Arial, sans-serif`;

const styles = {
  global: {
    fontFamily: fontStack,
    fontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    WebkitFontSmoothing: 'antialiased',
    background: `url(${bgCloud}) center center/cover no-repeat fixed`,
    minHeight: '100vh',
  },
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(6px)',
    zIndex: 1,
  },
  card: {
    fontFamily: fontStack,
    background: 'rgba(255,255,255,0.92)',
    padding: '48px 32px 36px 32px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(30,136,229,0.10)',
    minWidth: '340px',
    maxWidth: '95vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
    position: 'relative',
    border: '1.5px solid #e3eaf3',
    backdropFilter: 'blur(8px)',
  },
  logo: {
    width: 210,
    height: 44,
    objectFit: 'contain',
    marginBottom: '36px',
    marginTop: '-10px',
    filter: 'drop-shadow(0 2px 8px rgba(30,136,229,0.10))',
  },
  inputWrapper: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    background: '#f7f9fc',
    borderRadius: '8px',
    border: '1.5px solid #b0b8c1',
    margin: '14px 0',
    padding: '0 10px',
    boxSizing: 'border-box',
    transition: 'border 0.2s',
  },
  inputWrapperFocus: {
    border: '1.5px solid #1976d2',
    boxShadow: '0 2px 8px rgba(30,136,229,0.10)',
  },
  inputIcon: {
    marginRight: '8px',
    display: 'flex',
    alignItems: 'center',
    minWidth: '24px',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '1.08rem',
    fontFamily: fontStack,
    color: '#222',
    padding: '12px 0',
    fontWeight: 500,
  },
  showPassword: {
    background: 'none',
    border: 'none',
    color: '#1976d2',
    fontSize: '1.1rem',
    cursor: 'pointer',
    outline: 'none',
    marginLeft: '8px',
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(90deg, #1e88e5 0%, #42a5f5 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.13rem',
    fontWeight: 700,
    marginTop: '28px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(30,136,229,0.10)',
    transition: 'background 0.2s, box-shadow 0.2s',
    letterSpacing: '0.01em',
  },
  buttonHover: {
    background: 'linear-gradient(90deg, #1565c0 0%, #1e88e5 100%)',
    boxShadow: '0 4px 16px rgba(30,136,229,0.18)',
  },
  error: {
    color: '#f44336',
    marginTop: '18px',
    fontSize: '1.08rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(244,67,54,0.08)',
    borderRadius: '6px',
    padding: '10px 14px',
    fontWeight: 500,
  },
  forgot: {
    marginTop: '18px',
    color: '#1976d2',
    fontSize: '1.01rem',
    textDecoration: 'underline',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    opacity: 0.8,
    fontWeight: 500,
  },
};

export default function Login({ onLogin }) {
  // Apply global font
  React.useEffect(() => {
    document.body.style.fontFamily = fontStack;
    document.body.style.background = styles.global.background;
    document.body.style.minHeight = styles.global.minHeight;
    document.body.style.WebkitFontSmoothing = 'antialiased';
    document.body.style.MozOsxFontSmoothing = 'grayscale';
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState('');
  const [buttonHover, setButtonHover] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'etadmin' && password === '123456') {
      setError('');
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <form style={styles.card} onSubmit={handleSubmit}>
        <img src={logoLightPng} alt="ExcelyTech Logo" style={styles.logo} />
        {/* Username input with icon */}
        <div
          style={{
            ...styles.inputWrapper,
            ...(focusField === 'username' ? styles.inputWrapperFocus : {}),
          }}
        >
          <span style={styles.inputIcon}><UserIcon /></span>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onFocus={() => setFocusField('username')}
            onBlur={() => setFocusField('')}
            autoFocus
          />
        </div>
        {/* Password input with icon and show/hide */}
        <div
          style={{
            ...styles.inputWrapper,
            ...(focusField === 'password' ? styles.inputWrapperFocus : {}),
          }}
        >
          <span style={styles.inputIcon}><LockIcon /></span>
          <input
            style={styles.input}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocusField('password')}
            onBlur={() => setFocusField('')}
          />
          <button
            type="button"
            style={styles.showPassword}
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {/* Error message */}
        {error && (
          <div style={styles.error}>
            <span>❗</span> {error}
          </div>
        )}
        <button
          style={{
            ...styles.button,
            ...(buttonHover ? styles.buttonHover : {}),
          }}
          type="submit"
          onMouseOver={() => setButtonHover(true)}
          onMouseOut={() => setButtonHover(false)}
        >
          Login
        </button>
        <div
          style={styles.forgot}
          tabIndex={0}
          role="button"
          onClick={() => alert('Please contact your administrator to reset your password.')}
        >
          Forgot password?
        </div>
      </form>
    </div>
  );
} 