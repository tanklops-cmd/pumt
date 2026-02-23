import { useState, useEffect } from 'react'
import { getActiveNotifications, dismissNotification, Notification } from '../store'

// Bell icon
const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    // Load initial notifications
    setNotifications(getActiveNotifications())

    // Listen for new notifications
    const handleNewNotification = () => {
      setNotifications(getActiveNotifications())
    }

    // Listen for storage changes
    const handleStorage = () => {
      setNotifications(getActiveNotifications())
    }

    window.addEventListener('notification-added', handleNewNotification)
    window.addEventListener('storage', handleStorage)

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      setNotifications(getActiveNotifications())
    }, 5000)

    return () => {
      window.removeEventListener('notification-added', handleNewNotification)
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  const handleDismiss = (id: string) => {
    dismissNotification(id)
    setNotifications(getActiveNotifications())
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              <span className="text-xs text-slate-500">{notifications.length} unread</span>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800">{notif.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatTime(notif.timestamp)}</p>
                    </div>
                    <button
                      onClick={() => handleDismiss(notif.id)}
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
