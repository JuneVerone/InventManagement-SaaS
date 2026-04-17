// src/main.jsx
//
// The first JS file that runs. Its only job: mount React into the DOM.
//
// createRoot()  finds <div id="root"> in index.html and hands it to React.
// .render()     paints the entire App component tree inside that div.
//
// <StrictMode> is a development-only wrapper. It deliberately renders every
// component TWICE to expose bugs like missing useEffect cleanup.
// Zero effect in production — safe to always include.
//
// import './index.css' — loaded here so global styles apply to the whole app.

import { StrictMode }  from 'react'
import { createRoot }  from 'react-dom/client'
import App             from './App.jsx'
import './index.css'

import { useAuthStore } from './store/authStore'

// Restore session ONCE before mounting React.
// Uses plain fetch so there are no axios/import issues.
// The httpOnly refreshToken cookie is sent automatically by the browser.
const restoreSession = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      const json = await response.json()
      // Directly set state in Zustand store before React mounts
      useAuthStore.setState({
        accessToken: json.data.accessToken,
        user:        json.data.user,
        org:         json.data.org,
        role:        json.data.role,
        isLoading:   false,
      })
    } else {
      useAuthStore.setState({ isLoading: false })
    }
  } catch {
    useAuthStore.setState({ isLoading: false })
  }
}

// Run restore first, then mount React
restoreSession().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})