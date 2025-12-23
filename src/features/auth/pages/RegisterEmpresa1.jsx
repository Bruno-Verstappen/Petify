import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./RegisterEmpresa1.css";

const RegisterEmpresa1 = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    nif: '',
    phone: ''
  });
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    // Passamos os dados para a próxima página via state ou guardamos num contexto
    navigate('/RegisterEmpresa2', { state: { step1Data: formData } });
  };

  return (
    <div className="reg-biz-wrapper">
      <div className="top-right-back" onClick={() => navigate('/auth')}>
        Go back
      </div>

      <h1 className="reg-biz-title">Business<br/>Details</h1>
      
      <div className="reg-biz-content">
        <form onSubmit={handleNext} className="reg-biz-form">
          <p className="step-indicator">Step 1 of 2</p>
          
          <div className="reg-biz-input-group">
            <label>Business Name</label>
            <input 
              type="text" 
              className="reg-biz-input" 
              required 
              value={formData.businessName}
              onChange={(e) => setFormData({...formData, businessName: e.target.value})}
            />
          </div>

          <div className="reg-biz-input-group">
            <label>NIF / Tax ID</label>
            <input 
              type="text" 
              className="reg-biz-input" 
              required 
              value={formData.nif}
              onChange={(e) => setFormData({...formData, nif: e.target.value})}
            />
          </div>

          <div className="reg-biz-input-group">
            <label>Phone Number</label>
            <input 
              type="tel" 
              className="reg-biz-input" 
              required 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <button type="submit" className="btn-next-step">Next Step</button>
        </form>
      </div>

      <h2 className="reg-biz-footer">Petify</h2>
    </div>
  );
};

export default RegisterEmpresa1;