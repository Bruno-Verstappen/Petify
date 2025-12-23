import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container-central">
      <h1 className="welcome-title">Welcome</h1>
      
      <div className="auth-buttons-group">
        <button className="btn-main" onClick={() => navigate('/login')}>Sign In</button>
        <button className="btn-main" onClick={() => navigate('/register')}>Register</button>
      </div>

      <h2 className="petify-footer-logo">Petify</h2>
    </div>
  );
};

export default AuthPage;