import { useUi } from '../state/UiContext'
import { FiMapPin, FiMenu } from 'react-icons/fi'
import Sidebar from './Sidebar'
import { useTranslation } from '../contexts/LanguageContext'

export default function Header() {
  const { locationText, setSidebarOpen } = useUi()
  const { t } = useTranslation()

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100 dark:bg-gray-950/70 dark:supports-[backdrop-filter]:bg-gray-950/50 dark:border-gray-900">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700 flex items-center gap-2 dark:text-gray-200">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              <FiMapPin size={16} />
            </span>
            <div>
              <div className="font-medium leading-tight">{locationText}</div>
              <div className="text-[11px] text-gray-500 leading-none dark:text-gray-400">{t('common.currentLocation')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900 transition-colors"
              aria-label={t('common.openMenu')}
            >
              <FiMenu size={18} />
            </button>
          </div>
        </div>
      </header>
      <Sidebar />
    </>
  )
}


