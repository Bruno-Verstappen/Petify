import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import './AddVaccine.css'; 

const AddVaccine = () => {
    const { clientId, petId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        dateAdministered: '',
        validUntil: '',
        batchNumber: '',
        vetName: ''
    });

    useEffect(() => {
        const fetchVetName = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setFormData(prev => ({
                            ...prev,
                            vetName: userData.name || 'Veterinário Responsável'
                        }));
                    }
                } catch (error) {
                    console.error("Erro ao procurar nome do veterinário:", error);
                }
            }
        };

        fetchVetName();
    }, []);

    const parseDate = (dateStr) => {
        if (!dateStr || dateStr.length < 10) return null;
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    const handleDateChange = (e, field) => {
        let value = e.target.value.replace(/\D/g, ""); 
        if (value.length > 8) value = value.slice(0, 8);
        
        let formatted = value;
        if (value.length > 2) formatted = value.slice(0, 2) + "/" + value.slice(2);
        if (value.length > 4) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5, 9);
        
        setFormData({ ...formData, [field]: formatted });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (formData.dateAdministered.length < 10) {
            alert("Insira a data de dosagem completa.");
            return;
        }

        if (formData.validUntil && formData.validUntil.length === 10) {
            const dateAdmin = parseDate(formData.dateAdministered);
            const dateNext = parseDate(formData.validUntil);

            if (dateNext <= dateAdmin) {
                alert("A data do próximo reforço deve ser posterior à data de dosagem.");
                return;
            }
        }

        setLoading(true);
        try {
            const vaccineRef = collection(db, "pets", petId, "vaccination_card");
            
            await addDoc(vaccineRef, {
                name: formData.name,
                dateAdministered: formData.dateAdministered,
                validUntil: formData.validUntil,
                batchNumber: formData.batchNumber,
                vetName: formData.vetName,
                timestamp: serverTimestamp()
            });

            alert("Vacina registada com sucesso!");
            navigate(-1); 
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao gravar os dados.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-vaccine-page">
            <div className="add-vaccine-container">
                <h1 className="add-vaccine-title">Nova Vacina</h1>
                <p className="add-vaccine-subtitle">O registo ficará disponível imediatamente na App do cliente.</p>

                <div className="vaccine-form-card">
                    <form onSubmit={handleSave}>
                        <div className="input-group">
                            <label>Nome da Vacina</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Raiva / Polivalente" 
                                required 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>

                        <div className="date-inputs-row">
                            <div className="input-group">
                                <label>Data de Dosagem</label>
                                <input 
                                    type="text" 
                                    placeholder="DD/MM/AAAA" 
                                    value={formData.dateAdministered}
                                    onChange={e => handleDateChange(e, 'dateAdministered')}
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Próximo Reforço</label>
                                <input 
                                    type="text" 
                                    placeholder="DD/MM/AAAA" 
                                    value={formData.validUntil}
                                    onChange={e => handleDateChange(e, 'validUntil')}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Número do Lote</label>
                            <input 
                                type="text" 
                                placeholder="Ex: FX-9920"
                                value={formData.batchNumber}
                                onChange={e => setFormData({...formData, batchNumber: e.target.value})} 
                            />
                        </div>

                        <div className="input-group">
                            <label>Veterinário Responsável</label>
                            <input 
                                type="text" 
                                value={formData.vetName}
                                onChange={e => setFormData({...formData, vetName: e.target.value})}
                                placeholder="A carregar nome..."
                                required
                            />
                        </div>

                        <button type="submit" className="btn-submit-vaccine" disabled={loading}>
                            {loading ? 'A Gravar...' : 'Confirmar Registo'}
                        </button>
                    </form>
                </div>

                <button className="btn-cancel-link" onClick={() => navigate(-1)}>
                    Voltar atrás
                </button>
            </div>
        </div>
    );
};

export default AddVaccine;