import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase'; 
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import './HomeCentro.css';
import menuIcon from '../../../assets/images/Hamburger_menu.png'; 

const HomeCentro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [stats, setStats] = useState({ totalPets: 0, adoptions: 0, pending: 0, urgent: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [interviewRequests, setInterviewRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [petsInCenter, setPetsInCenter] = useState([]);
  const [interviewDates, setInterviewDates] = useState({});

  const formatDateTime = (dateOnly) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${dateOnly} ${hours}:${minutes}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      const currentCenterId = user.uid;

      const petsSnapshot = await getDocs(collection(db, "pets"));
      let total = 0;
      let sickCount = 0;
      let adoptionsCount = 0;
      let availablePets = [];

      petsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const centerId = data.vcId || data.adoptionCenterId;

        if (centerId === currentCenterId) {
          if (data.status === 'owned' || data.status === 'adopted') {
            adoptionsCount++;
          } else {
            total++;
            if (data.status === 'sick' || data.status === 'medical') sickCount++;
            availablePets.push({ id: docSnap.id, ...data });
          }
        }
      });

      const reqSnapshot = await getDocs(collection(db, "adoption_requests"));
      let pending = [];
      let interviews = [];
      let history = [];

      reqSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const item = { id: docSnap.id, ...data };
        const centerId = data.adoptionCenterId || data.vcId;
        if (centerId !== currentCenterId && centerId !== "") return;

        const rStatus = (data.requestStatus || "").toLowerCase();
        const fStatus = (data.status || "").toLowerCase();

        if (fStatus === 'accepted' || fStatus === 'rejected' || fStatus === 'approved') {
          history.push(item);
        } else if (rStatus === 'interview' || rStatus === 'entrevista' || rStatus === 'agendada') {
          interviews.push(item);
        } else {
          pending.push(item);
        }
      });

      setStats({
        totalPets: total,
        adoptions: adoptionsCount,
        pending: pending.length + interviews.length,
        urgent: sickCount
      });
      
      setPendingRequests(pending);
      setInterviewRequests(interviews);
      setHistoryRequests(history);
      setPetsInCenter(availablePets);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchData();
      else navigate('/login');
    });
    return () => unsubscribe();
  }, []);

  const handleScheduleInterview = async (reqId) => {
    const dateInput = interviewDates[reqId];
    if (!dateInput) { alert("Selecione uma data."); return; }
    const finalFormattedDate = formatDateTime(dateInput);
    try {
      await updateDoc(doc(db, "adoption_requests", reqId), {
        requestStatus: 'interview',
        interviewDate: finalFormattedDate 
      });
      alert("Entrevista marcada para: " + finalFormattedDate);
      fetchData(); 
    } catch (error) { console.error(error); }
  };

  const handleRejectRequest = async (reqId) => {
    if(!window.confirm("Deseja recusar este pedido?")) return;
    try {
      await updateDoc(doc(db, "adoption_requests", reqId), {
        status: 'rejected',
        requestStatus: 'concluido'
      });
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleFinalDecision = async (req, decision) => {
    if(!window.confirm("Confirmar decisão?")) return;
    try {
      await updateDoc(doc(db, "adoption_requests", req.id), {
        status: decision,
        requestStatus: 'concluido'
      });
      if (decision === 'accepted') {
        await updateDoc(doc(db, "pets", req.petId), {
          status: 'owned',
          ownerId: req.userId,
          active: "false"
        });
      }
      fetchData(); 
    } catch (error) { console.error(error); }
  };

  const isInterviewPassed = (dateString) => {
    if (!dateString) return false;
    const interviewDate = new Date(dateString.replace(' ', 'T')); 
    const now = new Date();
    return now >= interviewDate; 
  };

  if (loading) return <div className="loading-screen">Carregando Painel...</div>;

  return (
    /* REMOVIDO: onClick de fecho global para garantir que o menu não fecha sozinho ao abrir */
    <div className="dashboard-container">
      <header className="dash-header">
        <h1 className="logo-text">Petify <span className="sub-logo">Center Admin</span></h1>
        <div className="header-actions">
          <input type="text" placeholder="Search..." className="search-bar" />
          <div className="menu-container">
            <img 
              src={menuIcon} 
              alt="Menu" 
              className="hamburger-icon" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // CRÍTICO: Impede que o clique se perca
                setMenuOpen(!menuOpen);
                console.log("Menu state:", !menuOpen); // Para debug no teu browser
              }} 
            />
            {menuOpen && (
              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="menu-item" onClick={() => { navigate('/home-centro'); setMenuOpen(false); }}>Home</div>
                <div className="menu-item" onClick={() => { navigate('/pet-list'); setMenuOpen(false); }}>Pets</div>
                <div className="menu-item logout" onClick={() => { auth.signOut(); setMenuOpen(false); }}>Logout</div>
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
                <p><strong>User:</strong> {req.formData?.fullName || "Usuário"}</p>
              </div>
            ))}
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
                    <p className="candidate-name">User: {req.formData?.fullName || "Pendente"}</p>
                    <div className="date-action-row">
                      <input type="date" className="date-input" onChange={(e) => setInterviewDates({...interviewDates, [req.id]: e.target.value})} />
                      <button className="btn-schedule" onClick={() => handleScheduleInterview(req.id)}>Marcar</button>
                      <button className="btn-refuse-pending" onClick={() => handleRejectRequest(req.id)}>Recusar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section-block">
            <h3>Scheduled Interviews</h3>
            <div className="horizontal-scroll-list">
              {interviewRequests.map(req => (
                <div key={req.id} className="pending-card interview-card-border">
                  <img src={req.petImageUrl || "https://placehold.co/80"} alt="pet" className="pet-img-medium" />
                  <div className="pending-info">
                    <h4>{req.petName}</h4>
                    <p className="candidate-name">User: {req.formData?.fullName}</p>
                    {!isInterviewPassed(req.interviewDate) ? (
                      <div className="interview-status">
                        <p className="status-label scheduled">Agendada</p>
                        <p className="interview-date-display">📅 {req.interviewDate}</p>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button className="btn-accept" onClick={() => handleFinalDecision(req, 'accepted')}>Aceitar</button>
                        <button className="btn-refuse" onClick={() => handleFinalDecision(req, 'rejected')}>Recusar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
                  <img src={pet.imageUrl || "https://placehold.co/40"} alt="pet" className="avatar-tiny" />
                  <div className="pet-details">
                    <span className="pet-name">{pet.name} ({pet.species})</span>
                    <span className="pet-sub">Age: {pet.age} | Chip: {pet.microchip}</span>
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