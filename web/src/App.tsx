import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage.tsx'
import SignUpStep1 from './pages/signup/SignUpStep1'
import SignUpStep2 from './pages/signup/SignUpStep2'
import SignUpStep3 from './pages/signup/SignUpStep3'
import HomePage from './pages/HomePage.tsx'
import ConsultationPage from './pages/ConsultationPage.tsx'
import VideoConsultationPage from './pages/VideoConsultationPage.tsx'
import SymptomsPage from './pages/SymptomsPage.tsx'
import RecordsPage from './pages/RecordsPage.tsx'
import TriageDetailPage from './pages/TriageDetailPage.tsx'
import MedicinesPage from './pages/MedicinesPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import Header from './components/Header.tsx'
import BottomNavigation from './components/BottomNavigation.tsx'
import { useAuth } from './state/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext.tsx'
import { UiProvider } from './state/UiContext'
import ThemeProvider from './components/ThemeProvider.tsx'

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.12),transparent)] dark:bg-gray-950 dark:text-gray-100 dark:bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
      <Header />
      <main className="p-4 max-w-xl mx-auto w-full pb-28 pb-[calc(64px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}

export default function App() {
  return (
    <UiProvider>
      <LanguageProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpStep1 />} />
            <Route path="/signup/info" element={<SignUpStep2 />} />
            <Route path="/signup/equipment" element={<SignUpStep3 />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/consultation" element={<ConsultationPage />} />
              <Route path="/video-consultation" element={<VideoConsultationPage />} />
              <Route path="/symptoms" element={<SymptomsPage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/records/triage/:id" element={<TriageDetailPage />} />
              <Route path="/medicines" element={<MedicinesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </ThemeProvider>
      </LanguageProvider>
    </UiProvider>
  )
}