import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage.tsx'
import HomePage from './pages/HomePage.tsx'
import ConsultationPage from './pages/ConsultationPage.tsx'
import VideoConsultationPage from './pages/VideoConsultationPage.tsx'
import SymptomsPage from './pages/SymptomsPage.tsx'
import RecordsPage from './pages/RecordsPage.tsx'
import MedicinesPage from './pages/MedicinesPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import Header from './components/Header.tsx'
import BottomNavigation from './components/BottomNavigation.tsx'
import { useAuth } from './state/AuthContext.tsx'

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(20,83,45,0.45),transparent)]">
      <Header />
      <main className="p-4 max-w-xl mx-auto w-full pb-20">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/consultation" element={<ConsultationPage />} />
        <Route path="/video-consultation" element={<VideoConsultationPage />} />
        <Route path="/symptoms" element={<SymptomsPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/medicines" element={<MedicinesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}