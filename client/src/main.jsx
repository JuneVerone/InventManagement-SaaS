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

import { StrictMode }   from 'react'
import { createRoot }   from 'react-dom/client'
import App              from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)