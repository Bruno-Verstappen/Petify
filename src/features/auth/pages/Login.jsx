import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../config/firebase'; // Importa a tua configuração
import { signInWithEmailAndPassword } from 'firebase/auth';
import "./Login.css";
import pataImg from "../../../assets/images/pata_password.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Autenticação real com Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Se o login tiver sucesso, redireciona
      navigate('/home');
    } catch (err) {
      console.error("Erro no login:", err.code);
      // Tratamento de erros básico
      if (err.code === 'auth/invalid-credential') {
        setError('Email ou password incorretos.');
      } else {
        setError('Ocorreu um erro ao entrar. Tenta novamente.');
      }
    }
  };

  return (
    <div className="biz-reg-container">
      <div className="biz-top-link" onClick={() => navigate('/RegisterFuncionario1')}>
        Don't have an account? Register
      </div>

      <div className="biz-main-content">
        <form className="biz-registration-form" onSubmit={handleLogin}>
          <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>Sign In</h1>
          
          {error && <p style={{ color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}
          
          <div className="biz-input-wrapper">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="your email"
              className="biz-input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="biz-input-wrapper">
            <label>Password</label>
            <div className="biz-pata-container">
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="********"
                className="biz-input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <img 
                src={pataImg} 
                className="biz-pata-icon" 
                onClick={() => setShowPass(!showPass)} 
                alt="toggle" 
              />
            </div>
          </div>

          <button type="submit" className="biz-btn-continue" style={{ marginTop: '20px', alignSelf: 'center' }}>
            Login
          </button>
        </form>
      </div>

      <footer className="biz-footer-responsive">
        <div className="footer-side-column">
           <button type="button" className="biz-btn-nav" onClick={() => navigate('/auth')}>
            Back
          </button>
        </div>
        <h2 className="biz-footer-logo">Petify</h2>
        <div className="footer-side-column"></div>
      </footer>
    </div>
  );
};

export default Login;