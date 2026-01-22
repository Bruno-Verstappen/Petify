import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../../config/firebase'; 
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'; // <--- ADICIONADO getDoc
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AddPet.css';

import menuIcon from '../../../assets/images/Hamburger_menu.png'; 

const AddPet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // ESTADO NOVO: Guardar o ID correto do centro (pode ser o ID do user ou do Chefe)
  const [targetCenterId, setTargetCenterId] = useState(null);

  // --- VERIFICAÇÃO DE AUTENTICAÇÃO E PERFIL ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // --- CORREÇÃO AQUI ---
        // Vamos descobrir se este user é um funcionário e quem é a empresa dele
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDocRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const finalId = (userData.clinicId && userData.clinicId.trim() !== "") 
                                ? userData.clinicId 
                                : user.uid;
                
                setTargetCenterId(finalId);
                console.log("A adicionar animal para o centro ID:", finalId);
            } else {
                setTargetCenterId(user.uid);
            }
        } catch (error) {
            console.error("Erro ao ler perfil:", error);
            setTargetCenterId(user.uid);
        }

      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const speciesData = {
    "Cão": ["Labrador", "Pastor Alemão", "Bulldog", "Poodle", "Golden Retriever", "Beagle", "Chihuahua", "Rottweiler", "Yorkshire", "Boxer", "SRD (Rafeiro)", "Outro"],
    "Gato": ["Persa", "Siamês", "Maine Coon", "Bengal", "Angorá", "Sphynx", "Ragdoll", "SRD (Rafeiro)", "Outro"],
    "Pássaro": ["Canário", "Papagaio", "Periquito", "Caturra", "Agaponi", "Rola", "Outro"],
    "Outro": ["Coelho", "Hamster", "Tartaruga", "Lagarto"]
  };

  const [formData, setFormData] = useState({
    name: '', species: '', breed: '', age: '', weight: '', microchip: '', sex: '', description: ''
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpeciesChange = (e) => {
    setFormData({ ...formData, species: e.target.value, breed: '' });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !targetCenterId) return alert("A carregar perfil... Tente novamente em instantes.");
    if (!formData.name || !formData.species || imageFiles.length === 0) {
      return alert("Preencha Nome, Espécie e adicione pelo menos uma foto.");
    }

    try {
      setLoading(true);
      const newPetRef = doc(collection(db, "pets"));
      const petId = newPetRef.id;
      const imageUrls = [];

      await Promise.all(
        imageFiles.map(async (file, index) => {
          const storageRef = ref(storage, `petimages/${petId}/image${index}_${Date.now()}.jpg`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          imageUrls.push(url);
        })
      );

      const petData = {
        id: petId,
        active: true,
        adoptionCenterId: targetCenterId, 
        age: formData.age,
        breed: formData.breed,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
        description: formData.description,
        
        images: imageUrls, 
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : "", 
        
        microchip: formData.microchip,
        name: formData.name.toLowerCase(),
        ownerId: "",               
        sex: formData.sex,
        species: formData.species,
        status: "available",       
        weight: formData.weight
      };

      await setDoc(newPetRef, petData);
      alert(`Animal criado com sucesso!`);
      navigate('/home-centro');

    } catch (error) {
      console.error(error);
      alert("Erro ao guardar: " + error.message);
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
            <img src={menuIcon} alt="Menu" className="hamburger-icon" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} />
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
          
          <div className="image-section-label">
             Fotos (A primeira será a capa)
          </div>
          
          <div className="image-gallery-container">
            {previews.map((src, index) => (
                <div key={index} className="image-preview-wrapper">
                    <img 
                        src={src} 
                        alt={`Pet ${index}`} 
                        className="preview-thumb" 
                        style={index === 0 ? {border: '2px solid #4CAF50'} : {}}
                    />
                    {index === 0 && <span className="cover-badge">Capa</span>}
                    
                    <button 
                        type="button" 
                        className="remove-img-btn"
                        onClick={() => handleRemoveImage(index)}
                    >
                        ✕
                    </button>
                </div>
            ))}

            <label htmlFor="file-input" className="add-photo-btn">
                <span className="plus-sign">+</span>
                <span className="add-text">Add Photos</span>
            </label>
            
            <input 
                id="file-input" 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{display:'none'}} 
            />
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
                <input name="age" type="text" placeholder="Ex: 2 anos" onChange={handleChange} />
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