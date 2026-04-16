import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import db from '@/api/base44Client'

// Exponer el cliente real para que todos los archivos con
// `const db = globalThis.__B44_DB__ || { ...stub... }` usen el SDK real
globalThis.__B44_DB__ = db;

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
