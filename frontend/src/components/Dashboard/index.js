import React from "react";
import { useDispatch, useSelector } from "react-redux";
import * as sessionActions from "../../store/session";
import { useEffect } from "react";

const Dashboard = () => {
    const sessionUser = useSelector((state) => state.session.user);
    const dispatch = useDispatch();

    // useEffect(() => {
    //     dispatch(sessionActions.restoreUser());
    // }, [dispatch]);
    
    return (
        <div>
            <h1>{sessionUser.username}'s Dashboard</h1>
        </div>
    );
};

export default Dashboard;