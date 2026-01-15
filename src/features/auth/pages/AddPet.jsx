import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from "/src/config/firebase";
import { collection, addDoc } from 'firebase/firestore';
import "./AddPet.css";

const AddPet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Estado para a Imagem
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Estado para os Dados
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    sex: '',
    microchip: '',
    description: ''
  });

  // Lidar com a seleção da imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Cria uma pré-visualização
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let downloadUrl = "";

      // 1. Upload da Imagem (Se foi selecionada)
      if (imageFile) {
        const imageRef = ref(storage, `pet_images/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(imageRef, imageFile);
        downloadUrl = await getDownloadURL(uploadResult.ref);
      } else {
        // Imagem default se não escolherem nenhuma
        downloadUrl = "https://placehold.co/400x400?text=No+Photo";
      }

      // 2. Gravar na Base de Dados
      await addDoc(collection(db, "pets"), {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        age: formData.age,
        weight: formData.weight,
        sex: formData.sex,
        microchip: formData.microchip,
        description: formData.description,
        imageUrl: downloadUrl,
        
        status: "available", // <--- Importante para aparecer na lista!
        ownerId: "",         // <--- Vazio como pediste
        createdAt: new Date()
      });

      alert("Animal adicionado com sucesso!");
      navigate('/home-centro'); // Volta para a Dashboard

    } catch (error) {
      console.error("Erro ao criar pet:", error);
      alert("Erro ao criar pet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-pet-container">
      <div className="form-card">
        <h2>Adicionar Novo Animal</h2>
        
        <form onSubmit={handleSubmit}>
          
          {/* Upload de Imagem */}
          <div className="image-upload-section">
            <div className="image-preview" style={{backgroundImage: `url(${previewUrl || 'https://placehold.co/200?text=Upload+Photo'})`}}></div>
            <input type="file" accept="image/*" onChange={handleImageChange} required />
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>Nome</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Espécie</label>
              <select value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})}>
                <option value="dog">Cão</option>
                <option value="cat">Gato</option>
                <option value="bird">Pássaro</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div className="input-group">
              <label>Raça</label>
              <input type="text" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Idade (anos)</label>
              <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Peso (kg)</label>
              <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Sexo</label>
              <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})}>
                <option value="M">Macho</option>
                <option value="F">Fêmea</option>
              </select>
            </div>

            <div className="input-group full-width">
              <label>Microchip</label>
              <input type="text" value={formData.microchip} onChange={e => setFormData({...formData, microchip: e.target.value})} />
            </div>

            <div className="input-group full-width">
              <label>Descrição / História</label>
              <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Escreve aqui sobre o animal..."></textarea>
            </div>
          </div>

          <div className="button-row">
            <button type="button" className="btn-cancel" onClick={() => navigate('/home-centro')}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "A guardar..." : "Guardar Animal"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddPet;