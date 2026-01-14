import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "./RegisterEmpresa2.css";

// IMPORTS DO FIREBASE
import { auth, db } from "/src/config/firebase";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 

const RegisterEmpresa2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const step1Data = location.state?.step1 || {};

  const [formData, setFormData] = useState({
    type: 'clinica veterinária',
    clinicEmail: '',
    clinicName: '',
    nif: '',
    phone: '',
    address: ''
  });

  const handleBack = () => {
    navigate('/RegisterEmpresa1', { 
      state: { savedData: step1Data } 
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Validação simples
    if (!step1Data.password) {
      alert("Erro: Password em falta. Volte ao passo 1.");
      return;
    }

    // Preparar dados comuns
    const emailToRegister = formData.clinicEmail || step1Data.email; // Usa o do passo 2 ou fallback para passo 1

    console.log("A iniciar registo separado...");

    try {
      // 2. Criar o Login na Autenticação
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        emailToRegister, 
        step1Data.password
      );
      
      const user = userCredential.user;

      // ---------------------------------------------------------
      // 3. GRAVAR NA TABELA USERS (Apenas dados de Login)
      // ---------------------------------------------------------
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: emailToRegister,
        role: "admin_empresa", // Define que este user gere uma clinica/centro
        createdAt: new Date()
      });

      // ---------------------------------------------------------
      // 4. GRAVAR NA TABELA CLINICS (Dados da Empresa)
      // Usamos o mesmo ID (user.uid) para facilitar a ligação depois
      // ---------------------------------------------------------
      await setDoc(doc(db, "clinics", user.uid), {
        uid: user.uid, // Ligação ao user
        name: formData.clinicName,
        nif: formData.nif,
        phone: formData.phone,
        address: formData.address,
        type: formData.type, // 'clinica veterinária' ou 'centro de adoção'
        email: emailToRegister,
        status: "aceite",
        clinicCode: formData.nif
      });

      alert("Conta criada com sucesso! Dados guardados em 'users' e 'clinics'.");
      navigate('/login'); 

    } catch (error) {
      console.error("Erro no registo:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Este email já está registado.");
      } else {
        alert("Erro: " + error.message);
      }
    }
  };

  return (
    <div className="biz-reg-container">
      <div className="biz-top-link" onClick={() => navigate('/login')}>
        Already have an account ?
      </div>

      <div className="biz-step-header">
        <span className="step-digit active">2</span>
      </div>

      <div className="biz-type-selection-container">
        <label className="biz-radio-option">
          <input 
            type="radio" 
            name="bizType" 
            value="clinica veterinária"
            checked={formData.type === 'clinica veterinária'}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          />
          <span className="biz-custom-dot"></span>
          Clinic
        </label>
        <label className="biz-radio-option">
          <input 
            type="radio" 
            name="bizType" 
            value="centro de adoção"
            checked={formData.type === 'centro de adoção'}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          />
          <span className="biz-custom-dot"></span>
          Adoption Center
        </label>
      </div>

      <div className="biz-main-content">
        <form className="biz-registration-form" id="regForm" onSubmit={handleRegister}>
          
          <div className="biz-input-wrapper">
            <label>{formData.type === 'clinica veterinária' ? 'Clinic Email' : 'Center Email'}</label>
            <input 
              type="email" 
              placeholder="company email"
              className="biz-input-field"
              value={formData.clinicEmail}
              onChange={(e) => setFormData({...formData, clinicEmail: e.target.value})}
              required 
            />
          </div>

          <div className="biz-input-wrapper">
            <label>{formData.type === 'clinica veterinária' ? 'Clinic Name' : 'Center Name'}</label>
            <input 
              type="text" 
              placeholder="name"
              className="biz-input-field"
              value={formData.clinicName}
              onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
              required 
            />
          </div>

          <div className="biz-input-wrapper">
            <label>Nif</label>
            <input 
              type="text" 
              className="biz-input-field"
              value={formData.nif}
              onChange={(e) => setFormData({...formData, nif: e.target.value})}
              required 
            />
          </div>

          <div className="biz-input-wrapper">
            <label>Phone number</label>
            <input 
              type="tel" 
              placeholder="(+351)"
              className="biz-input-field"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required 
            />
          </div>

          <div className="biz-input-wrapper">
            <label>Address</label>
            <input 
              type="text" 
              className="biz-input-field"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required 
            />
          </div>
        </form>
      </div>

      <footer className="biz-footer-responsive">
        <div className="footer-side-column">
          <button type="button" className="biz-btn-nav" onClick={handleBack}>
            Back
          </button>
        </div>
        <h2 className="biz-footer-logo">Petify</h2>
        <div className="footer-side-column biz-align-right">
          <button type="submit" form="regForm" className="biz-btn-nav">
            Register
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RegisterEmpresa2;