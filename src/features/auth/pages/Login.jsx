import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../config/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import "./Login.css";
import pataImg from "../../../assets/images/pata_password.png"; // Confirma se o caminho está certo

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
      // 1. Autenticação
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Buscar os dados do utilizador
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        
        // Normalizar dados
        let role = (userData.role || '').toLowerCase();
        let type = (userData.type || '').toLowerCase();
        const clinicId = userData.clinicId;

        // --- NOVA LÓGICA INTELIGENTE ---
        // Se o user (Manel) não tiver 'type' definido, mas tiver um chefe (clinicId),
        // vamos espreitar o perfil da empresa para saber se é um Centro de Adoção.
        if (!type && clinicId) {
            try {
                const clinicDocRef = doc(db, "users", clinicId);
                const clinicSnap = await getDoc(clinicDocRef);
                
                if (clinicSnap.exists()) {
                    const clinicData = clinicSnap.data();
                    if (clinicData.type) {
                        type = clinicData.type.toLowerCase();
                        console.log("Tipo herdado da empresa:", type);
                    }
                }
            } catch (err) {
                console.error("Erro ao verificar empresa:", err);
            }
        }

        console.log("Login -> Role:", role, "| Type:", type);

        // 3. Redirecionamento Correto
        if (type === 'centro de adoção' || type === 'centro de adocao') {
          // Se for Centro (seja Admin ou Funcionário herdado), vai para aqui:
          navigate('/home-centro'); 
        } 
        else if (role === 'admin_empresa') {
          navigate('/home-clinica');
        }
        else if (role === 'vet' || role === 'funcionario' || role === 'rececionista') {
          // Se for clínica normal
          navigate('/home-clinica');
        }
        else if (role === 'admin') {
          navigate('/admin-dashboard');
        } 
        else {
          navigate('/home');
        }

      } else {
        setError("Erro: Perfil de utilizador não encontrado.");
      }

    } catch (err) {
      console.error("Erro no login:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
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