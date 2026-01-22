import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase';
import { 
  collection, getDocs, updateDoc, doc, getDoc, addDoc, serverTimestamp 
} from 'firebase/firestore';
import './HomeCentro.css';

import menuIcon from '../../../assets/images/Hamburger_menu.png';

const HomeCentro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [stats, setStats] = useState({ totalPets: 0, adoptions: 0, pending: 0, last30Days: 0, avgTime: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [interviewRequests, setInterviewRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [petsInCenter, setPetsInCenter] = useState([]);
  const [interviewDates, setInterviewDates] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setLoading(false);
        return;
      }

      let targetCenterId = currentUser.uid;

      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.clinicId && userData.clinicId.trim() !== "") {
          targetCenterId = userData.clinicId;
        }
      }

      const petsRef = collection(db, "pets");
      const petsSnapshot = await getDocs(petsRef);

      let total = 0;
      let sickCount = 0;
      let availablePets = [];

      petsSnapshot.forEach(doc => {
        const data = doc.data();
        const petCenterId = data.clinicId || data.adoptionCenterId || data.vcId;

        if (petCenterId === targetCenterId && data.status !== 'adopted') {
          total++;
          if (data.status === 'sick' || data.status === 'medical') sickCount++;
          availablePets.push({ id: doc.id, ...data });
        }
      });

      const reqRef = collection(db, "adoption_requests");
      const reqSnapshot = await getDocs(reqRef);

      let pending = [];
      let interviews = [];
      let history = [];
      let acceptedCount = 0;
      
      let adoptions30Days = 0;
      let totalAdoptionDays = 0;
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      reqSnapshot.forEach(doc => {
        const data = doc.data();
        const item = { id: doc.id, ...data };
        const requestCenterId = data.adoptionCenterId || data.vcId;

        if (requestCenterId !== targetCenterId) return;

        const reqStatus = (data.requestStatus || "").toLowerCase().trim();
        const finalStatus = (data.status || "").toLowerCase().trim();

        if (finalStatus === 'accepted' || finalStatus === 'rejected' || finalStatus === 'approved') {
          history.push(item);
          
          if (finalStatus === 'accepted' || finalStatus === 'approved') {
            acceptedCount++;

            const adoptionDate = data.timestamp?.toDate ? data.timestamp.toDate() : null;
            if (adoptionDate && adoptionDate >= thirtyDaysAgo) {
              adoptions30Days++;
            }

            if (adoptionDate) {
              const diffTime = Math.abs(now - adoptionDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              totalAdoptionDays += diffDays;
            }
          }
        } else {
          if (reqStatus === 'pendente' || reqStatus === 'pending') {
            pending.push(item);
          } else if (reqStatus === 'interview' || reqStatus === 'entrevista' || reqStatus === 'interview_scheduled') {
            interviews.push(item);
          }
        }
      });

      const averageTime = acceptedCount > 0 ? Math.round(totalAdoptionDays / acceptedCount) : 0;

      setStats({
        totalPets: total,
        adoptions: acceptedCount,
        pending: pending.length + interviews.length,
        last30Days: adoptions30Days,
        avgTime: averageTime
      });

      setPendingRequests(pending);
      setInterviewRequests(interviews);
      setHistoryRequests(history);
      setPetsInCenter(availablePets);

    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const sendNotification = async (userId, title, body) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, "users", userId, "notifications"), {
        title: title,
        body: body,
        read: false,
        type: "adoption_update",
        date: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
    }
  };

  const handleScheduleInterview = async (reqId) => {
    const rawDate = interviewDates[reqId];
    if (!rawDate) { alert("Selecione uma data e hora."); return; }

    try {
      const formattedDate = rawDate.replace('T', ' ');
      const requestItem = pendingRequests.find(r => r.id === reqId);

      await updateDoc(doc(db, "adoption_requests", reqId), {
        requestStatus: 'interview',
        interviewDate: formattedDate,
        status: 'interview_scheduled'
      });

      const targetUserId = requestItem?.userId || requestItem?.formData?.userId;
      if (targetUserId) {
        await sendNotification(
          targetUserId,
          "Entrevista Agendada! 📅",
          `O centro agendou uma entrevista consigo para: ${formattedDate}.`
        );
      }

      alert("Entrevista marcada e utilizador notificado!");
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleFinalDecision = async (req, decision) => {
    if (!window.confirm(decision === 'accepted' ? "Aceitar esta adoção?" : "Recusar este pedido?")) return;

    try {
      await updateDoc(doc(db, "adoption_requests", req.id), { 
        status: decision, 
        requestStatus: 'concluido' 
      });

      if (decision === 'accepted' && req.petId) {
        const newOwnerId = req.userId || req.formData?.uid || req.formData?.userId || "adopted_unknown";
        await updateDoc(doc(db, "pets", req.petId), { 
          status: 'adopted', 
          ownerId: newOwnerId, 
          active: "false",
          adoptionDate: serverTimestamp()
        });
      }

      const notifTitle = decision === 'accepted' ? "Parabéns! Adoção Aceite 🎉" : "Atualização do Pedido";
      const notifBody = decision === 'accepted'
        ? `O seu pedido de adoção para ${req.petName} foi aceite! O centro entrará em contacto para a entrega.`
        : `O seu pedido de adoção para ${req.petName} não foi aceite neste momento.`;

      const targetUserId = req.userId || req.formData?.userId;
      if (targetUserId) {
        await sendNotification(targetUserId, notifTitle, notifBody);
      }

      alert("Decisão registada com sucesso!");
      fetchData();
    } catch (error) { console.error(error); }
  };

  const onDateChange = (id, value) => setInterviewDates(prev => ({ ...prev, [id]: value }));

  const isInterviewPassed = (dateString) => {
    if (!dateString) return false;
    const interviewDate = new Date(dateString.replace(' ', 'T'));
    const now = new Date();
    return now >= interviewDate; 
  };

  const handleLogout = () => { auth.signOut(); navigate('/login'); };
  const handleNavigate = (path) => { setMenuOpen(false); if (path) navigate(path); };

  const toggleMenu = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="dashboard-container" onClick={() => setMenuOpen(false)}>
      <header className="dash-header">
        <h1 className="logo-text">Petify <span className="sub-logo">Center Admin</span></h1>
        <div className="header-actions">
          <input type="text" placeholder="Search..." className="search-bar" />

          <div className="menu-container" onClick={toggleMenu}>
            <img src={menuIcon} alt="Menu" className="hamburger-icon" />

            {menuOpen && (
              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="menu-item" onClick={() => handleNavigate('/home-centro')}>Home</div>
                <div className="menu-item" onClick={() => handleNavigate('/pet-list')}>Gerir Animais</div>
                <div className="menu-item" onClick={() => handleNavigate('/settings')}>Definições</div>
                <div className="menu-item logout" onClick={handleLogout}>Sair</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dash-content">
        <aside className="left-panel">
          <h3>Histórico Recente</h3>
          <div className="vertical-scroll-list">
            {historyRequests.map(req => (
              <div key={req.id} className="request-card-small">
                <div className="card-header-row">
                  <img src={req.petImageUrl || "https://placehold.co/50"} alt="pet" className="avatar-small" />
                  <div className={`status-dot ${req.status === 'accepted' ? 'green' : 'red'}`}></div>
                </div>
                <p><strong>Pet:</strong> {req.petName}</p>
                <p><strong>User:</strong> {req.formData?.fullName || "Anónimo"}</p>
                <p className="date-text">Status: {req.status}</p>
              </div>
            ))}
            {historyRequests.length === 0 && <p className="empty-msg">Sem histórico.</p>}
          </div>
        </aside>

        <main className="main-panel">
          <div className="kpi-grid">
            <div className="kpi-card"><h2>{stats.totalPets}</h2><p>Total Pets</p></div>
            <div className="kpi-card"><h2>{stats.adoptions}</h2><p>Adoptions</p></div>
            <div className="kpi-card"><h2>{stats.last30Days}</h2><p>Últimos 30 Dias</p></div>
            <div className="kpi-card"><h2>{stats.avgTime}d</h2><p>Tempo Médio</p></div>
          </div>

          <section className="section-block">
            <h3>Novos Pedidos (Agendar Entrevista)</h3>
            <div className="horizontal-scroll-list">
              {pendingRequests.map(req => (
                <div key={req.id} className="pending-card">
                  <img src={req.petImageUrl || "https://placehold.co/80"} alt="pet" className="pet-img-medium" />
                  <div className="pending-info">
                    <h4>{req.petName}</h4>
                    <p className="candidate-name">Candidato: {req.formData?.fullName}</p>
                    <p className="motivation-text">Email: {req.formData?.email}</p>
                    
                    <div className="interview-scheduler">
                      <label style={{fontSize:'12px', fontWeight:'bold'}}>Data e Hora:</label>
                      <div className="date-action-row">
                        <input 
                          type="datetime-local" 
                          className="date-input" 
                          onChange={(e) => onDateChange(req.id, e.target.value)} 
                        />
                        <button className="btn-schedule" onClick={() => handleScheduleInterview(req.id)}>Marcar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && <p className="empty-msg">Sem novos pedidos.</p>}
            </div>
          </section>

          <section className="section-block">
            <h3>Entrevistas Agendadas</h3>
            <div className="horizontal-scroll-list">
              {interviewRequests.map(req => {
                const datePassed = isInterviewPassed(req.interviewDate);
                
                return (
                  <div key={req.id} className="pending-card interview-card-border">
                    <img src={req.petImageUrl || "https://placehold.co/80"} alt="pet" className="pet-img-medium" />
                    <div className="pending-info">
                      <h4>{req.petName}</h4>
                      <p className="candidate-name">User: {req.formData?.fullName}</p>
                      
                      {!datePassed ? (
                        <div className="interview-status">
                          <p className="status-label scheduled">Agendada</p>
                          <p className="interview-date-display">📅 {req.interviewDate}</p>
                          <p className="wait-text" style={{fontSize:'11px', color:'#aaa'}}>A aguardar a data...</p>
                        </div>
                      ) : (
                        <div className="final-decision-box">
                          <p className="status-label action">Decisão Necessária</p>
                          <p className="info-text">Data ({req.interviewDate}) atingida.</p>
                          <div className="action-buttons">
                            <button className="btn-accept" onClick={() => handleFinalDecision(req, 'accepted')}>Aceitar</button>
                            <button className="btn-refuse" onClick={() => handleFinalDecision(req, 'rejected')}>Recusar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {interviewRequests.length === 0 && <p className="empty-msg">Sem entrevistas marcadas.</p>}
            </div>
          </section>

          <section className="section-block">
            <div className="section-header">
              <h3>Animais no Centro</h3>
              <button className="btn-add-pet" onClick={() => navigate('/add-pet')}>+ Adicionar</button>
            </div>
            <div className="pets-list-container">
              {petsInCenter.map(pet => (
                <div key={pet.id} className="pet-row">
                  <img
                    src={
                      (pet.images && pet.images.length > 0 ? pet.images[0] : null) || 
                      pet.imageUrl || 
                      "https://placehold.co/40"
                    }
                    alt="pet"
                    className="avatar-tiny"
                  />
                  <div className="pet-details">
                    <span className="pet-name">{pet.name} ({pet.species})</span>
                    <span className="pet-sub">Idade: {pet.age} | Chip: {pet.microchip || "N/A"}</span>
                  </div>
                  <div className="pet-status">
                    {pet.status === 'sick' || pet.status === 'medical' 
                      ? <span className="tag red">Doente</span> 
                      : <span className="tag green">Disponível</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomeCentro;