import React from 'react';
import '../../../AuthPage.css'; // Certifique-se que o caminho está correto

const AuthPage = () => {
  return (
    <div className="auth-wrapper">
      <h1 className="welcome-text">Welcome</h1>
      
      <div className="button-group">
        <button className="btn-auth">Login</button>
        <button className="btn-auth">Register</button>
        <a href="#" className="business-link">Do you have a business?</a>
      </div>

      <h2 className="petify-logo">Petify</h2>
    </div>
  );
};

export default AuthPage;