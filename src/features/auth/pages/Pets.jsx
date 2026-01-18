import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../config/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore';
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
      console.error("Erro ao buscar histórico:", err);
      setHistoryData([]);
    });

    return unsub;
  };

  return (
    <div className="clients-page-container">
      <div className="clients-header">
        <div className="title-section">
          <h1>Pets de {ownerName || 'Cliente'}</h1>
          <p className="subtitle">Gestão de histórico e dados clínicos</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/clients')}>Voltar</button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="status-msg">A carregar pets...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Pet</th>
                  <th>Espécie / Raça</th>
                  <th>Idade / Peso</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((pet) => {
                  // LÓGICA DE IMAGEM CORRIGIDA PARA O ARRAY DO FIRESTORE
                  const petImgUrl = 
                    pet.displayImage || 
                    (pet.images && pet.images.length > 0 ? pet.images[0] : null) || 
                    pet.imageUrl;

                  return (
                    <tr key={pet.id} className="table-row">
                      <td className="name-cell">
                        <div className="avatar-circle">
                          {petImgUrl ? (
                            <img src={petImgUrl} alt={pet.name} />
                          ) : (
                            <span style={{ fontSize: '20px' }}>🐾</span>
                          )}
                        </div>
                        <span className="name-text">{pet.name}</span>
                      </td>
                      <td className="email-text">
                        {pet.species || pet.especie || 'N/A'} - {pet.breed || pet.raca || 'N/A'}
                      </td>
                      <td className="phone-text">
                        {pet.age} • {pet.weight}kg
                      </td>
                      <td className="actions-cell">
                        <div className="actions-group">
                          <button className="btn-action-history" onClick={() => openHistory(pet, 'consultas')}>Consultas</button>
                          <button className="btn-action-vaccine" onClick={() => openHistory(pet, 'vacinas')}>Vacinas</button>
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

      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeModal === 'consultas' ? 'Consultas' : 'Vacinas'} - {selectedPet?.name}</h3>
              <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px',
                padding: '0 10px' 
              }}>
                <span style={{ color: '#888', fontSize: '13px', fontWeight: '600' }}>
                   HISTÓRICO RECENTE
                </span>
                
                {activeModal === 'vacinas' && (
                  <button 
                    className="btn-action-vaccine" 
                    style={{ background: '#715639', color: 'white', border: 'none' }}
                    onClick={() => navigate(`/clients/${clientId}/pets/${selectedPet.id}/add-vaccine`)}
                  >
                    + NOVA VACINA
                  </button>
                )}
              </div>

              {historyData.length > 0 ? (
                <div className="table-responsive">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>{activeModal === 'consultas' ? 'Motivo' : 'Vacina'}</th>
                        <th>{activeModal === 'consultas' ? 'Status' : 'Lote / Vet'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map(item => (
                        <tr key={item.id}>
                          <td>{item.date || item.dateAdministered}</td>
                          <td>
                            <strong>{item.reason || item.name}</strong>
                            {item.imageUrl && <span className="img-indicator"> 📷</span>}
                          </td>
                          <td>
                            {activeModal === 'consultas' ? (
                              <span className={`status-tag ${item.status || 'concluido'}`}>
                                {item.status || 'Concluído'}
                              </span>
                            ) : (
                              <div className="vaccine-info">
                                <span className="status-tag batch">{item.batchNumber || 'Sem Lote'}</span>
                                <small>{item.vetName}</small>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">Nenhum registo encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pets;