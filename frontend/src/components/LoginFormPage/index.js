
    import React, { useState } from "react";
    import * as sessionActions from "../../store/session";
    import { useDispatch, useSelector } from "react-redux";
    import { Redirect } from "react-router-dom";
    //import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
    import "./LoginFormPage.css";

    function LoginFormPage() {
      //const history = useHistory();
      const dispatch = useDispatch();
      const sessionUser = useSelector((state) => state.session.user);
      const [credential, setCredential] = useState("");
      const [password, setPassword] = useState("");
      const [errors, setErrors] = useState({});
      const [honeyPot, setHoneyPot] = useState("");

      if (sessionUser) return <Redirect to={`/${sessionUser.username}/dashboard`} />;

      const handleSubmit = (e) => {
        e.preventDefault();
        if (honeyPot) return console.warn("bot detected, input rejected");
        setErrors({});
        return dispatch(sessionActions.login({ credential, password })).catch(
          async (res) => {
            const data = await res.json();
            if (data && data.errors) setErrors(data.errors);
          }
        );
       // history.push(`/${sessionUser.username}/dashboard`);
      };

      return (
        <div className="auth-form-container">
          <form onSubmit={handleSubmit} className="form-container">
            <h1 className="auth-form-title">Log In</h1>
            <label> 
              <input 
                type="text"
                hidden
                id="name__verify"
                name="name__verify"
                onChange={(e) => setHoneyPot(e.target.value)}
                value={honeyPot}
                className="name__verify"
              />
            </label>
            <label className="auth-form-label">
              Username or Email
              <input
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                className="auth-form-input"
                required
              />
            </label>
            <label className="auth-form-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-form-input"
                required
              />
            </label>
            {errors.credential && <p className="auth-form-error">{errors.credential}</p>}
            {errors && errors.password && <p className="auth-form-error">{errors.password}</p>}
            

            <button type="submit" className="auth-form-button">Log In</button>
          </form>
        </div>

      );
    }

    export default LoginFormPage;
                  