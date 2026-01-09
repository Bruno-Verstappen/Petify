import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../config/firebase'; 
import { 
  doc, getDoc, collection, query, where, 
  updateDoc, onSnapshot, orderBy 
} from 'firebase/firestore';
import './Home.css';

// Importações baseadas na tua estrutura
import PetifyLogo from '../../../assets/images/Petify.png';
import SearchIcon from '../../../assets/images/Search_tools.png';
import ReadIcon from '../../../assets/images/Marcar_lido.png';
import NotifyIcon from '../../../assets/images/Notifications.png';
import FilterIcon from '../../../assets/images/Filter.png';
import MenuIcon from '../../../assets/images/Hamburger_menu.png';

const Home = () => {
  const [appointments, setAppointments] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
                let petName = "Pet", petImg = "https://via.placeholder.com/80", ownerName = "Dono";
                if (data.petId) {
                  const pSnap = await getDoc(doc(db, "pets", data.petId));
                  if (pSnap.exists()) { petName = pSnap.data().name; petImg = pSnap.data().imageUrl; }
                }
                if (data.userId) {
                  const uSnap = await getDoc(doc(db, "users", data.userId));
                  if (uSnap.exists()) ownerName = uSnap.data().name;
                }
                return { id: d.id, ...data, petName, petImg, ownerName };
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

  const filteredApps = appointments.filter(app => 
    app.petName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const normalizeUrgency = (text) => {
    if (!text) return 'media';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  if (loading) return <div className="loading-screen"><h1>PETIFY</h1></div>;

  return (
    <div className="petify-container">
      <header className="petify-header">
        <img src={PetifyLogo} alt="Petify" className="main-logo" />
        <div className="header-center">
          <div className="search-bar-modern">
            <input type="text" />
            <img src={SearchIcon} alt="search" className="icon-search" />
          </div>
        </div>
        <div className="header-right-icons">
          <img src={ReadIcon} alt="mail" className="h-icon" />
          <img src={NotifyIcon} alt="alert" className="h-icon" />
          <img src={MenuIcon} alt="menu" className="h-icon-bones" />
        </div>
      </header>

      <main className="petify-main">
        {/* Sidebar com scroll independente */}
        <aside className="medical-sidebar">
          <h3>Medical Consultation</h3>
          <div className="sidebar-filter-wrapper">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <img src={FilterIcon} alt="filter" className="filter-icon-img" />
          </div>
          <div className="sidebar-list">
            {filteredApps.map(app => (
              <div key={app.id} className="sidebar-card-modern">
                <div className="card-top-row">
                  <img src={app.petImg} alt="pet" className="pet-avatar" />
                  <div className="pet-info-header">
                    <strong>Vactination</strong>
                    <span className={`urgency-dot-small ${normalizeUrgency(app.urgency)}`}></span>
                  </div>
                </div>
                <p className="pet-name-label">{app.petName}</p>
                <p className="reason-preview">"{app.reason}"</p>
                <div className="card-bottom-row">
                  <span>{app.date?.split(' ')[0]}</span>
                  <span>{app.date?.split(' ')[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="dashboard-content">
          <h2 className="welcome-msg">Good morning (<span>{clinicName}</span>)</h2>
          <div className="stats-grid-modern">
            <div className="stat-box"><h1>{[...new Set(appointments.filter(a=>a.status==='confirmado').map(a=>a.userId))].length}</h1><span>new clients</span></div>
            <div className="stat-box"><h1>{[...new Set(appointments.filter(a=>a.status==='confirmado').map(a=>a.petId))].length}</h1><span>pets tratados</span></div>
            <div className="stat-box"><h1>{appointments.filter(a=>a.status==='confirmado').length}</h1><span>consultas</span></div>
            <div className="stat-box"><h1>{appointments.filter(a=>a.status==='confirmado').reduce((acc,curr)=>acc+(Number(curr.price)||0),0)}€</h1><span>faturamento</span></div>
          </div>

          <div className="pending-section-modern">
            <h3>Pending Consultation</h3>
            <div className="horizontal-scroll">
              {appointments.filter(a => a.status === 'pendente').map(app => (
                <div key={app.id} className="pending-card-modern">
                  <img src={app.petImg} alt="pet" className="pending-img" />
                  <div className="pending-details">
                    <div className="pending-row-one"><span>Vactination</span><span>{app.date}</span></div>
                    <p>pet name: {app.petName}</p>
                    <p>owner: {app.ownerName}</p>
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
                      <span className="chat-time">22:21</span>
                    </div>
                    <p>{chat.userName}: {chat.lastMessage}</p>
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