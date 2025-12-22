import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail } from "../../../services/authService";
import "../../../shared/components/Login.css"; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard'); 
    } catch (err) {
      setError("Email ou senha incorretos.");
    }
  };

  return (
    <div className="auth-wrapper">
      <h1 className="welcome-text">Login</h1>
      
      <div className="login-form-container">
        <form onSubmit={handleLogin} className="auth-form">
          {error && <p className="error-text">{error}</p>}
          
          <input 
            type="email" 
            placeholder="Email" 
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          
          <input 
            type="password" 
            placeholder="Password" 
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />

          <div className="button-group" style={{marginTop: '20px'}}>
            <button type="submit" className="btn-auth">Sign In</button>
            <button 
              type="button" 
              className="btn-back-link" 
              onClick={() => navigate('/auth')}
            >
              Go back
            </button>
          </div>
        </form>
      </div>

      <h2 className="petify-logo">Petify</h2>
    </div>
  );
};

export default Login;