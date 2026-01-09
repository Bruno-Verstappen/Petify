import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../config/firebase'; 
import { 
  doc, getDoc, collection, query, where, 
  updateDoc, onSnapshot, orderBy 
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
  const [appointments, setAppointments] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [clinicName, setClinicName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeApp = () => {};
    let unsubscribeChats = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists()) {
            const myClinicId = userDocSnap.data().clinicId || user.uid; 
            setClinicName(userDocSnap.data().name || "Petify Clinic");

            const qApp = query(collection(db, "appointments"), where("clinicId", "==", myClinicId));
            unsubscribeApp = onSnapshot(qApp, async (snapshot) => {
              const appData = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data();
                let petName = "Pet", petImg = "https://via.placeholder.com/80";
                if (data.petId) {
                  const pSnap = await getDoc(doc(db, "pets", data.petId));
                  if (pSnap.exists()) { petName = pSnap.data().name; petImg = pSnap.data().imageUrl; }
                }
                return { id: d.id, ...data, petName, petImg };
              }));
              setAppointments(appData);
            });

            const qChats = query(collection(db, "chats"), where("clinicId", "==", myClinicId), orderBy("updatedAt", "desc"));
            unsubscribeChats = onSnapshot(qChats, async (snap) => {
              const chatsComDados = await Promise.all(snap.docs.map(async (d) => {
                const chatData = d.data();
                let pImg = "https://via.placeholder.com/40", pName = "Pet";
                if (chatData.petId) {
                  const pSnap = await getDoc(doc(db, "pets", chatData.petId));
                  if (pSnap.exists()) { pImg = pSnap.data().imageUrl; pName = pSnap.data().name; }
                }
                return { id: d.id, ...chatData, petImg: pImg, petName: pName };
              }));
              setRecentChats(chatsComDados);
            });
          }
        } catch (error) { console.error(error); } finally { setLoading(false); }
      }
    });
    return () => { unsubscribeAuth(); unsubscribeApp(); unsubscribeChats(); };
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try { await updateDoc(doc(db, "appointments", id), { status: newStatus }); } catch (e) { console.error(e); }
  };

  if (loading) return <div className="loading-screen"><h1>PETIFY</h1></div>;

  return (
    <div className="petify-container">
      <header className="petify-header">
        <img src={PetifyLogo} alt="Petify" className="main-logo" />
        <div className="header-center">
          <div className="search-bar-extra-large">
            <input type="text" placeholder="Search..." className="input-white-bg" />
            <img src={SearchIcon} alt="search" className="icon-search-header" />
          </div>
        </div>
        <div className="header-right-icons">
          <img src={ReadIcon} alt="mail" className="h-icon-large" />
          <img src={NotifyIcon} alt="alert" className="h-icon-large" />
          <img src={MenuIcon} alt="menu" className="h-icon-bones-large" />
        </div>
      </header>

      <main className="petify-main">
        <aside className="medical-sidebar">
          <h3 className="sidebar-title">Medical Consultation</h3>
          <div className="sidebar-filter-wrapper">
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="input-white-bg"
              placeholder="Filter pets..."
            />
            <img src={FilterIcon} alt="filter" className="filter-icon-img" />
          </div>
          <div className="sidebar-list">
            {appointments.filter(a => a.petName?.toLowerCase().includes(searchTerm.toLowerCase())).map(app => (
              <div key={app.id} className="sidebar-card-modern">
                <div className="card-main-content">
                  <div className="pet-identity">
                    <img src={app.petImg} alt="pet" className="pet-avatar-large" />
                    <p className="pet-name-label-large">{app.petName}</p>
                  </div>
                  <div className="appointment-details">
                    <div className="title-urgency-row">
                      <strong className="app-type-text">Vaccination</strong>
                      <span className={`urgency-dot-small ${app.urgency 
                        ? app.urgency.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
                        : 'baixa'}`}>
                      </span>
                    </div>
                    <p className="reason-preview-large">"{app.reason || 'Sem descrição'}"</p>
                  </div>
                </div>
                <div className="card-bottom-row-large">
                  <span>{app.date?.split(' ')[0]}</span>
                  <span>{app.date?.split(' ')[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="dashboard-content">
          <h2 className="welcome-msg-extra">Good morning (<span>{clinicName}</span>)</h2>
          
          <div className="stats-focus-area">
            <div className="stats-grid-hero">
              <div className="stat-box-hero">
                <h1>{[...new Set(appointments.filter(a=>a.status==='confirmado').map(a=>a.userId))].length}</h1>
                <span>new clients</span>
              </div>
              <div className="stat-box-hero">
                <h1>{[...new Set(appointments.filter(a=>a.status==='confirmado').map(a=>a.petId))].length}</h1>
                <span>pets tratados</span>
              </div>
              <div className="stat-box-hero">
                <h1>{appointments.filter(a=>a.status==='confirmado').length}</h1>
                <span>consultas</span>
              </div>
              <div className="stat-box-hero">
                <h1>{appointments.filter(a=>a.status==='confirmado').reduce((acc,curr)=>acc+(Number(curr.price)||0),0)}€</h1>
                <span>faturamento</span>
              </div>
            </div>
          </div>

          <div className="pending-section-modern">
            <h3>Pending Consultation</h3>
            <div className="horizontal-scroll">
              {appointments.filter(a => a.status === 'pendente').map(app => (
                <div key={app.id} className="pending-card-compact">
                  <img src={app.petImg} alt="pet" className="pending-img-compact" />
                  <div className="pending-details">
                    <div className="pending-row-one">
                      <span className="type-label">Vaccination</span>
                      <span className="date-label">{app.date}</span>
                    </div>
                    <p>pet name: {app.petName}</p>
                    <div className="pending-actions">
                      <button className="btn-accept-mini" onClick={() => handleStatusUpdate(app.id, 'confirmado')}>Accept</button>
                      <button className="btn-refuse-mini" onClick={() => handleStatusUpdate(app.id, 'recusado')}>Refuse</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-section-modern">
            <h3>Chat</h3>
            <div className="chat-list-bg">
              {recentChats.map(chat => (
                <div key={chat.id} className="chat-row-item">
                  <img src={chat.petImg} alt="pet" />
                  <div className="chat-content-text">
                    <div className="chat-header-info">
                      <strong>{chat.petName}</strong>
                      <span className="chat-time">28-12-2026</span>
                    </div>
                    <p>{chat.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;