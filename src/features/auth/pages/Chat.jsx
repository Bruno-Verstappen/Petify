import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { db } from "../../../config/firebase"; 
import { 
  collection, 
  onSnapshot, 
  addDoc,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  Timestamp
} from "firebase/firestore";
import Header from "../../../layout/Header";

// 1. IMPORTAR A ANIMAÇÃO (Verifica se o caminho está correto para a tua pasta)
import LetterPetAnimation from "../../../shared/components/LetterPetAnimation"; 

const Chat = () => {
  const [chats, setChats] = useState([]); 
  const [activeChat, setActiveChat] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 2. NOVO ESTADO PARA CONTROLAR A ANIMAÇÃO
  const [showAnimation, setShowAnimation] = useState(false);

  const scrollRef = useRef();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "chats"), async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        let petName = "Pet";
        
        if (data.petId) {
          try {
            const petDocRef = doc(db, "pets", data.petId);
            const petSnapshot = await getDoc(petDocRef);
            if (petSnapshot.exists()) petName = petSnapshot.data().name;
          } catch (err) { console.error("Erro ao buscar pet:", err); }
        }
        
        return { id: chatDoc.id, ...data, petName };
      }));
      setChats(chatsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeChat) return;

    const messagesRef = collection(db, "chats", activeChat.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() === "" || !activeChat) return;

    // 3. ATIVAR A ANIMAÇÃO AO ENVIAR
    setShowAnimation(true);

    try {
      const now = Timestamp.now();
      const chatId = activeChat.id;

      const messageData = {
        chatId: chatId,
        senderId: activeChat.clinicId, 
        receiverId: activeChat.userId,
        text: input,
        timestamp: now,
        petId: activeChat.petId || ""
      };

      const chatUpdateData = {
        chatId: chatId,
        userId: activeChat.userId,
        clinicId: activeChat.clinicId,
        lastMessage: input,
        updatedAt: now,
        userName: activeChat.userName || "Usuário",
        petId: activeChat.petId || ""
      };

      await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      await setDoc(doc(db, "chats", chatId), chatUpdateData, { merge: true });

      setInput("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const displayTime = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  return (
    <div className="chat-page-wrapper">
      
      {/* 4. RENDERIZAR A ANIMAÇÃO AQUI */}
      {/* Ela fica por cima de tudo (z-index alto) e desliga-se quando termina */}
      <LetterPetAnimation 
        trigger={showAnimation} 
        onComplete={() => setShowAnimation(false)} 
      />

      <Header />
      <div className="app-container">
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? "✕" : "☰"}
        </button>

        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h3>Painel da Clínica</h3>
          </div>
          <div className="chat-list">
            {chats.map(chat => (
              <div 
                key={chat.id} 
                className={`chat-item ${activeChat?.id === chat.id ? "active" : ""}`}
                onClick={() => handleSelectChat(chat)}
              >
                <div className="chat-avatar">🐾</div>
                <div className="chat-info">
                  <p className="chat-name">{chat.petName}</p>
                  <p className="chat-last-msg">Dono: {chat.userName}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className={`sidebar-overlay ${isSidebarOpen ? "visible" : ""}`} onClick={() => setIsSidebarOpen(false)}></div>

        <main className="chat-container">
          {activeChat ? (
            <>
              <header className="chat-header">
                <h2>{activeChat.userName} <span style={{fontSize: '14px', opacity: 0.7}}>({activeChat.petName})</span></h2>
              </header>
              
              <div className="messages-list">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message-bubble ${msg.senderId === activeChat.clinicId ? 'message-admin' : 'message-client'}`}
                  >
                    <p className="msg-content">{msg.text}</p>
                    <span className="timestamp">{displayTime(msg.timestamp)}</span>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSend}>
                <input 
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Resposta da clínica..."
                />
                <button type="submit" className="send-button">➤</button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Selecione um cliente para responder.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;