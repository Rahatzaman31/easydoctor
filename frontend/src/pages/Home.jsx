import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import FeaturedDoctorsSlider from '../components/FeaturedDoctorsSlider'
import FeaturedHospitals from '../components/FeaturedHospitals'
import FeaturedProducts from '../components/FeaturedProducts'
import Footer from '../components/Footer'

const defaultBanner = {
  title: 'রংপুর বিভাগের সেরা ডাক্তারদের কাছে',
  subtitle: 'সহজেই অনলাইনে অ্যাপয়েন্টমেন্ট নিন। আপনার স্বাস্থ্য আমাদের অগ্রাধিকার।',
  badge_text: 'সর্বোচ্চ মানের চিকিৎসা সেবা',
  show_badge: true,
  primary_button_text: 'বিশেষজ্ঞ ডাক্তার',
  primary_button_link: '/rangpur-specialist-doctors-list-online-serial',
  show_primary_button: true,
  secondary_button_text: 'যোগাযোগ করুন',
  secondary_button_link: '/contact',
  show_secondary_button: true,
  background_image_url: '/images/banner-bg.png',
  overlay_color: '#1e40af',
  overlay_opacity: 0.75,
  feature_1_text: 'যাচাইকৃত ডাক্তার',
  feature_1_icon: 'verified',
  show_feature_1: true,
  feature_2_text: 'দ্রুত অ্যাপয়েন্টমেন্ট',
  feature_2_icon: 'clock',
  show_feature_2: true,
  feature_3_text: 'বিশ্বস্ত সেবা',
  feature_3_icon: 'heart',
  show_feature_3: true,
}

const categories = [
  { id: 'medicine', title: 'মেডিসিন', name: 'মেডিসিন বিশেষজ্ঞ', icon: '/icons/medicine.png', isImage: true },
  { id: 'cardiology', title: 'হৃদরোগ', name: 'হৃদরোগ বিশেষজ্ঞ', icon: '/icons/cardiology.png', isImage: true },
  { id: 'neurology', title: 'নিউরোলজি', name: 'মস্তিষ্ক ও স্নায়ু রোগ বিশেষজ্ঞ', icon: '/icons/neurology.png', isImage: true },
  { id: 'gynecology', title: 'স্ত্রীরোগ', name: 'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ', icon: '/icons/gynecology.png', isImage: true },
  { id: 'pediatrics', title: 'শিশু', name: 'শিশু রোগ বিশেষজ্ঞ', icon: '/icons/pediatrics.png', isImage: true },
  { id: 'orthopedics', title: 'অর্থোপেডিক্স', name: 'হাড় ও জয়েন্ট রোগ বিশেষজ্ঞ', icon: '/icons/orthopedics.png', isImage: true },
  { id: 'ent', title: 'নাক-কান-গলা', name: 'নাক-কান-গলা বিশেষজ্ঞ', icon: '/icons/ent.png', isImage: true },
  { id: 'dermatology', title: 'চর্মরোগ', name: 'চর্মরোগ বিশেষজ্ঞ', icon: '/icons/dermatology.png', isImage: true },
  { id: 'psychiatry', title: 'মানসিক', name: 'মানসিক রোগ বিশেষজ্ঞ', icon: '/icons/psychiatry.png', isImage: true },
  { id: 'ophthalmology', title: 'চক্ষু', name: 'চক্ষু রোগ বিশেষজ্ঞ', icon: '/icons/ophthalmology.png', isImage: true },
  { id: 'dental', title: 'দন্ত', name: 'দন্ত বিশেষজ্ঞ', icon: '/icons/dental.png', isImage: true },
  { id: 'surgery', title: 'সার্জারি', name: 'সার্জারি বিশেষজ্ঞ', icon: '/icons/surgery.png', isImage: true },
  { id: 'oncology', title: 'ক্যান্সার', name: 'ক্যান্সার রোগ বিশেষজ্ঞ', icon: '/icons/oncology.png', isImage: true },
  { id: 'pulmonology', title: 'ফুসফুস', name: 'শ্বাসতন্ত্র রোগ বিশেষজ্ঞ', icon: '/icons/pulmonology.png', isImage: true },
  { id: 'endocrinology', title: 'হরমোন', name: 'হরমোন রোগ বিশেষজ্ঞ', icon: '/icons/endocrinology.png', isImage: true },
  { id: 'anesthesia', title: 'চেতনানাশক', name: 'চেতনানাশক বিশেষজ্ঞ', icon: '/icons/anesthesia.png', isImage: true },
  { id: 'nephrology', title: 'কিডনি', name: 'কিডনি রোগ বিশেষজ্ঞ', icon: '/icons/kidney.png', isImage: true },
  { id: 'urology', title: 'মূত্রতন্ত্র', name: 'মূত্রতন্ত্র রোগ বিশেষজ্ঞ', icon: '/icons/urology.png', isImage: true },
  { id: 'gastroenterology', title: 'পরিপাকতন্ত্র', name: 'পরিপাকতন্ত্র বিশেষজ্ঞ', icon: '/icons/gastroenterology.png', isImage: true },
  { id: 'rheumatology', title: 'বাত ব্যাথা', name: 'বাত রোগ বিশেষজ্ঞ', icon: '/icons/rheumatology.png', isImage: true },
  { id: 'pathology', title: 'প্যাথলজি', name: 'রোগ নির্ণয় বিশেষজ্ঞ', icon: '/icons/pathology.png', isImage: true },
  { id: 'plastic-surgery', title: 'প্লাস্টিক সার্জারি', name: 'প্লাস্টিক সার্জন', icon: '/icons/plastic-surgery.png', isImage: true },
  { id: 'physiotherapy', title: 'ফিজিওথেরাপি', name: 'ফিজিওথেরাপিস্ট', icon: '/icons/physiotherapy.png', isImage: true },
  { id: 'nutrition', title: 'পুষ্টি', name: 'পুষ্টিবিদ', icon: '/icons/nutrition.png', isImage: true },
]

const FeatureIcon = ({ type }) => {
  switch (type) {
    case 'verified':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    case 'clock':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'heart':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      )
    default:
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
  }
}

const themeStyles = {
  congratulation: {
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    bgPattern: 'bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600',
    icon: '🎉',
    badge: 'অভিনন্দন',
    badgeColor: 'bg-pink-100 text-pink-800',
    decorativeIcons: ['🎊', '✨', '🎉', '🌟', '💐', '🎈'],
    buttonTextColor: 'text-pink-700'
  },
  mourning: {
    gradient: 'from-gray-600 via-gray-700 to-gray-800',
    bgPattern: 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800',
    icon: '🕯️',
    badge: 'শোক সংবাদ',
    badgeColor: 'bg-gray-200 text-gray-800',
    decorativeIcons: [],
    buttonTextColor: 'text-gray-700'
  },
  new_chamber: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    bgPattern: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
    icon: '🏥',
    badge: 'নতুন চেম্বার',
    badgeColor: 'bg-blue-100 text-blue-800',
    decorativeIcons: ['🏥', '🏨', '⚕️', '🩺', '💊', '🏛️'],
    buttonTextColor: 'text-indigo-700'
  },
  promotion: {
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    bgPattern: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600',
    icon: '📢',
    badge: 'বিশেষ আপডেট',
    badgeColor: 'bg-purple-100 text-purple-800',
    decorativeIcons: ['⭐', '🌟', '✨', '💫', '🔥', '💎'],
    buttonTextColor: 'text-purple-700'
  },
  custom_banner: {
    gradient: 'from-purple-500 via-indigo-500 to-blue-500',
    bgPattern: 'bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600',
    icon: '🖼️',
    badge: 'বিশেষ প্রচার',
    badgeColor: 'bg-purple-100 text-purple-800',
    decorativeIcons: [],
    buttonTextColor: 'text-purple-700',
    isCustom: true
  }
}

const API_URL = import.meta.env.VITE_API_URL || ''

function Home() {
  const [banner, setBanner] = useState(defaultBanner)
  const [promotionalBanner, setPromotionalBanner] = useState(null)
  const [bannerReady, setBannerReady] = useState(false)
  const [mediProductsVisible, setMediProductsVisible] = useState(false)

  useEffect(() => {
    fetchBanner()
    fetchPromotionalBanner()
    fetchSiteSettings()
  }, [])

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

  async function fetchBanner() {
    try {
      if (!supabase || !isConfigured) {
        setBannerReady(true)
        return
      }
      
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .eq('is_active', true)
        .single()
      
      if (error) {
        console.log('Using default banner')
        setBannerReady(true)
        return
      }
      
      if (data) {
        setBanner({
          ...defaultBanner,
          ...data,
          background_image_url: data.background_image_url || defaultBanner.background_image_url
        })
      }
      setBannerReady(true)
    } catch (error) {
      console.error('Error fetching banner:', error)
      setBannerReady(true)
    }
  }

  async function fetchPromotionalBanner() {
    try {
      if (!supabase || !isConfigured) return
      
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .single()
      
      if (error) {
        console.log('No promotional banner found')
        return
      }
      
      if (data) {
        setPromotionalBanner(data)
      }
    } catch (error) {
      console.error('Error fetching promotional banner:', error)
    }
  }

  const overlayStyle = {
    backgroundColor: banner.overlay_color,
    opacity: banner.overlay_opacity
  }

  return (
    <div>
      <section className="relative min-h-[320px] md:min-h-[380px] flex items-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${banner.background_image_url})` }}
        />
        
        <div 
          className="absolute inset-0"
          style={overlayStyle}
        />
        
        <div 
          className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"
        />
        
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                {banner.title}
              </h1>
              
              <p className="text-sm md:text-base lg:text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
                {banner.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
                {banner.show_primary_button && (
                  <Link 
                    to={banner.primary_button_link}
                    className="group relative inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 min-w-[160px]"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {banner.primary_button_text}
                  </Link>
                )}
                
                {banner.show_secondary_button && (
                  <Link 
                    to={banner.secondary_button_link}
                    className="group inline-flex items-center justify-center gap-2 bg-white/10 text-white border-2 border-white/50 px-6 py-3 rounded-full font-semibold text-sm hover:bg-white hover:text-primary-700 transition-all duration-300 min-w-[160px]"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {banner.secondary_button_text}
                  </Link>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                {banner.show_feature_1 && (
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <FeatureIcon type={banner.feature_1_icon} />
                    </div>
                    <span className="font-medium text-sm">{banner.feature_1_text}</span>
                  </div>
                )}
                {banner.show_feature_2 && (
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <FeatureIcon type={banner.feature_2_icon} />
                    </div>
                    <span className="font-medium text-sm">{banner.feature_2_text}</span>
                  </div>
                )}
                {banner.show_feature_3 && (
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <FeatureIcon type={banner.feature_3_icon} />
                    </div>
                    <span className="font-medium text-sm">{banner.feature_3_text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            বিশেষজ্ঞ বিভাগ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link 
                key={cat.id} 
                to={`/rangpur-specialist-doctors-list-online-serial?category=${cat.id}`}
                className="card text-center hover:border-primary-500 border-2 border-transparent"
              >
                <img src={cat.icon} alt={cat.title} className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-semibold text-lg text-gray-800">{cat.title}</h3>
                <p className="text-gray-500 text-sm">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {promotionalBanner && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {promotionalBanner.theme_type === 'custom_banner' && (promotionalBanner.custom_banner_desktop_url || promotionalBanner.custom_banner_mobile_url) ? (
              <div className="relative overflow-hidden rounded-3xl shadow-md">
                {promotionalBanner.custom_banner_desktop_url && (
                  <img 
                    src={promotionalBanner.custom_banner_desktop_url}
                    alt={promotionalBanner.title || 'Promotional Banner'}
                    className="hidden md:block w-full h-auto object-cover"
                  />
                )}
                {promotionalBanner.custom_banner_mobile_url && (
                  <img 
                    src={promotionalBanner.custom_banner_mobile_url}
                    alt={promotionalBanner.title || 'Promotional Banner'}
                    className="block md:hidden w-full h-auto object-cover"
                  />
                )}
                {!promotionalBanner.custom_banner_mobile_url && promotionalBanner.custom_banner_desktop_url && (
                  <img 
                    src={promotionalBanner.custom_banner_desktop_url}
                    alt={promotionalBanner.title || 'Promotional Banner'}
                    className="block md:hidden w-full h-auto object-cover"
                  />
                )}
                
                {promotionalBanner.enable_details_button && (
                  <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
                    {promotionalBanner.use_external_link && promotionalBanner.external_link ? (
                      <a 
                        href={promotionalBanner.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm text-purple-700 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                      >
                        {promotionalBanner.button_text || 'বিস্তারিত জানুন'}
                        <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </a>
                    ) : (
                      <Link 
                        to={`/promotional/${promotionalBanner.id}`}
                        className="group inline-flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm text-purple-700 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                      >
                        {promotionalBanner.button_text || 'বিস্তারিত জানুন'}
                        <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={`relative overflow-hidden ${themeStyles[promotionalBanner.theme_type]?.bgPattern || themeStyles.promotion.bgPattern} rounded-3xl shadow-md`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMSIvPjxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjEiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-60"></div>
                
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48cGF0dGVybiBpZD0iZGlhZyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMCAxMEwxMCAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNkaWFnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50"></div>
                
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
                
                {themeStyles[promotionalBanner.theme_type]?.decorativeIcons?.length > 0 && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {themeStyles[promotionalBanner.theme_type].decorativeIcons.map((icon, index) => (
                      <span 
                        key={index}
                        className="absolute text-4xl md:text-5xl opacity-[0.08] select-none"
                        style={{
                          top: `${10 + (index * 15) % 80}%`,
                          left: `${5 + (index * 17) % 90}%`,
                          transform: `rotate(${index * 15 - 30}deg)`,
                          animationDelay: `${index * 0.5}s`
                        }}
                      >
                        {icon}
                      </span>
                    ))}
                    {themeStyles[promotionalBanner.theme_type].decorativeIcons.map((icon, index) => (
                      <span 
                        key={`r-${index}`}
                        className="absolute text-3xl md:text-4xl opacity-[0.06] select-none"
                        style={{
                          top: `${20 + (index * 20) % 70}%`,
                          right: `${10 + (index * 13) % 85}%`,
                          transform: `rotate(${-index * 20 + 15}deg)`
                        }}
                      >
                        {icon}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="relative px-6 py-10 md:px-12 md:py-14 lg:py-16">
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    {promotionalBanner.image_url && (
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className={`w-28 h-28 md:w-36 md:h-36 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/30 overflow-hidden ${promotionalBanner.theme_type === 'mourning' ? 'grayscale' : ''}`}>
                            <img 
                              src={promotionalBanner.image_url} 
                              alt={promotionalBanner.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-xl">
                            {themeStyles[promotionalBanner.theme_type]?.icon || '📢'}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!promotionalBanner.image_url && (
                      <div className="flex-shrink-0 hidden sm:block">
                        <div className="relative">
                          <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                            <span className="text-5xl md:text-6xl">
                              {themeStyles[promotionalBanner.theme_type]?.icon || '📢'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 text-center lg:text-left">
                      <div className={`inline-flex items-center gap-2 ${themeStyles[promotionalBanner.theme_type]?.badgeColor || 'bg-white/20 text-white'} backdrop-blur-sm px-4 py-1.5 rounded-full mb-4`}>
                        <span className="text-sm font-medium">
                          {themeStyles[promotionalBanner.theme_type]?.badge || 'বিশেষ আপডেট'}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                        {promotionalBanner.title}
                      </h3>
                      
                      {promotionalBanner.subtitle && (
                        <p className="text-white/80 text-base md:text-lg mb-6 max-w-2xl">
                          {promotionalBanner.subtitle}
                        </p>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        {promotionalBanner.enable_details_button && (
                          promotionalBanner.use_external_link && promotionalBanner.external_link ? (
                            <a 
                              href={promotionalBanner.external_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`group inline-flex items-center justify-center gap-3 bg-white ${themeStyles[promotionalBanner.theme_type]?.buttonTextColor || 'text-purple-700'} px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {promotionalBanner.button_text || 'বিস্তারিত জানুন'}
                              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </a>
                          ) : (
                            <Link 
                              to={`/promotional/${promotionalBanner.id}`}
                              className={`group inline-flex items-center justify-center gap-3 bg-white ${themeStyles[promotionalBanner.theme_type]?.buttonTextColor || 'text-purple-700'} px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {promotionalBanner.button_text || 'বিস্তারিত জানুন'}
                              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </Link>
                          )
                        )}
                        
                        {promotionalBanner.related_entity_name && (
                          <div className="flex items-center justify-center gap-3 text-white/80">
                            <span className="text-sm">{promotionalBanner.related_entity_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <FeaturedDoctorsSlider />

      {mediProductsVisible && <FeaturedProducts />}

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            আপনার জন্য তৈরি স্বাস্থ্যসেবা সুরক্ষা
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 border border-blue-100 group">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                <img src="/icons/services/doctor.png" alt="Doctor" className="w-12 h-12 object-contain" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-3">বিশেষজ্ঞ ডাক্তার</h3>
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                রংপুর বিভাগের বিশ্বস্ত বিশেষজ্ঞ ডাক্তারদের খুঁজুন। সহজেই BMDC যাচাইকৃত ডাক্তারদের সাথে অ্যাপয়েন্টমেন্ট নিন।
              </p>
              <Link to="/rangpur-specialist-doctors-list-online-serial" className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-300">
                ডাক্তার খুঁজুন
              </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 border border-purple-100 group">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                <img src="/icons/services/hospital.png" alt="Hospital" className="w-12 h-12 object-contain" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-3">হাসপাতাল ও ডায়াগনস্টিক</h3>
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                রংপুর বিভাগের সকল হাসপাতাল, ক্লিনিক ও ডায়াগনস্টিক সেন্টার সম্পর্কে তথ্য পান এবং সেবা নিন।
              </p>
              <Link to="/hospitals-diagnostics" className="inline-block px-6 py-2.5 bg-purple-600 text-white rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-purple-300">
                হাসপাতাল খুঁজুন
              </Link>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 border border-rose-100 group">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                <img src="/icons/services/ambulance.png" alt="Ambulance" className="w-12 h-12 object-contain" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-3">অ্যাম্বুলেন্স সেবা</h3>
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                জরুরি প্রয়োজনে AC ও Non-AC অ্যাম্বুলেন্স সেবা পান। দ্রুত ও নির্ভরযোগ্য পরিবহন সেবা নিশ্চিত করুন।
              </p>
              <Link to="/ambulance" className="inline-block px-6 py-2.5 bg-rose-600 text-white rounded-full text-sm font-semibold hover:bg-rose-700 transition-colors shadow-lg hover:shadow-rose-300">
                অ্যাম্বুলেন্স খুঁজুন
              </Link>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 border border-teal-100 group">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                <img src="/icons/services/blog.png" alt="Blog" className="w-12 h-12 object-contain" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-3">স্বাস্থ্য ব্লগ</h3>
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                স্বাস্থ্য বিষয়ক সর্বশেষ তথ্য,<br />টিপস ও আপডেট জানুন।<br />সচেতন থাকুন, সুস্থ থাকুন।
              </p>
              <Link to="/blog" className="inline-block px-6 py-2.5 bg-teal-600 text-white rounded-full text-sm font-semibold hover:bg-teal-700 transition-colors shadow-lg hover:shadow-teal-300">
                ব্লগ পড়ুন
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
            
            <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:flex items-center justify-center opacity-20">
              <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            
            <div className="relative px-6 py-10 md:px-12 md:py-14 lg:py-16">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0 hidden sm:block">
                  <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                      <div className="text-center">
                        <svg className="w-12 h-12 md:w-16 md:h-16 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-white/90 text-xs font-medium mt-1 block">ব্লগ</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <svg className="w-5 h-5 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span className="text-white/90 text-sm font-medium">নতুন আপডেট</span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                    নিয়মিত স্বাস্থ্য বিষয়ক আপডেট পেতে
                    <br className="hidden sm:block" />
                    <span className="text-yellow-300">আমাদের ব্লগের সাথে যুক্ত থাকুন</span>
                  </h3>
                  
                  <p className="text-white/80 text-base md:text-lg mb-6 max-w-2xl">
                    স্বাস্থ্য সচেতনতা, রোগ প্রতিরোধ, পুষ্টি টিপস এবং বিশেষজ্ঞ পরামর্শ সম্পর্কে জানুন। 
                    আপনার এবং পরিবারের সুস্বাস্থ্যের জন্য প্রয়োজনীয় সকল তথ্য এক জায়গায়।
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link 
                      to="/blog"
                      className="group inline-flex items-center justify-center gap-3 bg-white text-emerald-700 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      ব্লগ পড়ুন
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                    
                    <div className="flex items-center justify-center gap-3 text-white/80">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white">২০+</div>
                      </div>
                      <span className="text-sm">স্বাস্থ্য বিষয়ক আর্টিকেল</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              <span className="w-8 h-1.5 bg-white/60 rounded-full"></span>
              <span className="w-2 h-1.5 bg-white/30 rounded-full"></span>
              <span className="w-2 h-1.5 bg-white/30 rounded-full"></span>
            </div>
          </div>
        </div>
      </section>

      <FeaturedHospitals />

      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-900 to-indigo-950"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              কেন আমাদের <span className="bg-gradient-to-r from-cyan-400 via-primary-400 to-indigo-400 bg-clip-text text-transparent">বেছে নেবেন?</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              রংপুর বিভাগের সবচেয়ে বিশ্বস্ত স্বাস্থ্যসেবা প্ল্যাটফর্ম হিসেবে আমরা আপনার সেবায় নিবেদিত
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-white mb-2">সময় বাঁচান</h3>
                <p className="text-white/60 text-sm leading-relaxed">লাইনে দাঁড়ানোর ঝামেলা নেই, ঘরে বসেই সিরিয়াল নিন</p>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-emerald-400/50 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-white mb-2">বিশ্বস্ত ডাক্তার</h3>
                <p className="text-white/60 text-sm leading-relaxed">রংপুর বিভাগের অভিজ্ঞ ও যাচাইকৃত ডাক্তারগণ</p>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-violet-400/50 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-white mb-2">সহজ যোগাযোগ</h3>
                <p className="text-white/60 text-sm leading-relaxed">ডাক্তারের চেম্বার ও যোগাযোগের তথ্য সহজেই পাবেন</p>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-amber-400/50 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-white mb-2">সাশ্রয়ী মূল্যে</h3>
                <p className="text-white/60 text-sm leading-relaxed">প্রিমিয়াম সুবিধা</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
