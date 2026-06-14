import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import App from './App.jsx'
import './index.css'

// Portal (auth + dashboards) is code-split so the marketing homepage stays fast.
const PortalRoot = lazy(() => import('./portal/PortalRoot.jsx'))

function FullLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 text-purple-500">
      <Loader2 className="animate-spin" size={28} />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Suspense fallback={<FullLoader />}><PortalRoot /></Suspense>} />
        <Route path="/app/*" element={<Suspense fallback={<FullLoader />}><PortalRoot /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
