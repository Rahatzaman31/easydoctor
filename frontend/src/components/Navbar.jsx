import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [mediProductsVisible, setMediProductsVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    async function fetchSiteSettings() {
      try {
        const response = await fetch(`${API_URL}/api/site-settings`)
        const result = await response.json()
        if (result.success && result.data) {
          setMediProductsVisible(result.data.medi_products_visible || false)
        }
      } catch (error) {
        console.error('Error fetching site settings:', error)
      }
    }
    fetchSiteSettings()
  }, [])

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo-icon.png" alt="ইজি ডক্টর রংপুর" className="w-10 h-10 rounded-full object-cover" />
            <span className="text-xl font-bold text-primary-700">ইজি ডক্টর রংপুর</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`font-medium transition-all ${
                location.pathname === '/' 
                  ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              হোম
            </Link>
            <Link 
              to="/rangpur-specialist-doctors-list-online-serial" 
              className={`font-medium transition-all ${
                location.pathname === '/rangpur-specialist-doctors-list-online-serial' || location.pathname === '/specialist-doctors'
                  ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              বিশেষজ্ঞ ডাক্তার
            </Link>
            <Link 
              to="/hospitals-diagnostics" 
              className={`font-medium transition-all ${
                location.pathname === '/hospitals-diagnostics' 
                  ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              হাসপাতাল ও ডায়াগনস্টিক
            </Link>
            <Link 
              to="/ambulance" 
              className={`font-medium transition-all ${
                location.pathname === '/ambulance' 
                  ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              অ্যাম্বুলেন্স
            </Link>
            <Link 
              to="/blog" 
              className={`font-medium transition-all ${
                location.pathname === '/blog' || location.pathname.startsWith('/blog/') 
                  ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              স্বাস্থ্য ব্লগ
            </Link>
            {mediProductsVisible && (
              <Link 
                to="/medi-products" 
                className={`font-medium transition-all ${
                  location.pathname === '/medi-products' || location.pathname.startsWith('/product/') 
                    ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                মেডি পণ্য
              </Link>
            )}
            <Link 
              to="/about-us" 
              className={`font-medium transition-all ${
                location.pathname === '/about-us' 
                  ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              আমাদের সম্পর্কে
            </Link>
            <Link 
              to="/contact" 
              className={`font-medium transition-all ${
                location.pathname === '/contact' 
                  ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              যোগাযোগ
            </Link>
            <Link to="/download" className="btn-primary">ডাউনলোড</Link>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 p-2 focus:outline-none"
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
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link 
              to="/" 
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              হোম
            </Link>
            <Link 
              to="/rangpur-specialist-doctors-list-online-serial" 
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === '/rangpur-specialist-doctors-list-online-serial' || location.pathname === '/specialist-doctors'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              বিশেষজ্ঞ ডাক্তার
            </Link>
            <Link 
              to="/hospitals-diagnostics" 
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === '/hospitals-diagnostics'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              হাসপাতাল ও ডায়াগনস্টিক
            </Link>
            <Link 
              to="/ambulance" 
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === '/ambulance'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              অ্যাম্বুলেন্স
            </Link>
            <Link 
              to="/blog" 
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === '/blog' || location.pathname.startsWith('/blog/')
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              স্বাস্থ্য ব্লগ
            </Link>
            {mediProductsVisible && (
              <Link 
                to="/medi-products" 
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                  location.pathname === '/medi-products' || location.pathname.startsWith('/product/')
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                মেডি পণ্য
              </Link>
            )}
            <Link 
              to="/about-us" 
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === '/about-us'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              আমাদের সম্পর্কে
            </Link>
            <Link 
              to="/contact" 
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === '/contact'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              যোগাযোগ
            </Link>
            <div className="pt-2 pb-1">
              <Link 
                to="/download" 
                onClick={() => setIsOpen(false)}
                className="block w-full text-center px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                ডাউনলোড
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
