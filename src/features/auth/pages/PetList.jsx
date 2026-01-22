import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import './PetList.css';
import menuIcon from '../../../assets/images/Hamburger_menu.png';

const PetList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const petsRef = collection(db, "pets");
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

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

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
    <div className="pets-list-container" onClick={() => setMenuOpen(false)}>

      <header className="dash-header" style={{ zIndex: 1000, overflow: 'visible', position: 'relative' }}>
        <h1 className="logo-text">Petify <span className="sub-logo">Center Admin</span></h1>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="text" placeholder="Search..." className="search-bar" />

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

      <div className="pets-content-area" style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="page-title">Pets in Center</h2>

        <div className="pets-stack-list">
          {pets.map(pet => (
            <div key={pet.id} className="pet-stack-item" onClick={() => handlePetClick(pet)}>
              <img
                src={pet.imageUrl || (pet.images && pet.images.length > 0 ? pet.images[0] : "https://placehold.co/50")}
                alt="pet"
                className="pet-thumb-small"
              />

              <div className="pet-info-container">
                <div className="pet-main-line">
                  <span className="pet-name">{pet.name}</span>
                  <span className="pet-species"> ({pet.species || "?"} - {pet.breed || "raça desconhecida"})</span>
                </div>
                <div className="pet-sub-line">
                  <span>age: {pet.age} | microchip: {pet.microchip || "N/A"} |</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className={`status-btn ${pet.status === 'available' ? 'btn-green' : 'btn-red'}`}
                  onClick={(e) => toggleStatus(e, pet)}
                >
                  {pet.status === 'available' ? 'AVAILABLE' : 'UNAVAILABLE'}
                </button>
                
                {/* Botão EDIT rápido na lista */}
                <button 
                  className="status-btn"
                  style={{ backgroundColor: '#555' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/edit-pet/${pet.id}`);
                  }}
                >
                  EDIT
                </button>
              </div>
            </div>
          ))}
          {pets.length === 0 && !loading && <p className="no-pets-text">Sem animais no centro.</p>}
        </div>
        <div className="big-empty-space"></div>
      </div>

      {selectedPet && (
        <div className="modal-overlay" onClick={closePopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closePopup}>X</button>
            <div className="modal-body">
              <img
                src={selectedPet.imageUrl || (selectedPet.images && selectedPet.images.length > 0 ? selectedPet.images[0] : "https://placehold.co/300")}
                alt="Pet"
                className="modal-image"
              />
              <div className="modal-details">
                <h2>{selectedPet.name}</h2>
                <p><strong>Info:</strong> {selectedPet.species}, {selectedPet.breed}, {selectedPet.age} anos.</p>
                <p><strong>Peso:</strong> {selectedPet.weight} kg</p>
                <p><strong>Sexo:</strong> {selectedPet.sex}</p>
                <p><strong>Microchip:</strong> {selectedPet.microchip}</p>
                <p><strong>Descrição:</strong> {selectedPet.description || "N/A"}</p>
                
                <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="action-btn-toggle" onClick={(e) => toggleStatus(e, selectedPet)}>
                    {selectedPet.status === 'available' ? 'Remover da Adoção' : 'Colocar para Adoção'}
                  </button>

                  {/* Botão para navegar até a página EditPet */}
                  <button 
                    className="action-btn-toggle" 
                    style={{ backgroundColor: '#FF9800' }} 
                    onClick={() => navigate(`/edit-pet/${selectedPet.id}`)}
                  >
                    Editar Informações
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