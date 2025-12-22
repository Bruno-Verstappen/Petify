import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../AuthPage.css'; // Vamos separar o CSS para melhor organização

const AuthPage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-wrapper">
      <div className="auth-content">
        <h1 className="welcome-title">Welcome</h1>
        
        <div className="button-container">
          <button onClick={() => navigate('/login')} className="btn-main">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="btn-main">
            Register
          </button>
        </div>

        <h2 className="brand-footer">Petify</h2>
      </div>
    </div>
  );
};

export default AuthPage;