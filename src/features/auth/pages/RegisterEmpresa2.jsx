import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "./RegisterEmpresa2.css";

const RegisterEmpresa2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dados recebidos da página 1
  const step1Data = location.state?.step1 || {};

  const [formData, setFormData] = useState({
    clinicName: '',
    nif: '',
    phone: '',
    address: ''
  });

  // Função para voltar atrás mantendo os dados
  const handleBack = () => {
    navigate('/RegisterEmpresa1', { 
      state: { savedData: step1Data } 
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const finalData = { ...step1Data, ...formData };
    console.log("Registo Final:", finalData);
    // Próximo passo: Firebase
  };

  return (
    <div className="biz-reg-container">
      <div className="biz-top-link" onClick={() => navigate('/login')}>
        Already have an account ?
      </div>

      <div className="biz-step-header">
        <span className="step-digit active">2</span>
      </div>

      <div className="biz-main-content">
        <form className="biz-registration-form" onSubmit={handleRegister}>
          <div className="biz-input-wrapper">
            <label>Clinic Name</label>
            <input 
              type="text" 
              placeholder="company email"
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
          <button type="submit" className="biz-btn-nav" onClick={handleRegister}>
            Register
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RegisterEmpresa2;