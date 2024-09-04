import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import ProfileButton from './ProfileButton';
import './Navigation.css'; // Import the CSS file for Navigation styling

function Navigation({ isLoaded }) {
  const sessionUser = useSelector(state => state.session.user);

  let sessionLinks;
  if (sessionUser) {
    sessionLinks = (
      <li className="nav-item">
        <ProfileButton user={sessionUser} />
      </li>
    );
  } else {
    sessionLinks = (
      <div className="auth-links">
        <NavLink to="/login" className="nav-link">Log In</NavLink>
        <NavLink to="/signup" className="nav-link">Sign Up</NavLink>
      </div>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <ul className="nav-items">
          <li className="nav-item">
            <NavLink exact to="/" className="nav-link">Home</NavLink>
          </li>
        </ul>
        <ul className="nav-items">{isLoaded && sessionLinks}</ul>
      </div>
    </nav>
  );
}

export default Navigation;
