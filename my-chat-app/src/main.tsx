import React from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
// Components
import App from './App';

axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
