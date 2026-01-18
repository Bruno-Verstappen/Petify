import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase';
import { collection, getDocs, updateDoc, doc, getDoc, addDoc } from 'firebase/firestore'; // <--- ADICIONEI addDoc
import './HomeCentro.css';

import menuIcon from '../../../assets/images/Hamburger_menu.png';

const HomeCentro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Estados dos Dados
  const [stats, setStats] = useState({ totalPets: 0, adoptions: 0, pending: 0, urgent: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [interviewRequests, setInterviewRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [petsInCenter, setPetsInCenter] = useState([]);
  const [interviewDates, setInterviewDates] = useState({});

  // --- BUSCAR DADOS ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setLoading(false);
        return;
      }

      // 1. DESCOBRIR QUAL ID DE CENTRO USAR
      let targetCenterId = currentUser.uid;

      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.clinicId && userData.clinicId.trim() !== "") {
          targetCenterId = userData.clinicId;
        }
      }

      // 2. BUSCAR ANIMAIS
      const petsRef = collection(db, "pets");
      const petsSnapshot = await getDocs(petsRef);

      let total = 0;
      let sickCount = 0;
      let availablePets = [];

      petsSnapshot.forEach(doc => {
        const data = doc.data();
        const petCenterId = data.adoptionCenterId || data.vcId;

        if (petCenterId === targetCenterId && (!data.ownerId || data.ownerId === "") && data.status !== 'adopted') {
          total++;
          if (data.status === 'sick' || data.status === 'medical') sickCount++;
          availablePets.push({ id: doc.id, ...data });
        }
      });

      // 3. BUSCAR PEDIDOS DE ADOÇÃO
      const reqRef = collection(db, "adoption_requests");
      const reqSnapshot = await getDocs(reqRef);

      let pending = [];
      let interviews = [];
      let history = [];
      let acceptedCount = 0;

      reqSnapshot.forEach(doc => {
        const data = doc.data();
        const item = { id: doc.id, ...data };
        const requestCenterId = data.adoptionCenterId || data.vcId;

        if (requestCenterId !== targetCenterId) return;

        const reqStatus = (data.requestStatus || "").toLowerCase().trim();
        const finalStatus = (data.status || "").toLowerCase().trim();

        if (finalStatus === 'accepted' || finalStatus === 'rejected' || finalStatus === 'approved') {
          history.push(item);
          if (finalStatus === 'accepted' || finalStatus === 'approved') acceptedCount++;
        } else {
          if (reqStatus === 'pendente' || reqStatus === 'pending') {
            pending.push(item);
          } else if (reqStatus === 'interview' || reqStatus === 'entrevista') {
            interviews.push(item);
          }
        }
      });

      setStats({
        totalPets: total,
        adoptions: acceptedCount,
        pending: pending.length + interviews.length,
        urgent: sickCount
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

  // --- NOVA FUNÇÃO: ENVIAR NOTIFICAÇÃO ---
  const sendNotification = async (userId, title, body) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, "notifications"), {
        userId: userId,
        title: title,
        body: body,
        read: false,
        timestamp: new Date()
      });
      console.log("Notificação enviada para:", userId);
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
    }
  };

  // --- AÇÕES ---

  // 1. MARCAR ENTREVISTA
  const handleScheduleInterview = async (reqId) => {
    const date = interviewDates[reqId];
    if (!date) { alert("Selecione uma data."); return; }

    try {
      // Encontrar o pedido atual para obter o userId
      const requestItem = pendingRequests.find(r => r.id === reqId);

      await updateDoc(doc(db, "adoption_requests", reqId), {
        requestStatus: 'interview',
        interviewDate: date
      });

      // Enviar Notificação
      if (requestItem && requestItem.userId) {
        await sendNotification(
          requestItem.userId,
          "Entrevista Marcada! 📅",
          `O centro agendou uma entrevista consigo para o dia ${date}.`
        );
      }

      alert("Entrevista marcada e utilizador notificado!");
      fetchData();
    } catch (error) { console.error(error); }
  };

  // 2. DECISÃO FINAL
  const handleFinalDecision = async (req, decision) => {
    if (!window.confirm(decision === 'accepted' ? "Aceitar?" : "Recusar?")) return;

    try {
      await updateDoc(doc(db, "adoption_requests", req.id), { status: decision, requestStatus: 'concluido' });

      // Se aceite, atualizar o animal
      if (decision === 'accepted' && req.petId) {
        const newOwnerId = req.userId || req.formData?.uid || "adopted_unknown";
        await updateDoc(doc(db, "pets", req.petId), { status: 'adopted', ownerId: newOwnerId, active: "false" });
      }

      // Enviar Notificação
      const notifTitle = decision === 'accepted' ? "Parabéns! Adoção Aceite 🎉" : "Atualização do Pedido";
      const notifBody = decision === 'accepted'
        ? `O seu pedido de adoção para ${req.petName} foi aceite! O centro entrará em contacto.`
        : `Infelizmente, o seu pedido de adoção para ${req.petName} não foi aceite neste momento.`;

      if (req.userId) {
        await sendNotification(req.userId, notifTitle, notifBody);
      }

      alert("Sucesso! Utilizador notificado.");
      fetchData();
    } catch (error) { console.error(error); }
  };

  const onDateChange = (id, value) => setInterviewDates(prev => ({ ...prev, [id]: value }));

  const isInterviewPassed = (dateString) => {
    if (!dateString) return false;
    const interviewDate = new Date(dateString);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return today > interviewDate;
  };

  // NAVEGAÇÃO
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
                <div className="menu-item" onClick={() => handleNavigate('/pet-list')}>Pets</div>
                <div className="menu-item" onClick={() => handleNavigate('/settings')}>Settings</div>
                <div className="menu-item logout" onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dash-content">
        <aside className="left-panel">
          <h3>Adoption Requests</h3>
          <div className="vertical-scroll-list">
            {historyRequests.map(req => (
              <div key={req.id} className="request-card-small">
                <div className="card-header-row">
                  <img src={req.petImageUrl || "https://placehold.co/50"} alt="pet" className="avatar-small" />
                  <div className={`status-dot ${req.status === 'accepted' ? 'green' : 'red'}`}></div>
                </div>
                <p><strong>Pet:</strong> {req.petName}</p>
                <p><strong>User:</strong> {req.formData?.fullName}</p>
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
            <div className="kpi-card"><h2>{stats.pending}</h2><p>Process</p></div>
            <div className="kpi-card warning"><h2>{stats.urgent}</h2><p>Urgent Care</p></div>
          </div>

          <section className="section-block">
            <h3>Pending Requests</h3>
            <div className="horizontal-scroll-list">
              {pendingRequests.map(req => (
                <div key={req.id} className="pending-card">
                  <img src={req.petImageUrl || "https://placehold.co/80"} alt="pet" className="pet-img-medium" />
                  <div className="pending-info">
                    <h4>{req.petName}</h4>
                    <p className="candidate-name">User: {req.formData?.fullName}</p>
                    <p className="motivation-text">Status: {req.requestStatus}</p>
                    <div className="interview-scheduler">
                      <label>Marcar Entrevista:</label>
                      <div className="date-action-row">
                        <input type="date" className="date-input" onChange={(e) => onDateChange(req.id, e.target.value)} />
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
            <h3>Scheduled Interviews</h3>
            <div className="horizontal-scroll-list">
              {interviewRequests.map(req => {
                const canDecide = isInterviewPassed(req.interviewDate);
                return (
                  <div key={req.id} className="pending-card interview-card-border">
                    <img src={req.petImageUrl || "https://placehold.co/80"} alt="pet" className="pet-img-medium" />
                    <div className="pending-info">
                      <h4>{req.petName}</h4>
                      <p className="candidate-name">User: {req.formData?.fullName}</p>
                      {!canDecide ? (
                        <div className="interview-status">
                          <p className="status-label scheduled">Agendada</p>
                          <p className="interview-date-display">📅 {req.interviewDate}</p>
                          <p className="wait-text">A aguardar data...</p>
                        </div>
                      ) : (
                        <div className="final-decision-box">
                          <p className="status-label action">Decisão Necessária</p>
                          <p className="info-text">Data ({req.interviewDate}) passou.</p>
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
              <h3>Pets in Center</h3>
              <button className="btn-add-pet" onClick={() => navigate('/add-pet')}>+ Add Pet</button>
            </div>
            <div className="pets-list-container">
              {petsInCenter.map(pet => (
                <div key={pet.id} className="pet-row">
                  <img
                    // LÓGICA NOVA: Tenta ler o antigo OU o primeiro da lista nova
                    src={pet.imageUrl || (pet.images && pet.images.length > 0 ? pet.images[0] : "https://placehold.co/40")}
                    alt="pet"
                    className="avatar-tiny"
                  />
                  <div className="pet-details">
                    <span className="pet-name">{pet.name} ({pet.species})</span>
                    <span className="pet-sub">Age: {pet.age} | Chip: {pet.microchip || "N/A"}</span>
                  </div>
                  <div className="pet-status">
                    {pet.status === 'sick' ? <span className="tag red">Medical</span> : <span className="tag green">Available</span>}
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