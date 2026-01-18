import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase'; 
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'; 
import './PetList.css';

// CAMINHO DA IMAGEM
import menuIcon from '../../../assets/images/Hamburger_menu.png'; 

const PetList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  
  // ESTADOS
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const petsRef = collection(db, "pets");
      // Filtra pets sem dono
      const q = query(petsRef, where("ownerId", "==", ""));
      const snapshot = await getDocs(q);
      const petsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPets(petsList);
    } catch (error) {
      console.error("Erro ao buscar pets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { auth.signOut(); navigate('/login'); };

  const handleNavigate = (path) => {
    setMenuOpen(false);
    if (path) navigate(path);
  };

  // --- FUNÇÃO DO MENU ---
  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    setMenuOpen(prev => !prev);
  };

  // --- LÓGICA DO POPUP ---
  const handlePetClick = (pet) => {
    if (!menuOpen) setSelectedPet(pet);
  };

  const closePopup = () => setSelectedPet(null);

  const toggleStatus = async (e, pet) => {
    e.stopPropagation(); 
    const action = pet.status === 'available' ? 'remover da adoção' : 'colocar para adoção';
    if (!window.confirm(`Quer mesmo ${action} o ${pet.name}?`)) return;

    try {
        const newStatus = pet.status === 'available' ? 'not available' : 'available';
        const petRef = doc(db, "pets", pet.id);
        await updateDoc(petRef, { status: newStatus });
        const updatedPets = pets.map(p => p.id === pet.id ? { ...p, status: newStatus } : p);
        setPets(updatedPets);
        if (selectedPet && selectedPet.id === pet.id) setSelectedPet({ ...selectedPet, status: newStatus });
    } catch (error) { console.error("Erro:", error); }
  };

  return (
    // Ao clicar em qualquer parte do fundo, fecha o menu
    <div className="pets-list-container" onClick={() => setMenuOpen(false)}>
      
      {/* HEADER */}
      <header className="dash-header" style={{ zIndex: 1000, overflow: 'visible', position: 'relative' }}>
        <h1 className="logo-text">Petify <span className="sub-logo">Center Admin</span></h1>
        
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="text" placeholder="Search..." className="search-bar" />
          
          {/* --- MENU HAMBÚRGUER (ÁREA DE CLIQUE) --- */}
          <div 
            onClick={toggleMenu}
            style={{ 
                position: 'relative', 
                cursor: 'pointer',
                padding: '5px',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
          >
            <img 
              src={menuIcon} 
              alt="Menu" 
              style={{ width: '35px', height: 'auto', filter: 'invert(1)', display: 'block' }}
            />
            
            {/* --- O MENU DROPDOWN --- */}
            {menuOpen && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                style={{
                    position: 'absolute',
                    top: '100%', 
                    right: 0,
                    marginTop: '10px',
                    backgroundColor: '#222', 
                    border: '1px solid #555',
                    borderRadius: '8px',
                    width: '150px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.8)',
                    zIndex: 9999, 
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
              >
                <div 
                    onClick={() => handleNavigate('/home-centro')}
                    style={{ padding: '12px', color: 'white', borderBottom: '1px solid #444', textAlign: 'center', cursor: 'pointer' }}
                    onMouseOver={(e) => e.target.style.background = '#444'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                    Home
                </div>

                <div 
                    onClick={() => handleNavigate('/pet-list')}
                    style={{ padding: '12px', color: 'white', borderBottom: '1px solid #444', textAlign: 'center', cursor: 'pointer' }}
                    onMouseOver={(e) => e.target.style.background = '#444'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                    Pets
                </div>

                {/* 👇 AQUI ESTAVA O ERRO. AGORA ESTÁ CORRIGIDO: */}
                <div 
                    onClick={() => handleNavigate('/settings')}
                    style={{ padding: '12px', color: 'white', borderBottom: '1px solid #444', textAlign: 'center', cursor: 'pointer' }}
                    onMouseOver={(e) => e.target.style.background = '#444'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                    Settings
                </div>

                <div 
                    onClick={handleLogout}
                    style={{ padding: '12px', color: '#ff6b6b', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' }}
                    onMouseOver={(e) => e.target.style.background = '#444'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                    Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="pets-content-area" style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="page-title">Pets in Center</h2>
        
        <div className="pets-stack-list">
          {pets.map(pet => (
            <div key={pet.id} className="pet-stack-item" onClick={() => handlePetClick(pet)}>
              <img src={pet.imageUrl || "https://placehold.co/50"} alt="pet" className="pet-thumb-small" />
              
              <div className="pet-info-container">
                 <div className="pet-main-line">
                    <span className="pet-name">{pet.name}</span>
                    <span className="pet-species"> ({pet.species || "?"} - {pet.breed || "raça desconhecida"})</span>
                 </div>
                 <div className="pet-sub-line">
                    <span>age: {pet.age} | microchip: {pet.microchip || "N/A"} |</span>
                 </div>
              </div>

              <button 
                className={`status-btn ${pet.status === 'available' ? 'btn-green' : 'btn-red'}`}
                onClick={(e) => toggleStatus(e, pet)}
              >
                {pet.status === 'available' ? 'AVAILABLE' : 'UNAVAILABLE'}
              </button>
            </div>
          ))}
          {pets.length === 0 && !loading && <p className="no-pets-text">Sem animais no centro.</p>}
        </div>
        <div className="big-empty-space"></div>
      </div>

      {/* POPUP */}
      {selectedPet && (
        <div className="modal-overlay" onClick={closePopup}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={closePopup}>X</button>
                <div className="modal-body">
                    <img src={selectedPet.imageUrl || "https://placehold.co/300"} alt="Pet" className="modal-image"/>
                    <div className="modal-details">
                        <h2>{selectedPet.name}</h2>
                        <p><strong>Info:</strong> {selectedPet.species}, {selectedPet.breed}, {selectedPet.age} anos.</p>
                        <p><strong>Peso:</strong> {selectedPet.weight} kg</p>
                        <p><strong>Sexo:</strong> {selectedPet.sex}</p>
                        <p><strong>Microchip:</strong> {selectedPet.microchip}</p>
                        <p><strong>Descrição:</strong> {selectedPet.description || "N/A"}</p>
                        <div className="modal-actions">
                            <button className="action-btn-toggle" onClick={(e) => toggleStatus(e, selectedPet)}>
                                {selectedPet.status === 'available' ? 'Remover da Adoção' : 'Colocar para Adoção'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PetList;