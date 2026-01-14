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

  // Estados do Modal
  const [activeModal, setActiveModal] = useState(null); // 'consultas' ou 'vacinas'
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
    setHistoryData([]); // Limpa dados anteriores enquanto carrega

    let q;
    if (type === 'consultas') {
      // Coleção de raiz 'appointments'
      q = query(
        collection(db, 'appointments'),
        where("petId", "==", pet.id),
        orderBy("date", "desc")
      );
    } else {
      // Subcoleção: pets/{petId}/vaccination_card
      q = query(
        collection(db, "pets", pet.id, "vaccination_card"),
        orderBy("timestamp", "desc")
      );
    }

    const unsub = onSnapshot(q, (snapshot) => {
      setHistoryData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Erro no Firebase:", err);
      setHistoryData([]);
    });

    return unsub;
  };

  return (
    <div className="clients-page-container">
      <div className="clients-header">
        <div className="title-section">
          <h1>Pets de {ownerName || 'Cliente'}</h1>
          <p className="subtitle">Gerencie o histórico clínico dos animais</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/clients')}>Voltar para Clientes</button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="status-msg">A carregar dados...</div>
        ) : (
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
              {pets.map((pet) => (
                <tr key={pet.id} className="table-row">
                  <td className="name-cell">
                    <div className="avatar-circle">
                      {pet.imageUrl ? <img src={pet.imageUrl} alt="pet" /> : '🐾'}
                    </div>
                    <span className="name-text">{pet.name}</span>
                  </td>
                  <td className="email-text">
                    {pet.species || pet.specie || 'Pet'} - {pet.breed || 'N/A'}
                  </td>
                  <td className="phone-text">
                    {pet.age} anos • {pet.weight || '--'} kg
                  </td>
                  <td className="actions-cell">
                    <div className="actions-group">
                      <button className="btn-action-history" onClick={() => openHistory(pet, 'consultas')}>Consultas</button>
                      <button className="btn-action-vaccine" onClick={() => openHistory(pet, 'vacinas')}>Vacinas</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Histórico de {activeModal} - {selectedPet?.name}</h3>
              <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {historyData.length > 0 ? (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>{activeModal === 'consultas' ? 'Motivo' : 'Vacina'}</th>
                      <th>{activeModal === 'consultas' ? 'Status' : 'Detalhes'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map(item => (
                      <tr key={item.id}>
                        <td className="date-cell">
                          {item.date || item.dateAdministered || '---'}
                        </td>
                        <td>
                          <div className="main-info">{item.reason || item.name || 'N/A'}</div>
                          {item.vetName && <div className="sub-info">Vet: {item.vetName}</div>}
                        </td>
                        <td>
                          {activeModal === 'consultas' ? (
                            <span className={`status-tag ${item.status || 'concluido'}`}>
                              {item.status || 'Concluído'}
                            </span>
                          ) : (
                            <div className="vaccine-details">
                              <span className="status-tag validade">Val: {item.validUntil}</span>
                              <div className="sub-info">Lote: {item.batchNumber || 'N/A'}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">Sem registos encontrados para este pet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pets;