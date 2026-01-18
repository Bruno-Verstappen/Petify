import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "./RegisterEmpresa1.css";
import pataImg from "../../../assets/images/pata_password.png";

const RegisterEmpresa1 = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const savedData = location.state?.savedData || {};
  const [email, setEmail] = useState(savedData.email || '');
  const [password, setPassword] = useState(savedData.password || '');
  const [confirmPassword, setConfirmPassword] = useState(savedData.password || '');
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNext = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    navigate('/RegisterEmpresa2', { 
      state: { step1: { email, password } } 
    });
  };

  return (
    <div className="biz-reg-container">
      <div className="biz-top-link" onClick={() => navigate('/login')}>
        Already have an account ?
      </div>

      <div className="biz-step-header">
        <span className="step-digit active">1</span>
        <div className="step-connector"></div>
        <span className="step-digit inactive">2</span>
      </div>

      <div className="biz-main-content">
        <form className="biz-registration-form" onSubmit={handleNext}>
          <div className="biz-input-wrapper">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="company email"
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
              <img src={pataImg} className="biz-pata-icon" onClick={() => setShowPass(!showPass)} alt="pata" />
            </div>
          </div>

          <div className="biz-input-wrapper">
            <label>Confirm Password</label>
            <div className="biz-pata-container">
              <input 
                type={showConfirm ? "text" : "password"} 
                placeholder="123456789"
                className="biz-input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
              <img src={pataImg} className="biz-pata-icon" onClick={() => setShowConfirm(!showConfirm)} alt="pata" />
            </div>
          </div>
        </form>
      </div>

      <footer className="biz-footer-responsive">
        <div className="footer-side-column"></div>
        <h2 className="biz-footer-logo">Petify</h2>
        <div className="footer-side-column biz-align-right">
          <button type="submit" className="biz-btn-continue" onClick={handleNext}>
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RegisterEmpresa1;