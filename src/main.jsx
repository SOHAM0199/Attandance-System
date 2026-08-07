import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AttendanceProvider } from './context/AttendanceContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AttendanceProvider>
      <App />
    </AttendanceProvider>
  </React.StrictMode>
);
