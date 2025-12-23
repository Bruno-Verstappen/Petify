import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './features/auth/pages/AuthPage.jsx'
import './App.css'

// Importações de Empresa
import RegisterEmpresa1 from './features/auth/pages/RegisterEmpresa1.jsx';
import RegisterEmpresa2 from './features/auth/pages/RegisterEmpresa2.jsx';

// Importações de Funcionário (Corrigido para nomes únicos)
import RegisterFuncionario1 from './features/auth/pages/RegisterFuncionario1.jsx';
import RegisterFuncionario2 from './features/auth/pages/RegisterFuncionario2.jsx';

import Login from './features/auth/pages/Login.jsx';

function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="auth" replace />} />
      <Route path="auth" element={<AuthPage/>}/>
      
      {/* Rotas de Empresa */}
      <Route path="/RegisterEmpresa1" element={<RegisterEmpresa1/>}/>
      <Route path="/RegisterEmpresa2" element={<RegisterEmpresa2/>}/>
      
      {/* Rotas de Funcionário */}
      <Route path="/RegisterFuncionario1" element={<RegisterFuncionario1 />} />
      <Route path="/RegisterFuncionario2" element={<RegisterFuncionario2 />} />
      
      <Route path="/login" element={<Login/>}/>
      
      <Route path="/dashboard" element={<h2>Dashboard - Protected Route</h2>} />
      
      {/* Rota 404 sempre no final */}
      <Route path="*" element={<h2>404 Not Found</h2>} />
    </Routes>
  )
}

export default App