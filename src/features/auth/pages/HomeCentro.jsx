import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase'; // <--- Confirma se este caminho está certo para o teu projeto
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import './HomeCentro.css';

// Import da Imagem do Menu (Confirma o nome do ficheiro!)
import menuIcon from '../../../assets/images/Hamburger_menu.png'; 

const HomeCentro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // ESTADO DO MENU (Para abrir e fechar)
  const [menuOpen, setMenuOpen] = useState(false);

  // Estados dos Dados
  const [stats, setStats] = useState({ totalPets: 0, adoptions: 0, pending: 0, urgent: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [petsInCenter, setPetsInCenter] = useState([]);

  // Função para buscar dados ao Firebase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar Animais
      const petsRef = collection(db, "pets");
      const petsSnapshot = await getDocs(petsRef);
      
      let total = 0;
      let sickCount = 0;
      let availablePets = [];

      petsSnapshot.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.status === 'sick' || data.status === 'medical') sickCount++;
        // Mostrar disponíveis ou doentes na lista de baixo
        if (data.status === 'available' || data.status === 'sick') {
          availablePets.push({ id: doc.id, ...data });
        }
      });

      // 2. Buscar Pedidos de Adoção
      const reqRef = collection(db, "adoption_requests");
      const reqSnapshot = await getDocs(reqRef); 
      
      let pending = [];
      let history = [];
      let acceptedCount = 0;

      reqSnapshot.forEach(doc => {
        const data = doc.data();
        const item = { id: doc.id, ...data };
        
        if (data.status === 'pending') {
          pending.push(item);
        } else {
          history.push(item);
          if (data.status === 'accepted' || data.status === 'approved') acceptedCount++;
        }
      });

      setStats({
        totalPets: total,
        adoptions: acceptedCount,
        pending: pending.length,
        urgent: sickCount
      });
      setPendingRequests(pending);
      setHistoryRequests(history);
      setPetsInCenter(availablePets);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FUNÇÕES DE AÇÃO ---

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "adoption_requests", id), {
        status: newStatus
      });
      alert(`Candidatura ${newStatus === 'accepted' ? 'Aceite' : 'Recusada'}!`);
      fetchData(); 
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao atualizar.");
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  // Função auxiliar para fechar o menu ao navegar
  const handleNavigate = (path) => {
    setMenuOpen(false); // Fecha o menu
    if (path) navigate(path);
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dash-header">
        <h1 className="logo-text">Petify <span className="sub-logo">Center Admin</span></h1>
        
        <div className="header-actions">
          <input type="text" placeholder="Search..." className="search-bar" />
          
          {/* MENU HAMBÚRGUER */}
          <div className="menu-container">
            <img 
              src={menuIcon} 
              alt="Menu" 
              className="hamburger-icon" 
              onClick={() => setMenuOpen(!menuOpen)} // <--- AÇÃO DE ABRIR/FECHAR
            />
            
            {menuOpen && (
              <div className="dropdown-menu">
                <div className="menu-item" onClick={() => handleNavigate('/home-centro')}>Home</div>
                <div className="menu-item" onClick={() => handleNavigate(null)}>Pets</div>
                <div className="menu-item" onClick={() => alert("Settings em breve...")}>Settings</div>
                <div className="menu-item logout" onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dash-content">
        
        {/* COLUNA ESQUERDA */}
        <aside className="left-panel">
          <h3>Adoption Requests</h3>
          <div className="filter-box"><input placeholder="Filter..." /></div>
          
          <div className="vertical-scroll-list">
            {historyRequests.map(req => (
              <div key={req.id} className="request-card-small">
                <div className="card-header-row">
                  <img src={req.petImageUrl || "https://placehold.co/50"} alt="pet" className="avatar-small" />
                  <div className={`status-dot ${req.status === 'accepted' ? 'green' : 'red'}`}></div>
                </div>
                <p><strong>Pet:</strong> {req.petName}</p>
                <p><strong>User:</strong> {req.formData?.fullName || "User"}</p>
                <p className="date-text">Status: {req.status}</p>
              </div>
            ))}
            {historyRequests.length === 0 && <p className="empty-msg">Sem histórico.</p>}
          </div>
        </aside>

        {/* ÁREA PRINCIPAL */}
        <main className="main-panel">
          
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card"><h2>{stats.totalPets}</h2><p>Total Pets</p></div>
            <div className="kpi-card"><h2>{stats.adoptions}</h2><p>Adoptions</p></div>
            <div className="kpi-card"><h2>{stats.pending}</h2><p>Pending</p></div>
            <div className="kpi-card warning"><h2>{stats.urgent}</h2><p>Urgent Care</p></div>
          </div>

          {/* PENDING REQUESTS */}
          <section className="section-block">
            <h3>Pending Requests</h3>
            <div className="horizontal-scroll-list">
              {pendingRequests.map(req => (
                <div key={req.id} className="pending-card">
                  <img src={req.petImageUrl || "https://placehold.co/80"} alt="pet" className="pet-img-medium" />
                  <div className="pending-info">
                    <h4>Request for: {req.petName}</h4>
                    <p><strong>Candidate:</strong> {req.formData?.fullName || "Sem Nome"}</p>
                    <p className="motivation-text">"{req.motivation || req.description || "Sem descrição"}"</p>
                    <div className="action-buttons">
                      <button className="btn-accept" onClick={() => handleUpdateStatus(req.id, 'accepted')}>Accept</button>
                      <button className="btn-refuse" onClick={() => handleUpdateStatus(req.id, 'rejected')}>Refuse</button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && <p className="empty-msg">Tudo limpo! Sem pedidos pendentes.</p>}
            </div>
          </section>

          {/* PETS IN CENTER */}
          <section className="section-block">
            <div className="section-header">
                <h3>Pets in Center</h3>
                {/* BOTÃO ADD PET - CONFIRMA QUE ESTÁ ASSIM 👇 */}
                <button className="btn-add-pet" onClick={() => navigate('/add-pet')}>+ Add Pet</button>
            </div>
            
            <div className="pets-list-container">
              {petsInCenter.map(pet => (
                <div key={pet.id} className="pet-row">
                  <img src={pet.imageUrl || "https://placehold.co/40"} alt="pet" className="avatar-tiny" />
                  <div className="pet-details">
                    <span className="pet-name">{pet.name} ({pet.species})</span>
                    <span className="pet-sub">Age: {pet.age} | Microchip: {pet.microchip || "N/A"}</span>
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