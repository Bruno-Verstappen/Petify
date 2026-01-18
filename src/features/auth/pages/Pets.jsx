import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../config/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore';
import Header from "../../../layout/Header"; 
import './Pets.css';

const Pets = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", clientId));
        if (docSnap.exists()) setOwnerName(docSnap.data().name);
      } catch (e) { console.error("Erro ao buscar dono:", e); }
    };

    const q = query(collection(db, "pets"), where("ownerId", "==", clientId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    fetchOwner();
    return () => unsubscribe();
  }, [clientId]);

  const openHistory = (pet, type) => {
    setSelectedPet(pet);
    setActiveModal(type);
    setHistoryData([]);

    let q;
    if (type === 'consultas') {
      q = query(
        collection(db, 'appointments'),
        where("petId", "==", pet.id),
        orderBy("date", "desc")
      );
    } else {
      q = query(
        collection(db, "pets", pet.id, "vaccination_card"),
        orderBy("timestamp", "desc")
      );
    }

    const unsub = onSnapshot(q, (snapshot) => {
      setHistoryData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      setHistoryData([]);
    });

    return unsub;
  };

  return (
    <div className="pets-page-container">
      <Header />
      
      <div className="pets-content-area">
        <div className="pets-header-flex">
          <div className="title-group">
            <h1>pets de {ownerName || 'cliente'}</h1>
            <p className="subtitle-original">Gestão de histórico e dados clínicos</p>
          </div>
          <button className="btn-voltar-original" onClick={() => navigate('/clients')}>
            Voltar
          </button>
        </div>

        <div className="pets-table-card-original">
          {loading ? (
            <div className="status-msg">A carregar pets...</div>
          ) : (
            <div className="table-responsive-container">
              <table className="pets-main-table">
                <thead>
                  <tr>
                    <th className="col-pet">PET</th>
                    <th className="col-especie">ESPÉCIE / RAÇA</th>
                    <th className="col-idade">IDADE / PESO</th>
                    <th className="col-acoes">AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.map((pet) => {
                    const petImgUrl = pet.displayImage || (pet.images && pet.images.length > 0 ? pet.images[0] : null) || pet.imageUrl;
                    return (
                      <tr key={pet.id}>
                        <td>
                          <div className="pet-info-flex">
                            <div className="pet-avatar-mini">
                              {petImgUrl ? <img src={petImgUrl} alt="" /> : <span>🐾</span>}
                            </div>
                            <span className="pet-name-label">{pet.name}</span>
                          </div>
                        </td>
                        <td className="text-dimmed">{pet.species || 'Espécie'} - {pet.breed || 'Raça'}</td>
                        <td className="text-dimmed">{pet.age || '0'} • {pet.weight || '0'}kg</td>
                        <td>
                          <div className="actions-flex-end">
                            <button className="btn-action-outline" onClick={() => openHistory(pet, 'consultas')}>Consultas</button>
                            <button className="btn-action-outline" onClick={() => openHistory(pet, 'vacinas')}>Vacinas</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {activeModal && (
        <div className="modal-overlay-original" onClick={() => setActiveModal(null)}>
          <div className="modal-content-original" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setActiveModal(null)}>&times;</button>
            <h2 className="modal-title-original">{activeModal === 'consultas' ? 'Consultas' : 'Vacinas'} - {selectedPet?.name}</h2>
            <p className="modal-subtitle-original">HISTÓRICO RECENTE</p>

            <div className="modal-table-container">
              {historyData.length > 0 ? (
                <div className="table-responsive-container">
                  <table className="modal-data-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>{activeModal === 'consultas' ? 'Motivo' : 'Vacina'}</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map(item => (
                        <tr key={item.id}>
                          <td>{item.date || item.dateAdministered}</td>
                          <td>{item.reason || item.name}</td>
                          <td>
                            <span className={`status-pill ${item.status || 'confirmado'}`}>
                              {item.status || item.batchNumber || 'confirmado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data-text">Nenhum registo encontrado.</p>
              )}
            </div>

            {activeModal === 'vacinas' && (
              <button className="btn-add-vaccine-modal" onClick={() => navigate(`/clients/${clientId}/pets/${selectedPet.id}/add-vaccine`)}>
                + NOVA VACINA
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pets;