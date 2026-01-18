import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../config/firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import './AdoptionDetail.css';

const AdoptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const docRef = doc(db, "adoption_requests", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("Pedido não encontrado!");
          navigate('/home-centro');
        }
      } catch (error) {
        console.error("Erro ao buscar detalhe:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, navigate]);

  if (loading) return <div className="loading-screen">A carregar...</div>;
  if (!request) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return "Data desconhecida";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-PT', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="detail-container">
      <header className="detail-header">
        <h1>Petify <span className="lite">Center Admin</span></h1>
        <button onClick={() => navigate('/home-centro')} className="close-btn">X</button>
      </header>

      <div className="detail-content">
        <h2 className="page-title">Adoption Request</h2>

        <div className="request-card-large">
          
          <div className="card-left-col">
            <img 
              src={request.petImageUrl || "https://placehold.co/150"} 
              alt="Pet" 
              className="detail-pet-img" 
            />
            
            <div className="info-block">
              <p><strong>name:</strong> {request.petName}</p>
              <p><strong>species:</strong> {request.petSpecies || "cão"}</p>
              <p><strong>breed:</strong> {request.petBreed || "Raça não definida"}</p>
              <p><strong>age:</strong> {request.petAge || "?"}</p>
              <br/>
              <p><strong>User:</strong> {request.formData?.fullName || request.userName || "Anónimo"}</p>
              <p><strong>phone:</strong> {request.formData?.phone || "Não disponível"}</p>
            </div>
          </div>

          <div className="card-right-col">
            <h2 className="status-title">
              Request: <span className={request.status}>{request.status}</span>
            </h2>

            <div className="motivation-box">
              <p>"{request.motivation || request.description || "O utilizador não escreveu uma mensagem de motivação."}"</p>
            </div>

            <div className="card-footer">
               <span>{formatDate(request.createdAt || request.timestamp)}</span>
               <div className="edit-icon">✏️</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdoptionDetail;