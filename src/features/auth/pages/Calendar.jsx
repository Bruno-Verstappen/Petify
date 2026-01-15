import React, { useState, useEffect, useMemo } from "react";
import "./Calendar.css";
import { db, auth } from "../../../config/firebase"; // Certifique-react que o auth está exportado no seu config
import { 
  collection, onSnapshot, addDoc, doc, getDoc, query, where 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentVetId, setCurrentVetId] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", urgency: "baixa" });

  // 1. Monitorizar o estado de autenticação para obter o vetId
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentVetId(user.uid);
      } else {
        setCurrentVetId(null);
        setAppointments([]); // Limpa se deslogar
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Cores de urgência
  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "alta": case "high": case "muito alta": return "#E53935";
      case "media": case "média": case "medium": return "#FFB300";
      case "baixa": case "low": return "#4CAF50";
      default: return "#715639"; 
    }
  };

  // 2. Carregar dados filtrados por vetId
  useEffect(() => {
    if (!currentVetId) return;

    // Filtra agendamentos apenas deste veterinário
    const qAppts = query(
      collection(db, "appointments"), 
      where("vetId", "==", currentVetId)
    );

    const unsubAppts = onSnapshot(qAppts, async (snapshot) => {
      const apptsData = await Promise.all(snapshot.docs.map(async (apptDoc) => {
        const data = apptDoc.data();
        
        // Filtro de status (opcional, já que a query traz tudo do vet)
        if (!data.status?.toLowerCase().includes("confirmad")) return null;

        let petName = "Pet";
        if (data.petId) {
          const petRef = doc(db, "pets", data.petId);
          const petSnap = await getDoc(petRef);
          if (petSnap.exists()) petName = petSnap.data().name;
        }
        return { id: apptDoc.id, ...data, petName };
      }));
      setAppointments(apptsData.filter(a => a !== null));
    });

    // Se os eventos também forem privados por vetId:
    const qEvents = query(collection(db, "events"), where("vetId", "==", currentVetId));
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubAppts(); unsubEvents(); };
  }, [currentVetId]);

  const combinedEvents = useMemo(() => {
    const formattedAppts = appointments.map(appt => {
      const [datePart, timePart] = (appt.date || "").split(" ");
      return {
        ...appt,
        date: datePart,
        time: timePart || "",
        title: `Consulta: ${appt.petName}`,
        isAppointment: true
      };
    });
    return [...events, ...formattedAppts];
  }, [events, appointments]);

  const handleQuickDateChange = (e) => {
    const date = new Date(e.target.value + "-02");
    setCurrentMonth(date);
    setSelectedDate(date);
  };

  const renderDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay() === 0 ? 6 : new Date(year, month, 1).getDay() - 1;

    for (let i = 0; i < startDay; i++) days.push(<div key={`e-${i}`} className="calendar-day empty"></div>);

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = combinedEvents.filter(e => e.date === dateStr);
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month;

      days.push(
        <div key={d} className={`calendar-day ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDate(new Date(year, month, d))}>
          <span className="day-num">{d}</span>
          <div className="dots-row">
            {dayEvents.slice(0, 3).map((e, i) => (
              <div key={i} className="dot" style={{ backgroundColor: e.isAppointment || e.urgency ? getUrgencyColor(e.urgency) : "#fff" }} />
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  // Função para adicionar novo evento manual
  const handleAddEvent = async () => {
    if (!newEvent.title || !currentVetId) return;
    try {
      await addDoc(collection(db, "events"), {
        ...newEvent,
        date: selectedDate.toISOString().split('T')[0],
        vetId: currentVetId,
        createdAt: new Date()
      });
      setShowModal(false);
      setNewEvent({ title: "", description: "", urgency: "baixa" });
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-main">
        <div className="calendar-nav">
          <h2>Calendário</h2>
          <div className="nav-tools">
            <input 
              type="month" 
              value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`}
              onChange={handleQuickDateChange}
              className="month-picker"
            />
            <div className="arrows">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>&lt;</button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>&gt;</button>
            </div>
          </div>
        </div>

        <div className="calendar-wrapper">
          <div className="grid-header">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid-body">{renderDays()}</div>
        </div>
      </div>

      <div className="calendar-sidebar">
        <h3>{selectedDate.toLocaleDateString('pt-PT')}</h3>
        <div className="sidebar-list">
          {combinedEvents
            .filter(e => e.date === selectedDate.toISOString().split('T')[0])
            .map(event => (
              <div key={event.id} className="mini-card" style={{ borderLeftColor: getUrgencyColor(event.urgency) }}>
                <strong>{event.title}</strong>
                {event.reason && <small>{event.reason}</small>}
                {event.time && <span>🕒 {event.time}</span>}
              </div>
            ))}
          {combinedEvents.filter(e => e.date === selectedDate.toISOString().split('T')[0]).length === 0 && (
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Sem compromissos.</p>
          )}
        </div>
        <button className="fab" onClick={() => setShowModal(true)}>+</button>
      </div>

      {/* Modal Simples de Adição */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Novo Lembrete</h3>
            <input 
              type="text" 
              placeholder="Título" 
              value={newEvent.title} 
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} 
            />
            <select value={newEvent.urgency} onChange={(e) => setNewEvent({...newEvent, urgency: e.target.value})}>
              <option value="baixa">Baixa Urgência</option>
              <option value="media">Média Urgência</option>
              <option value="alta">Alta Urgência</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Cancelar</button>
              <button onClick={handleAddEvent}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;