// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './features/auth/pages/AuthPage.jsx';
import Login from './features/auth/pages/Login.jsx';
import RegisterEmpresa1 from './features/auth/pages/RegisterEmpresa1.jsx';
import RegisterEmpresa2 from './features/auth/pages/RegisterEmpresa2.jsx';
import RegisterFuncionario1 from './features/auth/pages/RegisterFuncionario1.jsx';
import RegisterFuncionario2 from './features/auth/pages/RegisterFuncionario2.jsx';
import Home from './features/auth/pages/Home.jsx';    
import Chat from './features/auth/pages/Chat.jsx';
import Calendar from './features/auth/pages/Calendar.jsx';
import Clients from './features/auth/pages/Clients.jsx';
import Pets from './features/auth/pages/Pets';
import HomeCentro from './features/auth/pages/HomeCentro.jsx';
import AddPet from './features/auth/pages/AddPet.jsx';
function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<Login />} />
      
      {/* Rotas Empresa */}
      <Route path="/RegisterEmpresa1" element={<RegisterEmpresa1 />} />
      <Route path="/RegisterEmpresa2" element={<RegisterEmpresa2 />} />
      
      {/* Rotas Funcionário */}
      <Route path="/RegisterFuncionario1" element={<RegisterFuncionario1 />} />
      <Route path="/RegisterFuncionario2" element={<RegisterFuncionario2 />} />
      

      <Route path="/home" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/clients" element={<Clients />} />
<Route path="/clients/:clientId/pets" element={<Pets />} />
<Route path="/home-centro" element={<HomeCentro />} />

            <Route path="/add-pet" element={<AddPet />} />
      <Route path="*" element={<h2>404 Not Found</h2>} />
    </Routes>
  );
}

export default App;