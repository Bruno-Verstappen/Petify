import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { db } from "../../../config/firebase"; 
import { 
  collection, 
  onSnapshot, 
  addDoc 
} from "firebase/firestore";

const Chat = () => {
  const [chats, setChats] = useState([]); 
  const [activeChat, setActiveChat] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef();

  // Gera a String idêntica à da imagem c156d3.png
  const getFormattedDate = () => {
    const now = new Date();
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const dia = now.getDate();
    const mes = meses[now.getMonth()];
    const ano = now.getFullYear();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const segundos = String(now.getSeconds()).padStart(2, '0');

    return `${dia} de ${mes} de ${ano} às ${horas}:${minutos}:${segundos} UTC`;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "chats"), (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeChat) return;

    const unsubscribe = onSnapshot(
      collection(db, "chats", activeChat.id, "messages"),
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          let sortTime = 0;

          // Tratamento seguro para ordenar tanto Strings (Kotlin) como Objetos (Web antigo)
          if (data.timestamp) {
            if (typeof data.timestamp === 'string') {
              const mesesMap = { janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11 };
              try {
                const p = data.timestamp.toLowerCase().split(' ');
                const d = new Date(p[4], mesesMap[p[2]], p[0], ...p[6].split(':'));
                sortTime = d.getTime();
              } catch (e) { sortTime = Date.now(); }
            } else if (data.timestamp.toDate) {
              sortTime = data.timestamp.toDate().getTime();
            }
          }
          return { id: doc.id, ...data, sortTime };
        });

        msgs.sort((a, b) => a.sortTime - b.sortTime);
        setMessages(msgs);
      }
    );
    return () => unsubscribe();
  }, [activeChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() === "" || !activeChat) return;

    try {
      // GUARDA EXATAMENTE COM OS 6 CAMPOS DA IMAGEM c156d3.png
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        chatId: activeChat.id,
        isRead: "false",
        receiverId: activeChat.userId || "", 
        senderId: "ADMIN_VET",
        text: input,
        timestamp: getFormattedDate() // Envia como STRING com "UTC"
      });
      setInput("");
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  // Exibe a hora de forma segura para evitar o erro .split is not a function
  const displayTime = (ts) => {
    if (!ts) return "...";
    const timeStr = typeof ts === 'string' ? ts : "";
    if (timeStr.includes(' às ')) {
      return timeStr.split(' às ')[1].substring(0, 5);
    }
    return "...";
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h3>Mensagens</h3></div>
        <div className="chat-list">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChat?.id === chat.id ? "active" : ""}`}
              onClick={() => setActiveChat(chat)}
            >
              <div className="chat-avatar">🐾</div>
              <div className="chat-info">
                <p className="chat-name">{chat.petName || "Cliente Petify"}</p>
                <p className="chat-last-msg">Ver conversa</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-container">
        {activeChat ? (
          <>
            <header className="chat-header">
              <h2>{activeChat.petName || "Cliente Petify"}</h2>
            </header>
            <div className="messages-list">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`message-bubble ${msg.senderId === 'ADMIN_VET' ? 'message-admin' : 'message-client'}`}
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
                placeholder="Escreva uma resposta..."
              />
              <button type="submit" className="send-button">➤</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">Selecione uma conversa.</div>
        )}
      </main>
    </div>
  );
};

export default Chat;