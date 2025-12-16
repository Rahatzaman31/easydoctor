import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)])
}

function FeaturedDoctorsSlider() {
  const [featuredDoctors, setFeaturedDoctors] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const sliderRef = useRef(null)
  const autoSlideRef = useRef(null)

  useEffect(() => {
    fetchFeaturedDoctors()
  }, [])

  useEffect(() => {
    if (featuredDoctors.length > 0) {
      startAutoSlide()
    }
    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
      }
    }
  }, [featuredDoctors])

  function startAutoSlide() {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
    }
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const maxIndex = Math.max(0, featuredDoctors.length - getVisibleCards())
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 5000)
  }

  function getVisibleCards() {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 4
      if (window.innerWidth >= 768) return 3
      if (window.innerWidth >= 640) return 2
    }
    return 1
  }

  async function fetchFeaturedDoctors() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(10)
      
      if (error) throw error
      setFeaturedDoctors(data || [])
    } catch (error) {
      console.error('Error fetching featured doctors:', error)
      setFeaturedDoctors([])
    } finally {
      setLoading(false)
    }
  }

  function handlePrev() {
    setCurrentIndex(prev => prev <= 0 ? Math.max(0, featuredDoctors.length - getVisibleCards()) : prev - 1)
    startAutoSlide()
  }

  function handleNext() {
    const maxIndex = Math.max(0, featuredDoctors.length - getVisibleCards())
    setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1)
    startAutoSlide()
  }

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
            বর্তমানে শীর্ষে অবস্থানরত
          </h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    )
  }

  if (featuredDoctors.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gradient-to-r from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-6">
          বর্তমানে শীর্ষে অবস্থানরত
        </h2>
        
        <div className="relative">
          <button 
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-all -ml-2 md:-ml-5"
            aria-label="পূর্ববর্তী ডাক্তার দেখুন"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-all -mr-2 md:-mr-5"
            aria-label="পরবর্তী ডাক্তার দেখুন"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <div className="overflow-hidden px-6 md:px-8" ref={sliderRef}>
            <div 
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{ transform: `translateX(-${currentIndex * (100 / getVisibleCards())}%)` }}
            >
              {featuredDoctors.map(doctor => (
                <div 
                  key={doctor.id} 
                  className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-slate-200 hover:border-teal-500">
                    <div className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4">
                      <div className="absolute top-2 right-2 bg-teal-500 px-2 py-1 rounded-full">
                        <span className="text-xs font-bold text-white">শীর্ষ</span>
                      </div>
                      <div className="flex flex-col items-center">
                        {doctor.image_url ? (
                          <img 
                            src={doctor.image_url} 
                            alt={doctor.name}
                            className="w-24 h-24 object-cover rounded-full border-3 border-white shadow-lg"
                            width="96"
                            height="96"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <svg className="w-12 h-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                          </div>
                        )}
                        <h3 className="mt-3 font-bold text-white text-center text-sm">{doctor.name}</h3>
                        <p className="text-slate-300 text-xs text-center line-clamp-2">{doctor.degrees}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-col gap-2">
                        <span className="block w-full text-center border-2 border-teal-500 text-teal-600 py-2 rounded-lg text-sm font-semibold bg-transparent">
                          {doctor.category_name}
                        </span>
                        <Link 
                          to={`/doctor/${doctor.slug || doctor.id}`}
                          className="block w-full text-center bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 rounded-lg text-sm font-semibold hover:from-teal-700 hover:to-teal-800 transition-all"
                        >
                          বিস্তারিত দেখুন
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-6 gap-2" role="tablist" aria-label="স্লাইডার পেজিনেশন">
          {Array.from({ length: Math.ceil(featuredDoctors.length / getVisibleCards()) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx * getVisibleCards())
                startAutoSlide()
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                Math.floor(currentIndex / getVisibleCards()) === idx 
                  ? 'bg-teal-600 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`স্লাইড ${idx + 1} এ যান`}
              aria-selected={Math.floor(currentIndex / getVisibleCards()) === idx}
              role="tab"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedDoctorsSlider
