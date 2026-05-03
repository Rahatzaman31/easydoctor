import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

function SerialTypeModal({ isOpen, onClose, doctorId }) {
  const navigate = useNavigate()
  const [showTermsPopup, setShowTermsPopup] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [settings, setSettings] = useState({
    show_serial_options: true,
    terms_popup_title: 'সিরিয়াল দিতে যা মেনে চলতে হবে',
    terms_popup_subtitle: 'সাধারন সিরিয়াল নিতে হলে নিচের নিয়মগুলো মেনে চলতে হবে',
    terms_popup_checkbox_text: 'আমি উপরের সকল শর্তাবলী পড়েছি এবং মেনে চলতে সম্মত আছি',
    terms_popup_button_text: 'পরবর্তী ধাপে যান',
    terms_points: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  async function fetchSettings() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('serial_type_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings({
          show_serial_options: data.show_serial_options ?? true,
          terms_popup_title: data.terms_popup_title || settings.terms_popup_title,
          terms_popup_subtitle: data.terms_popup_subtitle || settings.terms_popup_subtitle,
          terms_popup_checkbox_text: data.terms_popup_checkbox_text || settings.terms_popup_checkbox_text,
          terms_popup_button_text: data.terms_popup_button_text || settings.terms_popup_button_text,
          terms_points: data.terms_points || []
        })
        
        if (!data.show_serial_options) {
          setShowTermsPopup(true)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleProceedToBooking() {
    if (termsAccepted) {
      setShowTermsPopup(false)
      onClose()
      navigate(`/book/${doctorId}`)
    }
  }

  function handleCloseTermsPopup() {
    setShowTermsPopup(false)
    setTermsAccepted(false)
    onClose()
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div className="relative bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (showTermsPopup && !settings.show_serial_options) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-purple-900/90 to-gray-900/95 backdrop-blur-md" onClick={handleCloseTermsPopup}></div>
        
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-fade-in my-4 max-h-[95vh] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>
          
          <button 
            onClick={handleCloseTermsPopup}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10 shadow-md"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 shadow-xl animate-pulse">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">{settings.terms_popup_title}</h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">{settings.terms_popup_subtitle}</p>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6">
              {settings.terms_points.map((point, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">{point.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border-2 border-purple-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                    termsAccepted 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg scale-110' 
                      : 'border-gray-300 bg-white group-hover:border-purple-400'
                  }`}>
                    {termsAccepted && (
                      <svg className="w-4 h-4 text-white animate-bounce-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">{settings.terms_popup_checkbox_text}</span>
              </label>
            </div>

            <button
              onClick={handleProceedToBooking}
              disabled={!termsAccepted}
              className={`w-full py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                termsAccepted
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {termsAccepted && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
              {settings.terms_popup_button_text}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              চেকবক্সে টিক দিয়ে আপনার সম্মতি নিশ্চিত করুন
            </p>
          </div>
        </div>
      </div>
    )
  }

  const paidBenefits = [
    { icon: '1️⃣', text: 'সিরিয়াল প্রথমে হবে - অপেক্ষার সময় কম' },
    { icon: '👨‍💼', text: 'আমাদের একজন প্রতিনিধি উপস্থিত থাকবে' },
    { icon: '📄', text: 'প্রেসক্রিপশন অনলাইনে থাকবে - বুকিং আইডি দিয়ে ডাউনলোড করা যাবে' },
    { icon: '💊', text: 'আমাদের কাছে ঔষুধ কিনলে ১০% ডিসকাউন্ট পাবেন' }
  ]

  const regularDrawbacks = [
    { icon: '⏳', text: 'সিরিয়াল মধ্যে বা শেষের দিকে হয় - অনেক সময় নষ্ট হয়' },
    { icon: '❌', text: 'আমাদের কোনো প্রতিনিধি উপস্থিত থাকবে না' },
    { icon: '📵', text: 'প্রেসক্রিপশন ডাউনলোড করার সুবিধা থাকবে না' },
    { icon: '💊', text: 'আমাদের কাছে ঔষুধ কিনলে ১০% ডিসকাউন্ট পাবেন' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-fade-in my-4 max-h-[95vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="sticky top-2 sm:top-4 right-2 sm:right-4 ml-auto w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10 mb-2"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-6 md:p-8 pt-0">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">সিরিয়ালের ধরণ বাছাই করুন</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">পেইড সিরিয়াল নিলে আপনার সময় ও টাকা দুটোই সাশ্রয় হবে</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-xl p-4 sm:p-5 md:p-6 flex flex-col">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-pink-700">পেইড সিরিয়াল</h3>
                  <p className="text-pink-600 text-xs sm:text-sm">প্রিমিয়াম সুবিধা সহ</p>
                </div>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-grow">
                {paidBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-base sm:text-lg flex-shrink-0">{benefit.icon}</span>
                    <span className="text-gray-700 text-xs sm:text-sm leading-relaxed">{benefit.text}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-pink-200/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-pink-800 text-xs sm:text-sm font-medium text-center">
                  বিকাশ পেমেন্ট এর মাধ্যমে বুকিং নিশ্চিত করুন
                </p>
              </div>

              <Link 
                to={`/paid-book/${doctorId}`}
                onClick={onClose}
                className="block w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-center py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                পেইড সিরিয়াল নিন
              </Link>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 sm:p-5 md:p-6 flex flex-col">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-700">সাধারন সিরিয়াল</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">বেসিক সুবিধা</p>
                </div>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-grow">
                {regularDrawbacks.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                    <span className="text-gray-600 text-xs sm:text-sm leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-gray-200/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-gray-600 text-xs sm:text-sm font-medium text-center">
                  বিনামূল্যে বুকিং - চেম্বারে ফি প্রদান করুন
                </p>
              </div>

              <Link 
                to={`/book/${doctorId}`}
                onClick={onClose}
                className="block w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-center py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                সাধারন সিরিয়াল নিন
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SerialTypeModal
