import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './features/auth/pages/AuthPage.jsx'
import './App.css'
import RegisterEmpresa1 from './features/auth/pages/RegisterEmpresa1.jsx';
import Register from './features/auth/pages/Register.jsx'
import Login from './features/auth/pages/Login.jsx'


function App() {
  return (
    <Routes>
      <Route path="*" element={<h2>404 Not Found</h2>} />
      <Route index element={<Navigate to="auth" replace />} />
      <Route path="auth" element={<AuthPage/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/RegisterEmpresa1" element={<RegisterEmpresa1/>}/>
      <Route path="/dashboard" element={<h2>Dashboard - Protected Route</h2>}>
      </Route>
    </Routes>
  )
}


export default App
