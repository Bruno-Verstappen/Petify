import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase'; 
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import './Settings.css';

import menuIcon from '../../../assets/images/Hamburger_menu.png'; 

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    clinicId: '',
    clinicCode: ''
  });

  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchUserData(user.uid);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        let foundClinicCode = "";

        // Busca o código na coleção 'clinics' onde o campo clinicId coincide
        if (data.clinicId) {
          const clinicsRef = collection(db, "clinics");
          const q = query(clinicsRef, where("clinicId", "==", data.clinicId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Acessa o campo clinicCode: "56789" visto na imagem
            foundClinicCode = querySnapshot.docs[0].data().clinicCode;
          }
        }

        setUserData({ id: uid, ...data, clinicCode: foundClinicCode });

        if (data.role === 'admin_empresa' && data.clinicId) {
            fetchTeam(data.clinicId, uid);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  const fetchTeam = async (clinicId, myUid) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("clinicId", "==", clinicId));
        const snapshot = await getDocs(q);
        
        const team = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => user.id !== myUid); 

        setTeamMembers(team);
    } catch (error) {
        console.error("Erro ao buscar equipa:", error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
            phone: userData.phone || "",
            address: userData.address || ""
        });
        alert("Perfil atualizado com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar perfil.");
    } finally {
        setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Eliminar ${userName}?`)) return;
    try {
        await deleteDoc(doc(db, "users", userId));
        setTeamMembers(teamMembers.filter(member => member.id !== userId));
        alert("Utilizador removido.");
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => { auth.signOut(); navigate('/login'); };
  const handleNavigate = (path) => { setMenuOpen(false); if (path) navigate(path); };
  const toggleMenu = (e) => { e.stopPropagation(); setMenuOpen(!menuOpen); };

  if (loading) return <div className="settings-container"><p style={{padding:'20px', color:'white'}}>A carregar dados...</p></div>;

  return (
    <div className="settings-container" onClick={() => setMenuOpen(false)}>
      
      <header className="dash-header">
        <h1 className="logo-text">Petify <span className="sub-logo">Settings</span></h1>
        <div className="header-actions">
            <div className="menu-container">
                <img src={menuIcon} alt="Menu" className="hamburger-icon" onClick={toggleMenu} />
                {menuOpen && (
                    <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="menu-item" onClick={() => handleNavigate('/home-centro')}>Home</div>
                        <div className="menu-item" onClick={() => handleNavigate('/pet-list')}>Pets</div>
                        <div className="menu-item" onClick={() => handleNavigate('/settings')}>Settings</div>
                        <div className="menu-item logout" onClick={handleLogout}>Logout</div>
                    </div>
                )}
            </div>
        </div>
      </header>

      <div className="settings-content">
        <section className="settings-card">
            <h2 className="card-title">My Profile ({userData.role === 'admin_empresa' ? 'Admin' : 'Staff'})</h2>
            
            <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="form-group">
                    <label>Clinic Code (To invite staff)</label>
                    <input 
                        name="clinicCode" 
                        value={userData.clinicCode || 'Não disponível'} 
                        disabled
                        className="dark-input disabled highlight-code" 
                    />
                </div>

                <div className="form-group">
                    <label>Name (Read Only)</label>
                    <input name="name" value={userData.name || ''} 
                    disabled
                    className="dark-input disabled" />
                </div>
                
                <div className="form-group">
                    <label>Email (Read Only)</label>
                    <input name="email" value={userData.email || ''} 
                    disabled 
                    className="dark-input disabled" />
                </div>

                <div className="form-group">
                    <label>Phone</label>
                    <input name="phone" value={userData.phone || ''} onChange={handleInputChange} className="dark-input" />
                </div>

                <div className="form-group">
                    <label>Address / Bio</label>
                    <textarea name="address" value={userData.address || ''} onChange={handleInputChange} className="dark-input" rows="3"></textarea>
                </div>

                <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </section>

        {userData.role === 'admin_empresa' && (
            <section className="settings-card">
                <div className="card-header-row">
                    <h2 className="card-title">Team Management</h2>
                    <span className="badge-count">{teamMembers.length} Members</span>
                </div>
                
                <div className="team-list">
                    {teamMembers.map(member => (
                        <div key={member.id} className="team-item">
                            <div className="member-info">
                                <span className="member-name">{member.name}</span>
                                <span className="member-role">{member.role}</span>
                                <span className="member-email">{member.email}</span>
                            </div>
                            <button className="delete-btn" onClick={() => handleDeleteUser(member.id, member.name)}>Remove</button>
                        </div>
                    ))}
                    {teamMembers.length === 0 && <p className="empty-text">No other members in this clinic.</p>}
                </div>
            </section>
        )}
      </div>
    </div>
  );
};

export default Settings;