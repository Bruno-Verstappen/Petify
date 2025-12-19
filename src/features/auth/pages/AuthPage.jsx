
import { useNavigate } from 'react-router-dom';



function AuthPage() {
    const navigate = useNavigate();
  return (
    <div className="container mt-5">
      <h1>Authentication Page</h1>
      <button onClick={()=>navigate('/register')} >Register</button>
      <br/>
      <br/>
      <button onClick={()=>navigate('/login')} >Login</button>

      {/* Add your authentication components here */}
    </div>
  )
}
export default AuthPage