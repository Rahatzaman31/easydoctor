import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [visibleCards, setVisibleCards] = useState(4)
  const sliderRef = useRef(null)
  const autoSlideRef = useRef(null)

  const getVisibleCards = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 4
      if (window.innerWidth >= 768) return 3
      if (window.innerWidth >= 640) return 2
    }
    return 1
  }, [])

  useEffect(() => {
    fetchFeaturedDoctors()
    
    const handleResize = () => {
      setVisibleCards(getVisibleCards())
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getVisibleCards])

  useEffect(() => {
    if (featuredDoctors.length > 0) {
      startAutoSlide()
    }
    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
      }
    }
  }, [featuredDoctors, visibleCards])

  function startAutoSlide() {
    if (autoSlideRef.current) {
      clearTimeout(autoSlideRef.current)
    }
    autoSlideRef.current = setTimeout(() => {
      setCurrentIndex(prev => {
        const totalSlides = Math.ceil(featuredDoctors.length / visibleCards)
        return (prev + 1) % totalSlides
      })
      startAutoSlide()
    }, 5000)
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
    const totalSlides = Math.ceil(featuredDoctors.length / visibleCards)
    setCurrentIndex(prev => (prev - 1 + totalSlides) % totalSlides)
    startAutoSlide()
  }

  function handleNext() {
    const totalSlides = Math.ceil(featuredDoctors.length / visibleCards)
    setCurrentIndex(prev => (prev + 1) % totalSlides)
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

  const totalSlides = Math.ceil(featuredDoctors.length / visibleCards)

  return (
    <section className="py-12 bg-gradient-to-r from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-6">
          বর্তমানে শীর্ষে অবস্থানরত
        </h2>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={handlePrev}
            className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition-all border-2 border-slate-200 hover:border-teal-500"
            aria-label="পূর্ববর্তী ডাক্তার দেখুন"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 overflow-hidden" ref={sliderRef}>
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div 
                  key={slideIndex}
                  className="flex-shrink-0 w-full flex gap-3 md:gap-4"
                >
                  {featuredDoctors
                    .slice(slideIndex * visibleCards, (slideIndex + 1) * visibleCards)
                    .map(doctor => (
                      <div 
                        key={doctor.id} 
                        className="flex-1 min-w-0"
                      >
                        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-slate-200 hover:border-teal-500 h-full">
                          <div className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4">
                            <div className="absolute top-2 right-2 bg-teal-600 px-2 py-1 rounded-full">
                              <span className="text-xs font-bold text-white">শীর্ষ</span>
                            </div>
                            <div className="flex flex-col items-center">
                              {doctor.image_url ? (
                                <img 
                                  src={doctor.image_url} 
                                  alt={doctor.name}
                                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full border-3 border-white shadow-lg"
                                  width="96"
                                  height="96"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
                                  <svg className="w-10 h-10 md:w-12 md:h-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                  </svg>
                                </div>
                              )}
                              <h3 className="mt-3 font-bold text-white text-center text-sm line-clamp-1">{doctor.name}</h3>
                              <p className="text-slate-300 text-xs text-center line-clamp-2 min-h-[2rem]">{doctor.degrees}</p>
                            </div>
                          </div>
                          <div className="p-3 md:p-4">
                            <div className="flex flex-col gap-2">
                              <span className="block w-full text-center border-2 border-teal-500 text-teal-600 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold bg-transparent line-clamp-1">
                                {doctor.category_name}
                              </span>
                              <Link 
                                to={`/doctor/${doctor.slug || doctor.id}`}
                                className="block w-full text-center bg-gradient-to-r from-teal-600 to-teal-700 text-white py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold hover:from-teal-700 hover:to-teal-800 transition-all"
                              >
                                বিস্তারিত দেখুন
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={handleNext}
            className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition-all border-2 border-slate-200 hover:border-teal-500"
            aria-label="পরবর্তী ডাক্তার দেখুন"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex justify-center mt-6 gap-3" role="tablist" aria-label="স্লাইডার পেজিনেশন">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx)
                startAutoSlide()
              }}
              className={`rounded-full transition-all min-w-10 min-h-10 flex items-center justify-center ${
                currentIndex === idx 
                  ? 'bg-teal-600 w-10 h-10' 
                  : 'w-3 h-3 bg-gray-400 hover:bg-gray-500'
              }`}
              aria-label={`স্লাইড ${idx + 1} এ যান`}
              aria-selected={currentIndex === idx}
              role="tab"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedDoctorsSlider
