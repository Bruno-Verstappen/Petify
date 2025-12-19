import {Link, NavLink} from 'react-router-dom';

export default function Header(){
    return(
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
            <Link className="navbar-brand" to="/">Petify</Link>
            <button className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav" 
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                
                </li>
            </ul>
            </div>
        </div>
        </nav>
    )
}

