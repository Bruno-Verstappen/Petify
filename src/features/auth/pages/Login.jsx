import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../config/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import "./Login.css";
import pataImg from "../../../assets/images/pata_password.png";

// --- IMPORTANTE: Confirma se este caminho está correto para as tuas pastas ---
import AnimacaoAnimais from "../../../shared/components/AnimacaoAnimais";
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        let role = (userData.role || '').toLowerCase();
        let type = (userData.type || '').toLowerCase();
        const clinicId = userData.clinicId;

        if (!type && clinicId) {
            try {
                const clinicDocRef = doc(db, "users", clinicId);
                const clinicSnap = await getDoc(clinicDocRef);
                if (clinicSnap.exists()) {
                    const clinicData = clinicSnap.data();
                    if (clinicData.type) type = clinicData.type.toLowerCase();
                }
            } catch (err) { console.error(err); }
        }

        if (type.includes('centro')) navigate('/home-centro'); 
        else if (role === 'admin_empresa') navigate('/home-clinica');
        else if (['vet','funcionario','rececionista'].includes(role)) navigate('/home-clinica');
        else if (role === 'admin') navigate('/admin-dashboard');
        else navigate('/home');

      } else {
        setError("Erro: Perfil de utilizador não encontrado.");
      }

    } catch (err) {
      console.error("Erro no login:", err);
      setError('Erro ao entrar. Verifica os dados.');
    }
  };

  return (
    // position: relative no container pai é obrigatório
    <div className="biz-reg-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      
      <div className="biz-top-link" onClick={() => navigate('/RegisterFuncionario1')}>
        Don't have an account? Register
      </div>

      <div className="biz-main-content" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5 }}>
        <form className="biz-registration-form" onSubmit={handleLogin}>
          <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>Sign In</h1>
          
          {error && <p style={{ color: '#ff4d4d', textAlign: 'center', background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '5px' }}>{error}</p>}
          
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

      {/* FOOTER - Fica visualmente atrás da animação */}
      <footer className="biz-footer-responsive" style={{ zIndex: 1 }}>
        <div className="footer-side-column">
           <button type="button" className="biz-btn-nav" onClick={() => navigate('/auth')}>
            Back
          </button>
        </div>
        <h2 className="biz-footer-logo">Petify</h2>
        <div className="footer-side-column"></div>
      </footer>

      {/* --- ANIMAÇÃO FLUTUANTE --- */}
      <div style={{ 
          position: 'absolute',  // Flutua
          bottom: 0,             // Cola ao fundo
          left: 0, 
          width: '100%', 
          height: '150px',       // Altura da área de animação
          overflow: 'hidden',    
          zIndex: 999,           // VALOR ALTO: Garante que fica à frente de tudo!
          pointerEvents: 'none'  // Permite clicar nos botões do footer através da animação
      }}>
        <AnimacaoAnimais />
      </div>

    </div>
  );
};

export default Login;