import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function DoctorAdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const doctorName = localStorage.getItem('doctorName') || 'ডাক্তার'

  const menuItems = [
    { path: '/doctor.admin', icon: '📊', label: 'ড্যাশবোর্ড' },
    { path: '/doctor.admin/profile', icon: '👤', label: 'আমার প্রোফাইল' },
    { path: '/doctor.admin/appointments', icon: '📅', label: 'সাধারন সিরিয়াল' },
    { path: '/doctor.admin/blog-posts', icon: '📝', label: 'আমার ব্লগ পোষ্ট' },
    { path: '/doctor.admin/packages', icon: '📦', label: 'প্যাকেজ' },
    { path: '/doctor.admin/advertisements', icon: '📣', label: 'বিজ্ঞাপন' },
  ]

  function handleLogout() {
    localStorage.removeItem('doctorLoggedIn')
    localStorage.removeItem('doctorId')
    localStorage.removeItem('doctorName')
    localStorage.removeItem('doctorAccessCode')
    navigate('/doctor.admin/login')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-md"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-teal-700 to-teal-900 text-white transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <div>
              <h2 className="font-bold text-lg">ডাক্তার প্যানেল</h2>
              <p className="text-teal-200 text-sm truncate max-w-[150px]">{doctorName}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white text-teal-700 shadow-lg'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-teal-600">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-200 rounded-xl hover:bg-red-500/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>লগআউট</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default DoctorAdminSidebar
