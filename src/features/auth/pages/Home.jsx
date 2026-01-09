import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../config/firebase'; 
import { 
  doc, getDoc, collection, query, where, 
  updateDoc, onSnapshot, orderBy 
} from 'firebase/firestore';
import './Home.css';

const Home = () => {
  const [appointments, setAppointments] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState("");

  const parseDate = (dateField) => {
    if (!dateField) return 0;
    if (dateField.toMillis) return dateField.toMillis();
    const dateStr = String(dateField).toLowerCase();
    if (dateStr.includes('-') && !dateStr.includes(' de ')) {
        return new Date(dateStr.replace(/-/g, "/")).getTime();
    }
    if (dateStr.includes(' de ')) {
      const meses = { 'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11 };
      const partes = dateStr.split(' ');
      const dia = parseInt(partes[0]);
      const mes = meses[partes[2]];
      const ano = parseInt(partes[4]);
      const horaPartes = partes[6].split(':');
      return new Date(ano, mes, dia, parseInt(horaPartes[0]), parseInt(horaPartes[1])).getTime();
    }
    return new Date(dateStr).getTime() || 0;
  };

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
                let ownerName = "Cliente";
                if (data.userId) {
                  const uSnap = await getDoc(doc(db, "users", data.userId));
                  if (uSnap.exists()) ownerName = uSnap.data().name;
                }
                let petName = "Pet";
                let petImg = "https://via.placeholder.com/80";
                if (data.petId) {
                  const pSnap = await getDoc(doc(db, "pets", data.petId));
                  if (pSnap.exists()) {
                    petName = pSnap.data().name;
                    petImg = pSnap.data().imageUrl;
                  }
                }
                return { id: d.id, ...data, ownerName, petName, petImg };
              }));
              setAppointments(appData);
            });

            const qChats = query(collection(db, "chats"), where("clinicId", "==", myClinicId), orderBy("updatedAt", "desc"));
            unsubscribeChats = onSnapshot(qChats, async (snap) => {
                const chatsComDados = await Promise.all(snap.docs.map(async (d) => {
                    const chatData = d.data();
                    let displayPetName = "Pet", displayPetImg = "https://via.placeholder.com/40";
                    if (chatData.petId) {
                        const pSnap = await getDoc(doc(db, "pets", chatData.petId));
                        if (pSnap.exists()) {
                            displayPetName = pSnap.data().name;
                            displayPetImg = pSnap.data().imageUrl;
                        }
                    }
                    return { id: d.id, ...chatData, petName: displayPetName, petImg: displayPetImg };
                }));
                setRecentChats(chatsComDados);
            });
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => { unsubscribeAuth(); unsubscribeApp(); unsubscribeChats(); };
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try { await updateDoc(doc(db, "appointments", id), { status: newStatus }); } catch (e) { console.error(e); }
  };

  // Lógica para estatísticas e filtragem
  const agoraMs = new Date().getTime();
  const realizadas = appointments.filter(a => a.status === 'confirmado' && parseDate(a.date) <= agoraMs);
  const pendentes = appointments.filter(a => a.status === 'pendente');

  // Helper para normalizar o texto da urgência para as classes CSS (remove acentos)
  const normalizeUrgency = (text) => {
    if (!text) return 'media';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  if (loading) return <div className="loading-screen">Petify is loading...</div>;

  return (
    <div className="petify-container">
      <header className="petify-header">
        <div className="logo">Petify</div>
        <div className="search-bar">
          <input type="text" placeholder="Search..." />
          <img src="/Search_tools.png" alt="search" className="icon-img" />
        </div>
        <div className="header-icons">
          <img src="/Marcar_lido.png" alt="read" className="icon-img" />
          <img src="/Notifications.png" alt="notify" className="icon-img" />
          <img src="/Hamburger_menu.png" alt="menu" className="icon-img" />
        </div>
      </header>

      <main className="petify-main">
        <aside className="medical-sidebar">
          <h3>Medical Consultation</h3>
          <div className="sidebar-filter">
            <input type="text" placeholder="filter" />
            <img src="/Search_tools.png" alt="filter" />
          </div>
          <div className="sidebar-list">
            {appointments.slice(0, 10).map(app => (
              <div key={app.id} className="sidebar-card">
                <img src={app.petImg} alt="pet" />
                <div className="card-txt">
                  <div className="card-header">
                    <strong>{app.petName}</strong>
                    <span className={`urgency-dot ${normalizeUrgency(app.urgency)}`}></span>
                  </div>
                  <p>"{app.reason}"</p>
                  <div className="card-footer">
                    <span>{app.date?.split(' de ')[0]}</span>
                    <span>{app.date?.split(' às ')[1]?.substring(0, 5)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="dashboard-content">
          <h2 className="welcome-msg">Good morning ({clinicName})</h2>
          
          <div className="stats-grid">
            <div className="stat-card"><h1>{[...new Set(realizadas.map(a => a.userId))].length}</h1><span>new clients</span></div>
            <div className="stat-card"><h1>{[...new Set(realizadas.map(a => a.petId))].length}</h1><span>pets tratados</span></div>
            <div className="stat-card"><h1>{realizadas.length}</h1><span>consultas dadas</span></div>
            <div className="stat-card"><h1>{realizadas.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0).toFixed(0)}€</h1><span>faturamento</span></div>
          </div>

          <div className="pending-section">
            <h3>Pending Consultation</h3>
            <div className="horizontal-scroll">
              {pendentes.map(app => (
                <div key={app.id} className="pending-card">
                  <img src={app.petImg} alt="pet" className="pet-thumb" />
                  <div className="pending-info">
                    <div className="pending-header">
                      <span className="type">Appointment</span>
                      <span className="time">{app.date?.split(' às ')[1]?.substring(0, 5)}</span>
                    </div>
                    <p>pet name: <strong>{app.petName}</strong></p>
                    <p>owner: <strong>{app.ownerName}</strong></p>
                    <p>reason: <strong>{app.reason}</strong></p>
                    <p>urgency: <strong className={`urgency-text ${normalizeUrgency(app.urgency)}`}>{app.urgency || "média"}</strong></p>
                    <div className="pending-btns">
                      <button className="accept" onClick={() => handleStatusUpdate(app.id, 'confirmado')}>Accept</button>
                      <button className="refuse" onClick={() => handleStatusUpdate(app.id, 'recusado')}>Refuse</button>
                    </div>
                  </div>
                </div>
              ))}
              {pendentes.length === 0 && <p className="empty-msg">Sem consultas pendentes.</p>}
            </div>
          </div>

          <div className="chat-section">
            <h3>Recent Chats</h3>
            <div className="vertical-scroll">
              {recentChats.map(chat => (
                <div key={chat.id} className="chat-item">
                  <img src={chat.petImg} alt="pet" />
                  <div className="chat-body">
                    <div className="chat-top">
                      <strong>{chat.userName} ({chat.petName})</strong>
                      <span className="chat-date">
                        {chat.updatedAt?.toMillis ? 
                          new Date(chat.updatedAt.toMillis()).toLocaleDateString('pt-PT') + ' ' + 
                          new Date(chat.updatedAt.toMillis()).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'}) : ""
                        }
                      </span>
                    </div>
                    <p className="last-msg">{chat.lastMessage}</p>
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