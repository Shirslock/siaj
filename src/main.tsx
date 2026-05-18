import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import '@material-symbols/font-400/outlined.css'

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
    </BrowserRouter>
  </React.StrictMode>
)
