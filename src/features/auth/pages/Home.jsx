import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase'; 
import { 
  doc, getDoc, collection, query, where, 
  updateDoc, onSnapshot, orderBy, getDocs 
} from 'firebase/firestore';
import './Home.css';

// Assets
import PetifyLogo from '../../../assets/images/Petify.png';
import SearchIcon from '../../../assets/images/Search_tools.png';
import ReadIcon from '../../../assets/images/Marcar_lido.png';
import NotifyIcon from '../../../assets/images/Notifications.png';
import FilterIcon from '../../../assets/images/Filter.png';
import MenuIcon from '../../../assets/images/Hamburger_menu.png';

const Home = () => {
  const navigate = useNavigate();
  const [myAppointments, setMyAppointments] = useState([]); 
  const [pendingClinic, setPendingClinic] = useState([]);   
  const [recentChats, setRecentChats] = useState([]);       
  const [userName, setUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [stats, setStats] = useState({
    newClients: 0, petsTratados: 0, consultas: 0, faturamento: 0
  });

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getUrgencyClass = (urgency) => {
    if (!urgency) return 'baixa';
    return urgency.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const getPetAndOwnerData = async (data) => {
    let petInfo = { name: "Pet", img: "https://via.placeholder.com/80" };
    let ownerName = data.userName || "Dono desconhecido";

    try {
      if (data.petId && typeof data.petId === 'string') {
        const petSnap = await getDoc(doc(db, "pets", data.petId));
        if (petSnap.exists()) {
          petInfo.name = petSnap.data().name;
          petInfo.img = petSnap.data().imageUrl || petInfo.img;
        }
      }
      if (data.userId && !data.userName) {
        const userSnap = await getDoc(doc(db, "users", data.userId));
        if (userSnap.exists()) ownerName = userSnap.data().name;
      }
    } catch (e) { console.error(e); }
    
    return { 
      ...data, 
      petName: petInfo.name, 
      petImg: petInfo.img, 
      ownerName 
    };
  };

  useEffect(() => {
    let unsubMyApps = () => {};
    let unsubPending = () => {};
    let unsubChats = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const myClinicId = userData.clinicId; 
            const myVetId = user.uid; 
            setUserName(userData.name || "Veterinário");

            // 1. Minhas Consultas
            const qMy = query(collection(db, "appointments"), where("vetId", "==", myVetId), where("status", "==", "confirmado"));
            unsubMyApps = onSnapshot(qMy, async (snap) => {
              const data = await Promise.all(snap.docs.map(d => getPetAndOwnerData({ id: d.id, ...d.data() })));
              setMyAppointments(data);
              
              const agora = new Date();
              const realizadas = data.filter(app => {
                if (!app.date) return false;
                const dataConsulta = new Date(app.date.replace(' ', 'T'));
                return dataConsulta <= agora;
              });

              setStats({
                newClients: [...new Set(realizadas.map(a => a.userId))].length,
                petsTratados: [...new Set(realizadas.map(a => a.petId))].length,
                consultas: realizadas.length,
                faturamento: realizadas.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0)
              });
            });

            // 2. Pendentes
            const qPend = query(collection(db, "appointments"), where("clinicId", "==", myClinicId), where("status", "==", "pendente"));
            unsubPending = onSnapshot(qPend, async (snap) => {
              const data = await Promise.all(snap.docs.map(d => getPetAndOwnerData({ id: d.id, ...d.data() })));
              setPendingClinic(data);
              setLoading(false);
            });

            // 3. Chats Recentes (Ordenação por updatedAt)
            const qChats = query(collection(db, "chats"), where("clinicId", "==", myClinicId), orderBy("updatedAt", "desc"));
            unsubChats = onSnapshot(qChats, async (snap) => {
              const chatData = await Promise.all(snap.docs.map(d => getPetAndOwnerData({ id: d.id, ...d.data() })));
              setRecentChats(chatData);
            });
          }
        } catch (e) { console.error(e); setLoading(false); }
      } else { navigate('/login'); }
    });
    return () => { unsubscribeAuth(); unsubMyApps(); unsubPending(); unsubChats(); };
  }, [navigate]);

  const handleAccept = async (appId, date) => {
    const qConflict = query(collection(db, "appointments"), where("vetId", "==", auth.currentUser.uid), where("date", "==", date), where("status", "==", "confirmado"));
    const conflictSnap = await getDocs(qConflict);
    if (!conflictSnap.empty) { alert("Horário ocupado!"); return; }
    await updateDoc(doc(db, "appointments", appId), { status: 'confirmado', vetId: auth.currentUser.uid });
  };

  if (loading) return <div className="loading-screen"><h1>PETIFY</h1></div>;

  return (
    <div className="petify-container">
      {/* MENU HAMBURGUER COMPLETO RESTAURADO */}
      <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-items">
          <div className="menu-item" onClick={() => {navigate('/home'); toggleMenu();}}>Home</div>
          <div className="menu-item" onClick={() => {navigate('/calendar'); toggleMenu();}}>Calendar</div>
          <div className="menu-item" onClick={() => {navigate('/chat'); toggleMenu();}}>Chat</div>
          <div className="menu-item" onClick={() => {navigate('/clients'); toggleMenu();}}>Clients</div>
          <div className="menu-item" onClick={() => toggleMenu()}>Analytics</div>
          <div className="menu-item" onClick={() => toggleMenu()}>Settings</div>
          <div className="menu-item logout" onClick={() => auth.signOut()}>Logout</div>
        </div>
      </div>
      {isMenuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}

      <header className="petify-header">
        <img src={PetifyLogo} alt="Petify" className="main-logo" onClick={() => navigate('/home')} style={{cursor:'pointer'}} />
        <div className="header-center">
          <div className="search-bar-extra-large">
            <input type="text" placeholder="Search..." className="input-white-bg" />
            <img src={SearchIcon} alt="search" className="icon-search-header" />
          </div>
        </div>
        <div className="header-right-icons">
          <img src={ReadIcon} alt="mail" className="h-icon-large" />
          <img src={NotifyIcon} alt="alert" className="h-icon-large" />
          <img src={MenuIcon} alt="menu" className="h-icon-bones-large" onClick={toggleMenu} />
        </div>
      </header>

      <main className="petify-main">
        <aside className="medical-sidebar">
          <h3 className="sidebar-title">My Consultations</h3>
          <div className="sidebar-filter-wrapper">
             <input type="text" className="input-white-bg" placeholder="Search pet..." onChange={(e) => setSearchTerm(e.target.value)} />
             <img src={FilterIcon} alt="filter" style={{height: '20px'}} />
          </div>
          <div className="sidebar-list">
            {myAppointments.filter(a => a.petName?.toLowerCase().includes(searchTerm.toLowerCase())).map(app => (
              <div key={app.id} className="sidebar-card-modern" style={{position: 'relative'}}>
                <span className={`urgency-dot-small ${getUrgencyClass(app.urgency)}`} style={{position: 'absolute', top: '15px', right: '15px'}}></span>
                <div className="card-main-content">
                  <img src={app.petImg} alt="pet" className="pet-avatar-large" />
                  <div>
                    <p className="pet-name-label-large">{app.petName}</p>
                    <p style={{fontSize: '12px', color: '#ffd700'}}>Dono: {app.ownerName}</p>
                    <p style={{fontSize: '13px', color: '#ccc', margin: '4px 0'}}>"{app.reason || 'Sem motivo'}"</p>
                  </div>
                </div>
                <div className="card-bottom-row-large" style={{marginTop: '8px', fontSize: '11px', color: '#aaa'}}>{app.date}</div>
              </div>
            ))}
          </div>
        </aside>

        <section className="dashboard-content">
          <h2 className="welcome-msg-extra">Welcome, Dr. <span>{userName}</span></h2>
          
          <div className="stats-focus-area">
            <div className="stats-grid-hero">
              <div className="stat-box-hero"><h1>{stats.newClients}</h1><span>my clients</span></div>
              <div className="stat-box-hero"><h1>{stats.petsTratados}</h1><span>pets treated</span></div>
              <div className="stat-box-hero"><h1>{stats.consultas}</h1><span>consultations</span></div>
              <div className="stat-box-hero"><h1>{stats.faturamento}€</h1><span>my revenue</span></div>
            </div>
          </div>

          <div className="pending-section-modern">
            <h3 style={{color: 'white', marginBottom: '15px'}}>Pending Consultation</h3>
            <div className="horizontal-scroll">
              {pendingClinic.map(app => (
                <div key={app.id} className="pending-card-compact">
                  <img src={app.petImg} alt="pet" className="pending-img-compact" />
                  <div className="pending-details" style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                       <strong>{app.petName} ({app.ownerName})</strong>
                       <span className={`urgency-dot-small ${getUrgencyClass(app.urgency)}`}></span>
                    </div>
                    <p style={{fontSize: '12px', color: '#ddd'}}>{app.date}</p>
                    <p style={{fontSize: '13px', margin: '5px 0', color: '#eee'}}>Motivo: {app.reason || "n/a"}</p>
                    <div className="pending-actions">
                      <button className="btn-accept-mini" onClick={() => handleAccept(app.id, app.date)}>Accept</button>
                      <button className="btn-refuse-mini" onClick={() => updateDoc(doc(db, "appointments", app.id), {status: 'recusado'})}>Refuse</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-section-modern" style={{marginTop: '30px'}}>
            <h3 style={{color: 'white', marginBottom: '15px'}}>Clinic Chat (Shared)</h3>
            <div className="chat-list-bg" onClick={() => navigate('/chat')} style={{cursor: 'pointer', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '10px'}}>
              {recentChats.length > 0 ? recentChats.slice(0, 3).map(chat => (
                <div key={chat.id} className="chat-row-item">
                  <img src={chat.petImg} alt="pet" style={{width: '40px', height: '40px', borderRadius: '50%', marginRight: '15px'}} />
                  <div className="chat-content-text">
                    <strong style={{color: 'white'}}>{chat.petName} ({chat.ownerName})</strong>
                    <p style={{fontSize: '14px', color: '#bbb', margin: 0}}>{chat.lastMessage}</p>
                  </div>
                </div>
              )) : <p style={{color: '#888', padding: '10px'}}>No recent messages.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;