    import React, { useState, useEffect } from "react";
    import { useDispatch, useSelector } from "react-redux";
    import { Route, Switch } from "react-router-dom";
    import LoginFormPage from "./components/LoginFormPage";
    import SignupFormPage from "./components/SignupFormPage";
    import LandingPage from "./components/LandingPage";
    import * as sessionActions from "./store/session";
    import Navigation from "./components/Navigation";
    import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
    import Dashboard from "./components/Dashboard";

    function App() {
      const dispatch = useDispatch();
      const [isLoaded, setIsLoaded] = useState(false);
      const sessionUser = useSelector((state) => state.session.user);
      const history = useHistory();
      
      useEffect(() => {
        dispatch(sessionActions.restoreUser()).then(() => setIsLoaded(true));
        //if (!sessionUser) history.push("/");
        
      }, [dispatch, sessionUser, history]);

      // useEffect(() => {
      //   if (!sessionUser) history.push("/");
      // }, [sessionUser]);


      return (
        <>
          <Navigation isLoaded={isLoaded} className="navbar"/>
          {isLoaded && (
            <Switch>
              
              <Route path="/login">
                <LoginFormPage />
              </Route>
              <Route path="/signup">
                <SignupFormPage />
              </Route>
              {!sessionUser && <Route exact path="/">
                <LandingPage/>
              </Route>}
              {sessionUser && <Route exact path={`/${sessionUser.username}/dashboard`}>
                <Dashboard />

              </Route>}
            </Switch>
          )}
        </>
      );
    }

    export default App;
                  