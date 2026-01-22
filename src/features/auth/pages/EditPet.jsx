import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../../config/firebase'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './EditPet.css'; 

const EditPet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const petRef = doc(db, "pets", id);
        const snap = await getDoc(petRef);
        if (snap.exists()) {
          setFormData(snap.data());
        } else {
          alert("Pet não encontrado!");
          navigate('/pet-list');
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchPetData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const petRef = doc(db, "pets", id);
      await updateDoc(petRef, {
        ...formData,
        name: formData.name.toLowerCase(),
        updatedAt: new Date() // Boa prática adicionar data de edição
      });
      alert("Atualizado com sucesso!");
      navigate('/pet-list');
    } catch (error) {
      alert("Erro ao atualizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <p>A carregar dados do pet...</p>
      </div>
    );
  }

  return (
    <div className="edit-pet-container">
      <div className="edit-pet-content">
        <div className="edit-header-section">
          <h2>Editar Perfil</h2>
          <p>Atualize as informações de <strong>{formData.name.toUpperCase()}</strong></p>
        </div>

        <form className="pet-form-card" onSubmit={handleSubmit}>
          <div className="form-grid-edit">
            <div className="edit-input-group">
              <label>Nome do Pet</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                placeholder="Ex: Bobby"
              />
            </div>

            <div className="edit-input-group">
              <label>Idade</label>
              <input 
                name="age" 
                value={formData.age} 
                onChange={handleChange} 
                placeholder="Ex: 2 anos"
              />
            </div>

            <div className="edit-input-group">
              <label>Peso (kg)</label>
              <input 
                name="weight" 
                type="number" 
                step="0.1" 
                value={formData.weight} 
                onChange={handleChange} 
                placeholder="0.0"
              />
            </div>

            <div className="edit-input-group">
              <label>Espécie/Raça</label>
              <input 
                name="breed" 
                value={formData.breed || ""} 
                onChange={handleChange} 
                placeholder="Ex: Labrador"
              />
            </div>

            <div className="edit-input-group full-width" style={{ gridColumn: 'span 2' }}>
              <label>Descrição e Notas</label>
              <textarea 
                name="description" 
                value={formData.description} 
                rows="4" 
                onChange={handleChange}
                placeholder="Conte-nos mais sobre o pet..."
              ></textarea>
            </div>
          </div>

          <div className="action-buttons">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "A Guardar Alterações..." : "Confirmar Edição"}
            </button>
            <button 
              type="button" 
              className="cancel-edit-btn" 
              onClick={() => navigate('/pet-list')}
            >
              Cancelar e Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPet;