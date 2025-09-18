import { useLocation, useNavigate } from 'react-router-dom'
import { FiHome, FiMessageCircle, FiActivity, FiFileText, FiPackage } from 'react-icons/fi'
import { useTranslation } from '../contexts/LanguageContext'

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { path: '/home', icon: FiHome, label: t('nav.home') },
    { path: '/consultation', icon: FiMessageCircle, label: t('nav.consultation') },
    { path: '/symptoms', icon: FiActivity, label: t('nav.symptoms') },
    { path: '/records', icon: FiFileText, label: t('nav.records') },
    { path: '/medicines', icon: FiPackage, label: t('nav.medicines') },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 dark:bg-gray-900/80 dark:border-gray-700 z-30">
      <div className="max-w-xl mx-auto px-4 py-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                isActive(path)
                  ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
