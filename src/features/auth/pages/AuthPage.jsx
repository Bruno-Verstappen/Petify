import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importa o hook de navegação
import '../../../AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate(); // Inicializa o navegador

  return (
    <div className="auth-wrapper">
      <h1 className="welcome-text">Welcome</h1>
      
      <div className="button-group">
        {/* Adiciona o evento onClick para mudar a rota */}
        <button 
          className="btn-auth" 
          onClick={() => navigate('/login')}
        >
          Login
        </button>
        
        <button 
          className="btn-auth" 
          onClick={() => navigate('/register')}
        >
          Register
        </button>
        
        <a href="#" className="business-link">Do you have a business?</a>
      </div>

      <h2 className="petify-logo">Petify</h2>
    </div>
  );
};

export default AuthPage;