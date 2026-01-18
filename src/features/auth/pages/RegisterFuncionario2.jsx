import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "./RegisterFuncionario2.css";

const RegisterFuncionario2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const step1Data = location.state?.step1 || {};

  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    clinicCode: ''
  });

  const [jobOptions, setJobOptions] = useState([]);

  useEffect(() => {
    const roles = ["Veterinário", "Auxiliar", "Recepcionista", "Administrador"];
    setJobOptions(roles);
  }, []);

  const handleBack = () => {
    navigate('/RegisterFuncionario1', { state: { savedData: step1Data } });
  };

  const handleFinalRegister = (e) => {
    e.preventDefault();
    
    const finalPayload = { 
      ...step1Data, 
      ...formData,
      createdAt: new Date() 
    };

    console.log("Registo completo do funcionário:", finalPayload);

    navigate('/home'); 
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
        <form className="biz-registration-form" onSubmit={handleFinalRegister}>
          
          <div className="biz-input-wrapper">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="your full name"
              className="biz-input-field"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              required 
            />
          </div>

          <div className="biz-input-wrapper">
            <label>Job Title</label>
            <select 
              className="biz-input-field biz-select-field"
              value={formData.jobTitle}
              onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
              required
            >
              <option value="" disabled>Select</option>
              {jobOptions.map((job, index) => (
                <option key={index} value={job}>{job}</option>
              ))}
            </select>
          </div>

          <div className="biz-input-wrapper">
            <label>Clinic Code</label>
            <input 
              type="text" 
              placeholder="Company ID"
              className="biz-input-field"
              value={formData.clinicCode}
              onChange={(e) => setFormData({...formData, clinicCode: e.target.value})}
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
          <button type="submit" className="biz-btn-nav" onClick={handleFinalRegister}>
            Register
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RegisterFuncionario2;