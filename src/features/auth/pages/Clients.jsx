import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../config/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import Header from "../../../layout/Header"; 
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

  const filteredClients = clients.filter(client => {
    const term = searchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.phone?.toString().includes(term)
    );
  });

  return (
    <div className="clients-page-main-wrapper">
      <Header />
      
      <div className="clients-scrollable-content">
        <div className="clients-header-bar">
          <div className="title-area">
            <h1>Lista de Clientes</h1>
            <p className="subtitle">Gerencie os {clients.length} donos de pets cadastrados</p>
          </div>
        </div>

        <div className="search-container">
          <input 
            type="text" 
            placeholder="Pesquisar por nome, email ou telemóvel..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-field"
          />
        </div>

        <div className="clients-table-container">
          {loading ? (
            <div className="loading-state">A carregar dados...</div>
          ) : (
            <div className="table-wrapper">
              <table className="clients-table">
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
                    <tr key={client.id}>
                      <td className="client-info">
                        <div className="avatar">
                          {client.profileImageUrl ? (
                            <img src={client.profileImageUrl} alt="perfil" />
                          ) : (
                            client.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span>{client.name || 'Sem nome'}</span>
                      </td>
                      <td>{client.email}</td>
                      <td>{client.phone || 'N/A'}</td>
                      <td className="actions">
                        <button onClick={() => navigate(`/clients/${client.id}/pets`)}>
                          Ver Pets
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;