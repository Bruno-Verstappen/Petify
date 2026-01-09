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

  // --- LÓGICA DE TRATAMENTO DE DATAS ---
  const parseDate = (dateField) => {
    if (!dateField) return 0;
    if (dateField.toMillis) return dateField.toMillis();
    const dateStr = String(dateField).toLowerCase();

    if (dateStr.includes('-')) return new Date(dateStr.replace(/-/g, "/")).getTime();
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
            const data = userDocSnap.data();
            const myClinicId = data.clinicId;
            setClinicName(data.name || "Clínica");

            unsubscribeApp = onSnapshot(query(collection(db, "appointments"), where("clinicId", "==", myClinicId)), (snap) => {
              setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            unsubscribeChats = onSnapshot(query(collection(db, "chats"), where("clinicId", "==", myClinicId), orderBy("updatedAt", "desc")), (snap) => {
              setRecentChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });
          }
        } catch (e) { console.error(e); } finally { setLoading(false); }
      }
    });
    return () => { unsubscribeAuth(); unsubscribeApp(); unsubscribeChats(); };
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try { await updateDoc(doc(db, "appointments", id), { status: newStatus }); } catch (e) { console.error(e); }
  };

  // --- CÁLCULOS ---
  const agoraMs = new Date().getTime();
  const realizadas = appointments.filter(a => a.status === 'confirmado' && parseDate(a.date) <= agoraMs);
  const numPets = [...new Set(realizadas.map(a => a.petId))].length;
  const numClientes = [...new Set(realizadas.map(a => a.userId))].length;
  const totalReceita = realizadas.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const pendentes = appointments.filter(a => a.status === 'pendente');

  if (loading) return <div className="loading">Petify is loading...</div>;

  return (
    <div className="petify-container">
      {/* BARRA DE TOPO */}
      <header className="petify-header">
        <div className="logo">Petify</div>
        <div className="search-bar">
          <input type="text" placeholder="" />
          <img src="/icons/Search_tools.png" alt="Search" />
        </div>
        <div className="header-icons">
          <img src="/icons/Marcar_lido.png" alt="Messages" />
          <img src="/icons/Notifications.png" alt="Alerts" />
          <img src="/icons/Hamburger_menu.png" alt="Menu" />
        </div>
      </header>

      <main className="petify-main">
        {/* COLUNA ESQUERDA - MEDICAL CONSULTATION */}
        <aside className="medical-sidebar">
          <h3>Medical Consultation</h3>
          <div className="search-filter">
            <input type="text" /><img src="/icons/Search_tools.png" alt="filter" />
          </div>
          <div className="consultation-list">
             {/* Exemplo de item lateral conforme print */}
             {appointments.slice(0, 3).map(app => (
               <div key={app.id} className="sidebar-card">
                  <img src={app.petImage || "https://via.placeholder.com/50"} alt="pet" />
                  <div className="card-info">
                    <h4>Vactination</h4>
                    <p>"{app.reason || "Consulta de rotina..."}"</p>
                    <div className="card-footer">
                      <span>{app.date?.split(' ')[0]}</span>
                      <span>{app.date?.split(' ')[6]?.substring(0, 5)}</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </aside>

        {/* CONTEÚDO CENTRAL */}
        <section className="dashboard-content">
          <h2>Good morning ({clinicName})</h2>
          
          {/* ESTATÍSTICAS */}
          <div className="stats-grid">
            <div className="stat-card"><h1>{numClientes}</h1><span>new clients</span></div>
            <div className="stat-card"><h1>{numPets}</h1><span>pets tratados</span></div>
            <div className="stat-card"><h1>{realizadas.length}</h1><span>consultas dadas</span></div>
            <div className="stat-card"><h1>{totalReceita.toFixed(0)}€</h1><span>faturamento</span></div>
          </div>

          {/* PENDING CONSULTATION - SCROLL HORIZONTAL */}
          <div className="pending-section">
            <h3>Pending Consultation</h3>
            <div className="horizontal-scroll">
              {pendentes.map(app => (
                <div key={app.id} className="pending-card">
                  <img src={app.petImage || "https://via.placeholder.com/80"} alt="pet" />
                  <div className="pending-info">
                    <p className="type">Vactination</p>
                    <p className="date-time">{app.date?.split(' ')[0]} {app.date?.split(' ')[6]?.substring(0,5)}</p>
                    <p>pet name: <strong>{app.petName || "Bobi"}</strong></p>
                    <p>owner: <strong>{app.userName || "Paulo Santos"}</strong></p>
                    <div className="pending-actions">
                      <button className="btn-accept" onClick={() => handleStatusUpdate(app.id, 'confirmado')}>Accept</button>
                      <button className="btn-refuse" onClick={() => handleStatusUpdate(app.id, 'recusado')}>refuse</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHAT - SCROLL VERTICAL */}
          <div className="chat-section">
            <h3>Chat</h3>
            <div className="vertical-scroll">
              {recentChats.map(chat => (
                <div key={chat.id} className="chat-line">
                  <img src={chat.petImage || "https://via.placeholder.com/40"} alt="pet" />
                  <div className="chat-content">
                    <div className="chat-header">
                      <strong>{chat.petName || "Miau"}</strong>
                      <span className="chat-date">28-12-2026</span>
                    </div>
                    <p><strong>{chat.userName}:</strong> {chat.lastMessage}</p>
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