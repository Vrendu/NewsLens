
    import React, { useState, useEffect, useRef } from "react";
    import { useDispatch } from 'react-redux';
    import { Redirect } from "react-router-dom/cjs/react-router-dom.min";
    import * as sessionActions from '../../store/session';
    import { Link } from 'react-router-dom';
    import './Navigation.css';

    function ProfileButton({ user }) {
      const dispatch = useDispatch();
      const [showMenu, setShowMenu] = useState(false);
      const ulRef = useRef();

      const openMenu = () => {
        if (showMenu) return;
        setShowMenu(true);
      };

      useEffect(() => {
        if (!showMenu) return;

        const closeMenu = (e) => {
          if (!ulRef.current.contains(e.target)) {
            setShowMenu(false);
          }
        };

        document.addEventListener('click', closeMenu);

        return () => document.removeEventListener("click", closeMenu);
      }, [showMenu]);

      const logout = (e) => {
        e.preventDefault();
        dispatch(sessionActions.logout());

        //return <Redirect to='/' />
      };

      const ulClassName = "profile-dropdown" + (showMenu ? "" : " hidden");

      return (
        <>
          <button onClick={openMenu}>
            <i className="fas fa-user-circle" />
          </button>
          {showMenu && (
            <ul className={ulClassName} ref={ulRef}>
              <Link to={`/${user.username}/dashboard`}>
                <li>Dashboard</li>
              </Link>
              <li>{user.firstName} {user.lastName}</li>
              <li>{user.email}</li>
              <li>
                <button onClick={logout}>Log Out</button>
              </li>
            </ul>
          )}
        </>
      );
    }

    export default ProfileButton;
                  