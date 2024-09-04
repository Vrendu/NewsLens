// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './session';
import thunk from 'redux-thunk';

const store = configureStore({
    reducer: {
        session: sessionReducer,
    },
    middleware: [thunk],
});

export default store;
