import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase"; // Corrigido: sobe 1 nível para src e entra em config
import "./Header.css";

// Assets - Caminhos corrigidos para subir 1 nível (src) e entrar em assets
import PetifyLogo from "../assets/images/Petify.png";
import SearchIcon from "../assets/images/Search_tools.png";
import ReadIcon from "../assets/images/Marcar_lido.png";
import NotifyIcon from "../assets/images/Notifications.png";
import MenuIcon from "../assets/images/Hamburger_menu.png";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <>
      <header className="petify-header-shared">
        <img
          src={PetifyLogo}
          alt="Petify"
          className="main-logo"
          onClick={() => navigate("/home")}
          style={{ cursor: "pointer" }}
        />

        <div className="header-center">
          <div className="search-bar-extra-large">
            <input
              type="text"
              placeholder="Search..."
              className="input-white-bg"
            />
            <img src={SearchIcon} alt="search" className="icon-search-header" />
          </div>
        </div>

        <div className="header-right-icons">
          <img src={ReadIcon} alt="mail" className="h-icon-large" />
          <img src={NotifyIcon} alt="alert" className="h-icon-large" />
          <img
            src={MenuIcon}
            alt="menu"
            className="h-icon-bones-large"
            onClick={toggleMenu}
          />
        </div>
      </header>

      {/* Menu Lateral */}
      <div className={`side-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="menu-items">
          <div className="menu-item" onClick={() => { navigate("/home"); toggleMenu(); }}>
            Home
          </div>
          <div className="menu-item" onClick={() => { navigate("/calendar"); toggleMenu(); }}>
            Calendar
          </div>
          <div className="menu-item" onClick={() => { navigate("/chat"); toggleMenu(); }}>
            Chat
          </div>
          <div className="menu-item" onClick={() => { navigate("/clients"); toggleMenu(); }}>
            Clients
          </div>
          <div className="menu-item logout" onClick={handleLogout}>
            Logout
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}
    </>
  );
};

export default Header;