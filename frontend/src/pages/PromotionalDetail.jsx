import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

const themeStyles = {
  congratulation: {
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    bgPattern: 'bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600',
    icon: '🎉',
    badge: 'অভিনন্দন',
    badgeColor: 'bg-pink-100 text-pink-800',
    headerBg: 'bg-gradient-to-r from-pink-50 to-rose-50',
    borderColor: 'border-pink-200',
    decorativeIcons: ['🎊', '✨', '🎉', '🌟', '💐', '🎈'],
    showHeaderBanner: true
  },
  mourning: {
    gradient: 'from-gray-600 via-gray-700 to-gray-800',
    bgPattern: 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800',
    icon: '🕯️',
    badge: 'শোক সংবাদ',
    badgeColor: 'bg-gray-100 text-gray-800',
    headerBg: 'bg-gradient-to-r from-gray-50 to-gray-100',
    borderColor: 'border-gray-300',
    decorativeIcons: [],
    showHeaderBanner: true
  },
  new_chamber: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    bgPattern: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
    icon: '🏥',
    badge: 'নতুন চেম্বার',
    badgeColor: 'bg-blue-100 text-blue-800',
    headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    decorativeIcons: ['🏥', '🏨', '⚕️', '🩺', '💊', '🏛️'],
    showHeaderBanner: true
  },
  promotion: {
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    bgPattern: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600',
    icon: '📢',
    badge: 'বিশেষ আপডেট',
    badgeColor: 'bg-purple-100 text-purple-800',
    headerBg: 'bg-gradient-to-r from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    decorativeIcons: ['⭐', '🌟', '✨', '💫', '🔥', '💎'],
    showHeaderBanner: true
  },
  custom_banner: {
    gradient: 'from-purple-500 via-indigo-500 to-blue-500',
    bgPattern: 'bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600',
    icon: '🖼️',
    badge: 'কাস্টম ব্যানার',
    badgeColor: 'bg-purple-100 text-purple-800',
    headerBg: 'bg-gradient-to-r from-purple-50 to-indigo-50',
    borderColor: 'border-purple-200',
    decorativeIcons: [],
    showHeaderBanner: false
  }
}

function PromotionalDetail() {
  const { id } = useParams()
  const [promotional, setPromotional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPromotional()
  }, [id])

  async function fetchPromotional() {
    try {
      if (!supabase || !isConfigured) {
        setError('ডাটাবেস সংযোগ নেই')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError('তথ্য পাওয়া যায়নি')
        return
      }

      if (data) {
        setPromotional(data)
      }
    } catch (err) {
      console.error('Error fetching promotional:', err)
      setError('কিছু সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (error || !promotional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || 'তথ্য পাওয়া যায়নি'}</h2>
          <p className="text-gray-600 mb-4">আপনি যে তথ্য খুঁজছেন তা এই মুহূর্তে উপলব্ধ নয়।</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            হোম পেজে ফিরে যান
          </Link>
        </div>
      </div>
    )
  }

  const theme = themeStyles[promotional.theme_type] || themeStyles.promotion
  const showHeaderBanner = theme.showHeaderBanner !== false

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeaderBanner && (
        <div className={`relative ${theme.bgPattern} overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMSIvPjxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjEiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50"></div>
          
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48cGF0dGVybiBpZD0iZGlhZyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMCAxMEwxMCAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNkaWFnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-40"></div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
          
          {theme.decorativeIcons?.length > 0 && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {theme.decorativeIcons.map((icon, index) => (
                <span 
                  key={index}
                  className="absolute text-3xl md:text-4xl opacity-[0.08] select-none"
                  style={{
                    top: `${15 + (index * 18) % 70}%`,
                    left: `${8 + (index * 16) % 85}%`,
                    transform: `rotate(${index * 12 - 25}deg)`
                  }}
                >
                  {icon}
                </span>
              ))}
              {theme.decorativeIcons.map((icon, index) => (
                <span 
                  key={`b-${index}`}
                  className="absolute text-2xl md:text-3xl opacity-[0.06] select-none"
                  style={{
                    bottom: `${10 + (index * 15) % 60}%`,
                    right: `${5 + (index * 14) % 80}%`,
                    transform: `rotate(${-index * 18 + 20}deg)`
                  }}
                >
                  {icon}
                </span>
              ))}
            </div>
          )}
          
          <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-16">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {promotional.image_url && (
                <div className="flex-shrink-0">
                  <div className={`w-32 h-32 md:w-40 md:h-40 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30 overflow-hidden ${promotional.theme_type === 'mourning' ? 'grayscale' : ''}`}>
                    <img 
                      src={promotional.image_url} 
                      alt={promotional.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div className="text-center md:text-left">
                <div className={`inline-flex items-center gap-2 ${theme.badgeColor} px-4 py-1.5 rounded-full mb-4`}>
                  <span className="text-lg">{theme.icon}</span>
                  <span className="text-sm font-medium">{theme.badge}</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                  {promotional.detailed_title || promotional.title}
                </h1>
                
                {promotional.subtitle && (
                  <p className="text-white/80 text-base sm:text-lg max-w-2xl">
                    {promotional.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-4xl mx-auto px-4 ${showHeaderBanner ? 'py-8 sm:py-12' : 'pt-4 pb-8 sm:pb-12'}`}>
        <div className={`bg-white rounded-2xl shadow-lg border ${theme.borderColor} overflow-hidden`}>
          <div className={`${theme.headerBg} px-6 py-4 border-b ${theme.borderColor}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{theme.icon}</span>
              <h2 className="text-lg font-semibold text-gray-800">বিস্তারিত তথ্য</h2>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            {promotional.detailed_image_url && (
              <div className="mb-8">
                <img 
                  src={promotional.detailed_image_url} 
                  alt="বিস্তারিত ছবি"
                  className={`w-full max-h-96 object-cover rounded-xl shadow-md ${promotional.theme_type === 'mourning' ? 'grayscale' : ''}`}
                />
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              {promotional.detailed_content ? (
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {promotional.detailed_content}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  বিস্তারিত তথ্য এখনো যোগ করা হয়নি।
                </p>
              )}
            </div>
            
            {promotional.related_entity_name && (
              <div className={`mt-8 p-4 ${theme.headerBg} rounded-xl border ${theme.borderColor}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${theme.badgeColor} rounded-full flex items-center justify-center`}>
                    {promotional.related_entity_type === 'doctor' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {promotional.related_entity_type === 'hospital' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                    {!promotional.related_entity_type && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {promotional.related_entity_type === 'doctor' ? 'সংশ্লিষ্ট ডাক্তার' : 
                       promotional.related_entity_type === 'hospital' ? 'সংশ্লিষ্ট হাসপাতাল' : 'সংশ্লিষ্ট'}
                    </p>
                    <p className="font-medium text-gray-800">{promotional.related_entity_name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            হোম পেজে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PromotionalDetail
