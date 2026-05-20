import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import App from './App'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'

// Restaurar ruta desde redirect de 404.html
const params = new URLSearchParams(window.location.search)
const redirect = params.get('p')
if (redirect) {
  window.history.replaceState(
    null, '',
    import.meta.env.BASE_URL + redirect.replace(/^\//, '')
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        toastStyle={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#1b3a57',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
