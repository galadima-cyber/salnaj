import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme BEFORE first paint to prevent flash
const savedTheme = localStorage.getItem('salnaj-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.setAttribute(
  'data-theme',
  savedTheme || (prefersDark ? 'dark' : 'light')
)

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
