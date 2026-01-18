import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../../config/firebase'; 
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AddPet.css';

// Import do ícone do menu
import menuIcon from '../../../assets/images/Hamburger_menu.png'; 

const AddPet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- VERIFICAÇÃO DE AUTENTICAÇÃO ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // Se não houver utilizador, volta ao login para evitar erros de ID
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- DADOS DE ESPÉCIES E RAÇAS ---
  const speciesData = {
    "Cão": ["Labrador", "Pastor Alemão", "Bulldog", "Poodle", "Golden Retriever", "Beagle", "Chihuahua", "Rottweiler", "Yorkshire", "Boxer", "SRD (Rafeiro)", "Outro"],
    "Gato": ["Persa", "Siamês", "Maine Coon", "Bengal", "Angorá", "Sphynx", "Ragdoll", "SRD (Rafeiro)", "Outro"],
    "Pássaro": ["Canário", "Papagaio", "Periquito", "Caturra", "Agaporni", "Rola", "Outro"],
    "Outro": ["Coelho", "Hamster", "Tartaruga", "Lagarto"]
  };

  // Estados do Formulário
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    microchip: '',
    sex: '',
    description: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpeciesChange = (e) => {
    setFormData({ 
        ...formData, 
        species: e.target.value, 
        breed: '' 
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // --- SUBMETER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificação robusta antes de começar
    if (!currentUser) {
      alert("Erro: Deves estar logado para adicionar um animal.");
      return;
    }

    if (!formData.name || !formData.species || !imageFile) {
      alert("Por favor preencha o Nome, Espécie e escolha uma Imagem.");
      return;
    }

    try {
      setLoading(true);

      // 1. Upload Imagem
      const storageRef = ref(storage, `pet_images/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Criar Documento
      // Nota: O ID do centro é pego diretamente do estado currentUser definido no useEffect
      const petData = {
        active: "true",                 
        adoptionCenterId: currentUser.uid, 
        age: formData.age,
        breed: formData.breed,
        createdAt: serverTimestamp(),
        description: formData.description,
        imageUrl: downloadURL,
        microchip: formData.microchip,
        name: formData.name,
        ownerId: "",               
        sex: formData.sex,
        species: formData.species,
        status: "available",       
        weight: formData.weight
      };

      const docRef = await addDoc(collection(db, "pets"), petData);

      // 3. Atualizar com o petId
      await updateDoc(doc(db, "pets", docRef.id), {
        petId: docRef.id
      });

      alert("Animal criado com sucesso!");
      navigate('/pet-list');

    } catch (error) {
      console.error("Erro ao criar:", error);
      alert("Erro ao guardar na base de dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { auth.signOut(); navigate('/login'); };
  const handleNavigate = (path) => { setMenuOpen(false); if(path) navigate(path); };

  const currentBreeds = formData.species ? speciesData[formData.species] : [];

  return (
    <div className="add-pet-container" onClick={() => setMenuOpen(false)}>
      
      <header className="dash-header">
        <h1 className="logo-text">Petify <span className="sub-logo">Center Admin</span></h1>
        <div className="header-actions">
          <div className="menu-container">
            <img 
              src={menuIcon} 
              alt="Menu" 
              className="hamburger-icon" 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} 
            />
            {menuOpen && (
              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="menu-item" onClick={() => handleNavigate('/home-centro')}>Home</div>
                <div className="menu-item" onClick={() => handleNavigate('/pet-list')}>Pets</div>
                <div className="menu-item logout" onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="add-pet-content">
        <h2 className="page-title">Add New Pet</h2>
        
        <form className="pet-form" onSubmit={handleSubmit}>
          
          <div className="image-upload-section">
            <label htmlFor="file-input" className="image-placeholder">
              {preview ? <img src={preview} alt="Preview" /> : <span>+ Add Photo</span>}
            </label>
            <input id="file-input" type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
          </div>

          <div className="form-grid">
            <div className="input-group">
                <label>Nome*</label>
                <input name="name" placeholder="Ex: Max" onChange={handleChange} required />
            </div>

            <div className="input-group">
                <label>Espécie*</label>
                <select name="species" value={formData.species} onChange={handleSpeciesChange} className="dark-select" required>
                    <option value="">Selecionar...</option>
                    {Object.keys(speciesData).map(specie => (
                        <option key={specie} value={specie}>{specie}</option>
                    ))}
                </select>
            </div>

            <div className="input-group">
                <label>Raça</label>
                <select name="breed" value={formData.breed} onChange={handleChange} className="dark-select" disabled={!formData.species}>
                    <option value="">Selecionar...</option>
                    {currentBreeds.map(raca => (
                        <option key={raca} value={raca}>{raca}</option>
                    ))}
                </select>
            </div>

            <div className="input-group">
                <label>Idade (anos)</label>
                <input name="age" type="number" placeholder="2" onChange={handleChange} />
            </div>

            <div className="input-group">
                <label>Peso (kg)</label>
                <input name="weight" type="number" step="0.1" placeholder="5.0" onChange={handleChange} />
            </div>

            <div className="input-group">
                <label>Sexo</label>
                <select name="sex" value={formData.sex} onChange={handleChange} className="dark-select">
                    <option value="">Selecionar...</option>
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                </select>
            </div>

            <div className="input-group full-width">
                <label>Microchip</label>
                <input name="microchip" placeholder="Número do microchip" onChange={handleChange} />
            </div>

            <div className="input-group full-width">
                <label>Descrição</label>
                <textarea name="description" placeholder="Descreva a personalidade do animal..." rows="3" onChange={handleChange}></textarea>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "A Guardar..." : "Adicionar Animal"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddPet;