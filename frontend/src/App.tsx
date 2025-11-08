import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import type { MultiFactorResolver } from 'firebase/auth'
import AdminLandingPage from './components/admin/AdminLandingPage'
import Login from './components/Login'
import Signup from './components/Signup'
import TwoFactorAuth from './components/TwoFactorAuth'
import CommunityLogin from './components/community/CommunityLogin'
import CommunitySignup from './components/community/CommunitySignup'
import AnomalyOverview from './pages/admin/AnomalyOverview'
import WaterSafetyOverview from './pages/community/WaterSafetyOverview'
import { auth } from './config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import './App.css'

type FlowType = 'signup' | 'login';

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentEmail, setCurrentEmail] = useState<string>('')
  const [flowType, setFlowType] = useState<FlowType>('login')
  const [verificationId, setVerificationId] = useState<string>('')
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | undefined>(undefined)
  const [userId, setUserId] = useState<string>('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.setAttribute('data-theme', 'dark')
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsCheckingAuth(false)
      if (user) {
        if (location.pathname.startsWith('/community') && (location.pathname === '/community/login' || location.pathname === '/community/signup')) {
          navigate('/community', { replace: true })
        }
      } else {
        if (location.pathname === '/community' || location.pathname === '/community/dashboard') {
          navigate('/community/login', { replace: true })
        }
        if (location.pathname === '/admin/dashboard') {
          navigate('/admin/login', { replace: true })
        }
      }
    })

    return () => unsubscribe()
  }, [location.pathname, navigate])

  const handleSignupSuccess = (email: string, verificationId?: string, userId?: string) => {
    setCurrentEmail(email)
    setFlowType('signup')
    setVerificationId(verificationId || '')
    setUserId(userId || '')
    navigate('/admin/twofa-signup')
  }

  const handleLoginSuccess = async (email: string, resolver?: MultiFactorResolver) => {
    setCurrentEmail(email)
    setFlowType('login')
    setMfaResolver(resolver)
    
    if (resolver) {
      const result = await import('./services/adminFirebaseAuth').then(module => 
        module.adminFirebaseAuth.sendMFAVerification(resolver, 'recaptcha-container-mfa-login', 0)
      );
      
      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId)
        navigate('/admin/twofa-login')
      } else {
        alert('Failed to send verification code. Please try again.')
      }
    } else {
      navigate('/admin/dashboard')
    }
  }

  const handleVerifySuccess = () => {
    if (flowType === 'signup') {
      setTimeout(() => {
        navigate('/admin/login')
        setCurrentEmail('')
        alert('Account created successfully! Please log in.')
      }, 500)
    } else {
      navigate('/admin/dashboard')
    }
  }

  const handleNavigateToLogin = () => {
    navigate('/admin/login')
    setCurrentEmail('')
  }

  const handleNavigateToSignup = () => {
    navigate('/admin/signup')
    setCurrentEmail('')
  }

  const handleLogout = () => {
    navigate('/admin')
    setCurrentEmail('')
  }

  const handleCommunityLoginSuccess = () => {
    navigate('/community')
  }

  const handleCommunitySignupSuccess = () => {
    navigate('/community')
  }

  const handleNavigateToCommunityLogin = () => {
    navigate('/community/login')
    setCurrentEmail('')
  }

  const handleNavigateToCommunitySignup = () => {
    navigate('/community/signup')
    setCurrentEmail('')
  }

  const handleCommunityLogout = () => {
    navigate('/community/login')
  }

  const handleEnterAdmin = () => {
    navigate('/admin/login')
  }

  if (isCheckingAuth) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#a0a0a0' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <div id="recaptcha-container-mfa-login" style={{ display: 'none' }}></div>
      
      <Routes>
        <Route path="/" element={<Navigate to="/community" replace />} />
        
        <Route path="/admin" element={<AdminLandingPage onEnterAdmin={handleEnterAdmin} />} />
        
        <Route path="/admin/login" element={
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignup={handleNavigateToSignup}
          />
        } />
        
        <Route path="/admin/signup" element={
          <Signup 
            onSignupSuccess={handleSignupSuccess}
            onNavigateToLogin={handleNavigateToLogin}
          />
        } />
        
        <Route path="/admin/twofa-signup" element={
          <TwoFactorAuth 
            email={currentEmail}
            flowType="signup"
            verificationId={verificationId}
            userId={userId}
            onVerifySuccess={handleVerifySuccess}
          />
        } />

        <Route path="/admin/twofa-login" element={
          <TwoFactorAuth 
            email={currentEmail}
            flowType="login"
            verificationId={verificationId}
            resolver={mfaResolver}
            onVerifySuccess={handleVerifySuccess}
          />
        } />

        <Route path="/admin/dashboard" element={<AnomalyOverview onLogout={handleLogout} />} />
        
        <Route path="/community/login" element={
          <CommunityLogin
            onLoginSuccess={handleCommunityLoginSuccess}
            onNavigateToSignup={handleNavigateToCommunitySignup}
          />
        } />

        <Route path="/community/signup" element={
          <CommunitySignup
            onSignupSuccess={handleCommunitySignupSuccess}
            onNavigateToLogin={handleNavigateToCommunityLogin}
          />
        } />

        <Route path="/community" element={<WaterSafetyOverview onLogout={handleCommunityLogout} />} />
        <Route path="/community/dashboard" element={<WaterSafetyOverview onLogout={handleCommunityLogout} />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
