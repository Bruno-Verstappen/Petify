import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page-wrapper">
      <h1 className="auth-welcome-text">Welcome</h1>
      
      <div className="auth-content-center">
        <div className="auth-buttons-group">
          <button className="btn-auth-main" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn-auth-main" onClick={() => navigate('/RegisterFuncionario1')}>
            Register
          </button>
        </div>
        
        <p className="business-link" onClick={() => navigate('/RegisterEmpresa1')}>
          Do you have a business?
        </p>
      </div>

      <h2 className="auth-petify-logo">Petify</h2>
    </div>
  );
};

export default AuthPage;