import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './features/auth/pages/AuthPage.jsx'
import './App.css'
import MainLayout from './layout/MainLayout'
import Register from './features/auth/pages/Register.jsx'
import Login from './features/auth/pages/Login.jsx'


function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout/>}>
      <Route path="*" element={<h2>404 Not Found</h2>} />
      <Route index element={<Navigate to="auth" replace />} />
      <Route path="auth" element={<AuthPage/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/login" element={<Login/>}/>
      </Route>
    </Routes>
  )
}


export default App
