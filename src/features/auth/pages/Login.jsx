import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail } from "../../../services/authService";
import "./Login.css"; 
import pataImg from "../../../assets/images/pata_password.png"; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="login-page-wrapper">
      <div className="top-right-link" onClick={() => navigate('/register')}>
        Don't have an account?
      </div>

      <h1 className="login-welcome-text">Login</h1>
      
      <div className="login-content-center">
        <form onSubmit={handleLogin} className="login-form">
          {error && <p className="login-error">{error}</p>}
          
          <div className="login-input-group">
            <label>Email</label>
            <input 
              type="email" 
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="login-input-group">
            <label>Password</label>
            <div className="login-password-container">
              <input 
                type={showPassword ? "text" : "password"} 
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <img 
                src={pataImg} 
                alt="Ver senha" 
                className="pata-icon-large"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>

          <button type="submit" className="btn-enter">Enter</button>
        </form>
      </div>

      <h2 className="login-petify-logo">Petify</h2>
    </div>
  );
};

export default Login;