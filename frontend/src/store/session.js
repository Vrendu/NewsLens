import { csrfFetch } from "./csrf";

const SET_USER = "session/setUser";
const REMOVE_USER = "session/removeUser";

const setUser = (user) => {
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

export const login = (user) => async (dispatch) => {
  const { credential, password } = user;
  const response = await csrfFetch("/api/session", {
    method: "POST",
    body: JSON.stringify({
      credential,
      password,
    }),
  });
  const data = await response.json();
  dispatch(setUser(data.user));

  // Sync with localStorage
  localStorage.setItem('user', JSON.stringify(data.user));
  console.log("data.user", data.user);

  return response;
};

export const restoreUser = () => async (dispatch, getState) => {
  const { session } = getState();
  if (session.user) return; // If user is already authenticated, no need to restore
  const response = await csrfFetch("/api/session");
  const data = await response.json();
  dispatch(setUser(data.user));

  // Sync with localStorage
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return response;
};

export const signup = (user) => async (dispatch) => {
  const { username, firstName, lastName, email, password } = user;
  const response = await csrfFetch("/api/users", {
    method: "POST",
    body: JSON.stringify({
      username,
      firstName,
      lastName,
      email,
      password,
    }),
  });
  const data = await response.json();
  dispatch(setUser(data.user));

  // Sync with localStorage
  localStorage.setItem('user', JSON.stringify(data.user));

  return response;
};

export const logout = () => async (dispatch) => {
  const response = await csrfFetch('/api/session', {
    method: 'DELETE',
  });
  dispatch(removeUser());

  // Clear localStorage on logout
  localStorage.removeItem('user');
  console.log("removed user", localStorage.getItem('user'));
  return response;
};

const initialState = { user: null };

const sessionReducer = (state = initialState, action) => {
  let newState;
  switch (action.type) {
    case SET_USER:
      newState = Object.assign({}, state);
      newState.user = action.payload;
      return newState;
    case REMOVE_USER:
      newState = Object.assign({}, state);
      newState.user = null;
      return newState;
    default:
      return state;
  }
};

export default sessionReducer;
