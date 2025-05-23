import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Layout components
import Layout from './components/Layout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import XrayUpload from './pages/XrayUpload'
import MriUpload from './pages/MriUpload'
import CtUpload from './pages/CtUpload'
import ReportUpload from './pages/ReportUpload'
import VoiceAssistant from './pages/VoiceAssistant'
import NotFound from './pages/NotFound'

// Auth context
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="xray" element={<XrayUpload />} />
          <Route path="mri" element={<MriUpload />} />
          <Route path="ct" element={<CtUpload />} />
          <Route path="report" element={<ReportUpload />} />
          <Route path="voice-assistant" element={<VoiceAssistant />} />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App 
