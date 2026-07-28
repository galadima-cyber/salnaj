import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme before first paint — prevents flash
const savedTheme = localStorage.getItem('salnaj-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.setAttribute(
  'data-theme',
  savedTheme || (prefersDark ? 'dark' : 'light')
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
