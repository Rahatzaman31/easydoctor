import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function AdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState({})

  function handleLogout() {
    localStorage.removeItem('adminLoggedIn')
    navigate('/admin/login')
  }

  const toggleDropdown = (key) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const topMenuItems = [
    { path: '/admin', icon: '📊', label: 'ড্যাশবোর্ড' },
    { path: '/admin/chat', icon: '💬', label: 'ডাক্তারদের সাথে চ্যাট' },
    { path: '/admin/doctors', icon: '👨‍⚕️', label: 'ডাক্তার' },
    { path: '/admin/paid-appointments', icon: '💎', label: 'পেইড সিরিয়াল' },
    { path: '/admin/appointments', icon: '📅', label: 'অ্যাপয়েন্টমেন্ট' },
<<<<<<< HEAD
    { path: '/admin/serial-print', icon: '🖨️', label: 'সিরিয়াল প্রিন্ট' },
=======
>>>>>>> 49bf229bdd66a41754c33f79d8f84d9e809d91cd
  ]

  const dropdownMenus = [
    {
      key: 'products',
      icon: '🛍️',
      label: 'ইজি পণ্য',
      items: [
        { path: '/admin/products', icon: '🛍️', label: 'মেডি পণ্য' },
        { path: '/admin/product-orders', icon: '📦', label: 'পণ্য অর্ডার' },
        { path: '/admin/product-reviews', icon: '⭐', label: 'পণ্য রিভিউ' },
      ]
    },
    {
      key: 'services',
      icon: '🏥',
      label: 'সেবাসমূহ',
      items: [
        { path: '/admin/hospitals', icon: '🏥', label: 'হাসপাতাল ও ডায়াগনস্টিক' },
        { path: '/admin/ambulance', icon: '🚑', label: 'অ্যাম্বুলেন্স সেবা' },
        { path: '/admin/healthcare-providers', icon: '🏛️', label: 'স্বাস্থ্যসেবা প্রদানকারী' },
        { path: '/admin/blogs', icon: '📝', label: 'ব্লগ পোস্ট' },
        { path: '/admin/categories', icon: '📁', label: 'বিভাগসমূহ' },
        { path: '/admin/reviews', icon: '💭', label: 'রিভিউ' },
      ]
    },
    {
      key: 'about',
      icon: '📞',
      label: 'সেবা সম্পর্কে',
      items: [
        { path: '/admin/contact-settings', icon: '📞', label: 'যোগাযোগ সেটিংস' },
        { path: '/admin/about-us', icon: '👥', label: 'আমাদের সম্পর্কে' },
        { path: '/admin/legal-pages', icon: '⚖️', label: 'আইনগত পেজ' },
        { path: '/admin/seo', icon: '🔍', label: 'এসইও সেটিংস' },
      ]
    },
    {
      key: 'ads',
      icon: '📣',
      label: 'বিজ্ঞাপন সেবাসমূহ',
      items: [
        { path: '/admin/banners', icon: '🖼️', label: 'হোম ব্যানার' },
        { path: '/admin/promotional-banners', icon: '📣', label: 'প্রোমোশনাল ব্যানার' },
        { path: '/admin/profile-ad-banners', icon: '🎯', label: 'বিজ্ঞাপন ব্যানার' },
        { path: '/admin/interstitial-ads', icon: '📺', label: 'ইন্টারস্টিশিয়াল বিজ্ঞাপন' },
        { path: '/admin/doctor-portal', icon: '🔐', label: 'ডাক্তার পোর্টাল' },
        { path: '/admin/doctor-packages', icon: '📦', label: 'ডাক্তার প্যাকেজ' },
        { path: '/admin/advertisement-settings', icon: '📣', label: 'বিজ্ঞাপন সেটিংস' },
      ]
    },
  ]

  const bottomMenuItems = [
    { path: '/admin/serial-type-settings', icon: '🔄', label: 'সিরিয়ালের ধরন' },
    { path: '/admin/bkash-settings', icon: '💳', label: 'বিকাশ সেটিংস' },
  ]

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  const isDropdownActive = (items) => {
    return items.some(item => location.pathname === item.path)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700 transition-colors"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white shadow-lg min-h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 border-b">
          <Link to="/" className="flex items-center space-x-2" onClick={handleLinkClick}>
            <img src="/logo-icon.png" alt="ইজি ডক্টর রংপুর" className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover" />
            <span className="text-base lg:text-lg font-bold text-primary-700">ইজি ডক্টর রংপুর</span>
          </Link>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">এডমিন প্যানেল</p>
        </div>

        <nav className="p-2 lg:p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1 lg:space-y-2">
            {topMenuItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-sm lg:text-base ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg lg:text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}

            {dropdownMenus.map(dropdown => (
              <li key={dropdown.key}>
                <button
                  onClick={() => toggleDropdown(dropdown.key)}
                  className={`flex items-center justify-between w-full gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-sm lg:text-base ${
                    isDropdownActive(dropdown.items)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 lg:gap-3">
                    <span className="text-lg lg:text-xl">{dropdown.icon}</span>
                    <span className="font-medium">{dropdown.label}</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${openDropdowns[dropdown.key] ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openDropdowns[dropdown.key] && (
                  <ul className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                    {dropdown.items.map(item => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            location.pathname === item.path
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}

            {bottomMenuItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-sm lg:text-base ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg lg:text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 lg:p-4 border-t bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">লগ আউট</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default AdminSidebar
