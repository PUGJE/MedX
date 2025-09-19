import { useUi } from '../state/UiContext'
import { useAuth } from '../state/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { FiX, FiUser, FiSun, FiMoon, FiGlobe, FiLogOut } from 'react-icons/fi'

export default function Sidebar() {
  const { 
    theme, 
    setTheme, 
    isSidebarOpen, 
    setSidebarOpen 
  } = useUi()
  const { language, setLanguage, availableLanguages } = useLanguage()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setSidebarOpen(false)
    navigate('/login', { replace: true })
  }

  const handleProfileClick = () => {
    navigate('/profile')
    setSidebarOpen(false)
  }

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (!isSidebarOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-[70] transform transition-transform duration-300 ease-in-out pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <FiGlobe className="inline w-4 h-4 mr-2" />
                Language
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-gray-800 text-white">
                    {lang.flag} {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {theme === 'light' ? (
                  <FiSun className="inline w-4 h-4 mr-2" />
                ) : (
                  <FiMoon className="inline w-4 h-4 mr-2" />
                )}
                Theme
              </label>
              <button
                onClick={handleThemeToggle}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                {theme === 'light' ? (
                  <FiSun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <FiMoon className="w-5 h-5 text-blue-500" />
                )}
              </button>
            </div>

            {/* Profile */}
            <div>
              <button
                onClick={handleProfileClick}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
              >
                <FiUser className="w-5 h-5 mr-3 text-teal-500" />
                <span>Profile Settings</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full rounded-lg border border-red-300 dark:border-red-600 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center"
            >
              <FiLogOut className="w-5 h-5 mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
