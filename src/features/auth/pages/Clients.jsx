import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../config/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import './Clients.css';

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientsRef = collection(db, "users");
    const q = query(clientsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtragem local para evitar erro de Index do Firebase
      const onlyClients = allUsers
        .filter(user => user.role === "client")
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setClients(onlyClients);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao procurar clientes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Lógica de filtragem atualizada para Nome, Email e Telefone
  const filteredClients = clients.filter(client => {
    const term = searchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.phone?.toString().includes(term)
    );
  });

  return (
    <div className="clients-page-container">
      <div className="clients-header">
        <div className="title-section">
          <h1>Lista de Clientes</h1>
          <p className="subtitle">Gerencie os {clients.length} donos de pets cadastrados</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/home')}>
          Voltar para Home
        </button>
      </div>

      <div className="search-section">
        <input 
          type="text" 
          placeholder="Pesquisar por nome, email ou telemóvel..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div className="status-msg">A carregar dados dos clientes...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="table-row">
                    <td className="name-cell">
                      <div className="avatar-circle">
                        {client.profileImageUrl ? (
                          <img src={client.profileImageUrl} alt="perfil" />
                        ) : (
                          client.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="name-text">{client.name || 'Sem nome'}</span>
                    </td>
                    <td className="email-text">{client.email}</td>
                    <td className="phone-text">{client.phone || 'N/A'}</td>
                    <td className="actions-cell">
                      <button 
                        className="btn-view-pets"
                        onClick={() => navigate(`/clients/${client.id}/pets`)}
                      >
                        Ver Pets
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredClients.length === 0 && (
          <div className="status-msg">Nenhum cliente encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default Clients;