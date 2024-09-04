// src/store/session.ts
import { csrfFetch } from './csrf';

const SET_USER = 'session/setUser';
const REMOVE_USER = 'session/removeUser';

const setUser = (user: any) => {
    return {
        type: SET_USER,
        payload: user,
    };
};

const removeUser = () => {
    return {
        type: REMOVE_USER,
    };
};

export const login = (user: { credential: string; password: string }) => async (dispatch: any) => {
    const { credential, password } = user;
    const response = await csrfFetch(`${process.env.REACT_APP_API_URL}/api/session`, {
        method: 'POST',
        body: JSON.stringify({
            credential,
            password,
        }),
    });
    const data = await response.json();
    dispatch(setUser(data.user));
    return response;
};

export const restoreUser = () => async (dispatch: any) => {
    const response = await csrfFetch(`${process.env.REACT_APP_API_URL}/api/session`);
    const data = await response.json();
    dispatch(setUser(data.user));
    return response;
};

export const signup = (user: { username: string; firstName: string; lastName: string; email: string; password: string }) => async (dispatch: any) => {
    const response = await csrfFetch(`${process.env.REACT_APP_API_URL}/api/users`, {
        method: 'POST',
        body: JSON.stringify(user),
    });
    const data = await response.json();
    dispatch(setUser(data.user));
    return response;
};

export const logout = () => async (dispatch: any) => {
    const response = await csrfFetch(`${process.env.REACT_APP_API_URL}/api/session`, {
        method: 'DELETE',
    });
    dispatch(removeUser());
    return response;
};

const initialState = { user: null };

const sessionReducer = (state = initialState, action: any) => {
    let newState;
    switch (action.type) {
        case SET_USER:
            newState = { ...state, user: action.payload };
            return newState;
        case REMOVE_USER:
            newState = { ...state, user: null };
            return newState;
        default:
            return state;
    }
};

export default sessionReducer;
