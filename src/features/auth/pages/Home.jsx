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

  const formatDateTime = (dateField) => {
    if (!dateField) return "";
    let date = dateField.toDate ? dateField.toDate() : new Date(dateField);
    if (isNaN(date.getTime())) return dateField;
    const d = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const h = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    return `${d} ${h}`;
  };

  const parseDate = (dateField) => {
    if (!dateField) return 0;
    if (dateField.toMillis) return dateField.toMillis();
    const dateStr = String(dateField).toLowerCase();
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
            const myClinicId = userDocSnap.data().clinicId;
            setClinicName(userDocSnap.data().name || "Petify Clinic");

            const qApp = query(collection(db, "appointments"), where("clinicId", "==", myClinicId));
            unsubscribeApp = onSnapshot(qApp, async (snapshot) => {
              const appData = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data();
                let petName = "Pet", petImg = "https://via.placeholder.com/80", ownerName = "Cliente";
                if (data.userId) {
                  const uSnap = await getDoc(doc(db, "users", data.userId));
                  if (uSnap.exists()) ownerName = uSnap.data().name;
                }
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
              const chatsWithData = await Promise.all(snap.docs.map(async (docRef) => {
                const chatData = docRef.data();
                let petImg = "https://via.placeholder.com/45";
                if (chatData.petId) {
                  const pSnap = await getDoc(doc(db, "pets", chatData.petId));
                  if (pSnap.exists()) petImg = pSnap.data().imageUrl;
                }
                return { id: docRef.id, ...chatData, petImg };
              }));
              setRecentChats(chatsWithData);
            });
          }
        } catch (error) {
          console.error("Erro:", error);
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

  const realizadas = appointments.filter(a => a.status === 'confirmado' && parseDate(a.date) <= new Date().getTime());

  if (loading) return <div className="loading-screen">Petify loading...</div>;

  return (
    <div className="petify-container">
      <header className="petify-header">
        <div className="logo">Petify</div>
        <div className="search-bar"><input type="text" placeholder="Search..." /></div>
      </header>
      <main className="petify-main">
        {/* Sidebar: Medical Consultation */}
        <aside className="medical-sidebar">
          <h3>Medical Consultation</h3>
          <div className="sidebar-list">
            {appointments.slice(0, 10).map(app => (
              <div key={app.id} className="sidebar-card">
                <img src={app.petImg} alt="pet" />
                <div className="card-txt">
                  <strong>{app.reason || "Vactination"}</strong>
                  <p>Pet: {app.petName}</p>
                  <span className={`urgency-tag ${app.urgency?.toLowerCase()}`}>Urgency: {app.urgency || "média"}</span>
                  <span className="sidebar-date">{formatDateTime(app.date)}</span>
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
              {appointments.filter(a => a.status === 'pendente').map(app => (
                <div key={app.id} className="pending-card">
                  <img src={app.petImg} alt="pet" className="pet-thumb" />
                  <div className="pending-info">
                    <p>pet: <strong>{app.petName}</strong></p>
                    <p>urgency: <strong className={`urgency-text ${app.urgency?.toLowerCase()}`}>{app.urgency || "média"}</strong></p>
                    <p>data: <strong>{formatDateTime(app.date)}</strong></p> 
                    <div className="pending-btns">
                      <button className="accept" onClick={() => handleStatusUpdate(app.id, 'confirmado')}>Accept</button>
                      <button className="refuse" onClick={() => handleStatusUpdate(app.id, 'recusado')}>Refuse</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-section">
            <h3>Chat</h3>
            <div className="vertical-scroll">
              {recentChats.map(chat => (
                <div key={chat.id} className="chat-item">
                  <img src={chat.petImg} alt="pet" />
                  <div className="chat-body">
                    <div className="chat-top">
                      <strong>{chat.userName}</strong>
                      <span className="chat-date">{formatDateTime(chat.updatedAt)}</span>
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