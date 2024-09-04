
    import React, { useState } from "react";
    import { useDispatch, useSelector } from "react-redux";
    import { Redirect } from "react-router-dom";
    import * as sessionActions from "../../store/session";
    //import "./SignupFormPage.css";

    function SignupFormPage() {
      const dispatch = useDispatch();
      const sessionUser = useSelector((state) => state.session.user);
      const [email, setEmail] = useState("");
      const [username, setUsername] = useState("");
      const [firstName, setFirstName] = useState("");
      const [lastName, setLastName] = useState("");
      const [password, setPassword] = useState("");
      const [confirmPassword, setConfirmPassword] = useState("");
      const [errors, setErrors] = useState({});

      if (sessionUser) return <Redirect to={`/${sessionUser.username}/dashboard`} />;

      const handleSubmit = (e) => {
        e.preventDefault();
        if (password === confirmPassword) {
          setErrors({});
          return dispatch(
            sessionActions.signup({
              email,
              username,
              firstName,
              lastName,
              password,
            })
          ).catch(async (res) => {
            const data = await res.json();
            if (data && data.errors) {
              setErrors(data.errors);
            }
          });
        }
        return setErrors({
          confirmPassword: "Confirm Password field must be the same as the Password field"
        });
      };

      return (
        <div className="auth-form-container"> 
            <form onSubmit={handleSubmit} className="form-container">
            <h1 className="auth-form-title">Sign Up</h1> 
            <label>
              Email
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-form-input"
                required
              />
            </label>
            {errors.email && <p className="auth-form-error">{errors.email}</p>}
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="auth-form-input"
                required
              />
            </label>
            {errors.username && <p className="auth-form-error">{errors.username}</p>}
            <label>
              First Name
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="auth-form-input"
                required
              />
            </label>
            {errors.firstName && <p className="auth-form-error">{errors.firstName}</p>}
            <label>
              Last Name
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="auth-form-input"
                required
              />
            </label>
            {errors.lastName && <p className="auth-form-error">{errors.lastName}</p>}
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-form-input"
                required
              />
            </label>
            {errors.password && <p className="auth-form-error">{errors.password}</p>}
            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-form-input"
                required
              />
            </label>
            {errors.confirmPassword && <p className="auth-form-error">{errors.confirmPassword}</p>}
            <button type="submit" className="auth-form-button">Sign Up</button>
          </form>
        </div>

      );
    }

    export default SignupFormPage;
                  