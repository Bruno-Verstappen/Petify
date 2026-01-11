import React, { useState, useEffect, useMemo } from "react";
import "./Calendar.css";
import { db } from "../../../config/firebase";
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, getDoc 
} from "firebase/firestore";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "" });

  // Cores de urgência (Lógica Android)
  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "alta": case "high": case "muito alta": return "#E53935";
      case "media": case "média": case "medium": return "#FFB300";
      case "baixa": case "low": return "#4CAF50";
      default: return "#715639"; 
    }
  };

  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAppts = onSnapshot(collection(db, "appointments"), async (snapshot) => {
      const apptsData = await Promise.all(snapshot.docs.map(async (apptDoc) => {
        const data = apptDoc.data();
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

    return () => { unsubEvents(); unsubAppts(); };
  }, []);

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
    const date = new Date(e.target.value + "-02"); // Add day to avoid timezone shifts
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
              <div key={i} className="dot" style={{ backgroundColor: e.isAppointment ? getUrgencyColor(e.urgency) : "#fff" }} />
            ))}
          </div>
        </div>
      );
    }
    return days;
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
          {combinedEvents.filter(e => e.date === selectedDate.toISOString().split('T')[0]).map(event => (
            <div key={event.id} className="mini-card" style={{ borderLeftColor: getUrgencyColor(event.urgency) }}>
              <strong>{event.title}</strong>
              {event.time && <span>🕒 {event.time}</span>}
            </div>
          ))}
        </div>
        <button className="fab" onClick={() => setShowModal(true)}>+</button>
      </div>
    </div>
  );
};

export default Calendar;