import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, isConfigured, getWebPUrl } from '../lib/supabase'
import SerialTypeModal from '../components/SerialTypeModal'

const useSeoMeta = () => {
  useEffect(() => {
    document.title = 'রংপুর জেলার বিশেষজ্ঞ ডাক্তারদের তালিকা ও অনলাইন সিরিয়াল | ইজি ডক্টর রংপুর'
    
    const metaDescription = document.querySelector('meta[name="description"]')
    const descriptionContent = 'রংপুর জেলার সেরা বিশেষজ্ঞ ডাক্তারদের তালিকা। মেডিসিন, কার্ডিওলজি, নিউরোলজি, গাইনি, শিশু বিশেষজ্ঞ সহ সকল বিভাগের ডাক্তার খুঁজুন। অনলাইনে সিরিয়াল নিন।'
    if (metaDescription) {
      metaDescription.setAttribute('content', descriptionContent)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = descriptionContent
      document.head.appendChild(meta)
    }
    
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    const keywordsContent = 'রংপুর ডাক্তার, বিশেষজ্ঞ ডাক্তার রংপুর, অনলাইন সিরিয়াল রংপুর, ডাক্তার এপয়েন্টমেন্ট রংপুর, হৃদরোগ বিশেষজ্ঞ রংপুর, মেডিসিন বিশেষজ্ঞ রংপুর, গাইনি ডাক্তার রংপুর, শিশু বিশেষজ্ঞ রংপুর'
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywordsContent)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'keywords'
      meta.content = keywordsContent
      document.head.appendChild(meta)
    }

    return () => {
      document.title = 'ইজি ডক্টর রংপুর - ডাক্তার অ্যাপয়েন্টমেন্ট বুকিং'
    }
  }, [])
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)])
}

const categories = [
  { id: 'all', name: 'সকল বিভাগ', nameEn: 'সকল', icon: '/icons/services/doctor.png' },
  { id: 'medicine', name: 'মেডিসিন বিশেষজ্ঞ', nameEn: 'মেডিসিন', icon: '/icons/medicine.png' },
  { id: 'cardiology', name: 'হৃদরোগ বিশেষজ্ঞ', nameEn: 'কার্ডিওলজি', icon: '/icons/cardiology.png' },
  { id: 'neurology', name: 'মস্তিষ্ক ও স্নায়ু রোগ বিশেষজ্ঞ', nameEn: 'নিউরোলজি', icon: '/icons/neurology.png' },
  { id: 'gynecology', name: 'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ', nameEn: 'গাইনি', icon: '/icons/gynecology.png' },
  { id: 'pediatrics', name: 'শিশু রোগ বিশেষজ্ঞ', nameEn: 'পেডিয়াট্রিক্স', icon: '/icons/pediatrics.png' },
  { id: 'orthopedics', name: 'হাড় ও জয়েন্ট রোগ বিশেষজ্ঞ', nameEn: 'অর্থোপেডিক্স', icon: '/icons/orthopedics.png' },
  { id: 'ent', name: 'নাক-কান-গলা বিশেষজ্ঞ', nameEn: 'ইএনটি', icon: '/icons/ent.png' },
  { id: 'dermatology', name: 'চর্মরোগ বিশেষজ্ঞ', nameEn: 'ডার্মাটোলজি', icon: '/icons/dermatology.png' },
  { id: 'psychiatry', name: 'মানসিক রোগ বিশেষজ্ঞ', nameEn: 'সাইকিয়াট্রি', icon: '/icons/psychiatry.png' },
  { id: 'ophthalmology', name: 'চক্ষু রোগ বিশেষজ্ঞ', nameEn: 'অফথালমোলজি', icon: '/icons/ophthalmology.png' },
  { id: 'dental', name: 'দন্ত বিশেষজ্ঞ', nameEn: 'ডেন্টাল', icon: '/icons/dental.png' },
  { id: 'surgery', name: 'সার্জারি বিশেষজ্ঞ', nameEn: 'সার্জারি', icon: '/icons/surgery.png' },
  { id: 'oncology', name: 'ক্যান্সার রোগ বিশেষজ্ঞ', nameEn: 'অনকোলজি', icon: '/icons/oncology.png' },
  { id: 'pulmonology', name: 'শ্বাসতন্ত্র রোগ বিশেষজ্ঞ', nameEn: 'পালমোনোলজি', icon: '/icons/pulmonology.png' },
  { id: 'endocrinology', name: 'হরমোন রোগ বিশেষজ্ঞ', nameEn: 'এন্ডোক্রাইনোলজি', icon: '/icons/endocrinology.png' },
  { id: 'anesthesia', name: 'চেতনানাশক বিশেষজ্ঞ', nameEn: 'অ্যানেসথেসিয়া', icon: '/icons/anesthesia.png' },
  { id: 'nephrology', name: 'কিডনি রোগ বিশেষজ্ঞ', nameEn: 'নেফ্রোলজি', icon: '/icons/kidney.png' },
  { id: 'urology', name: 'মূত্রতন্ত্র রোগ বিশেষজ্ঞ', nameEn: 'ইউরোলজি', icon: '/icons/urology.png' },
  { id: 'gastroenterology', name: 'পরিপাকতন্ত্র বিশেষজ্ঞ', nameEn: 'গ্যাস্ট্রো', icon: '/icons/gastroenterology.png' },
  { id: 'rheumatology', name: 'বাত রোগ বিশেষজ্ঞ', nameEn: 'রিউমাটোলজি', icon: '/icons/rheumatology.png' },
  { id: 'pathology', name: 'রোগ নির্ণয় বিশেষজ্ঞ', nameEn: 'প্যাথোলজি', icon: '/icons/pathology.png' },
  { id: 'plastic-surgery', name: 'প্লাস্টিক সার্জন', nameEn: 'প্লাস্টিক সার্জারি', icon: '/icons/plastic-surgery.png' },
  { id: 'physiotherapy', name: 'ফিজিওথেরাপিস্ট', nameEn: 'ফিজিওথেরাপি', icon: '/icons/physiotherapy.png' },
  { id: 'nutrition', name: 'পুষ্টিবিদ', nameEn: 'নিউট্রিশন', icon: '/icons/nutrition.png' },
]

function SpecialistDoctors() {
  const [searchParams] = useSearchParams()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchCategory, setSearchCategory] = useState('all')
  const [showSerialTypeModal, setShowSerialTypeModal] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [sliderIndex, setSliderIndex] = useState(0)
  const [cardsPerPage, setCardsPerPage] = useState(5)
  const isMobile = useIsMobile()
  
  useSeoMeta()

  useEffect(() => {
    const updateCardsPerPage = () => {
      const width = window.innerWidth
      if (width < 640) {
        setCardsPerPage(2)
      } else if (width < 768) {
        setCardsPerPage(3)
      } else if (width < 1024) {
        setCardsPerPage(4)
      } else {
        setCardsPerPage(5)
      }
    }

    updateCardsPerPage()
    window.addEventListener('resize', updateCardsPerPage)
    return () => window.removeEventListener('resize', updateCardsPerPage)
  }, [])

  const totalPages = Math.ceil(categories.length / cardsPerPage)

  useEffect(() => {
    if (sliderIndex >= totalPages) {
      setSliderIndex(Math.max(0, totalPages - 1))
    }
  }, [totalPages, sliderIndex])

  const handleSerialClick = (doctorId) => {
    setSelectedDoctorId(doctorId)
    setShowSerialTypeModal(true)
  }

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl && categories.find(c => c.id === categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl)
      setSearchCategory(categoryFromUrl)
      setHasSearched(true)
      fetchDoctorsByCategory(categoryFromUrl)
    } else {
      fetchTopRatedDoctors()
    }
  }, [searchParams])

  async function fetchTopRatedDoctors() {
    setLoading(true)
    try {
      if (!supabase || !isConfigured) {
        setDoctors([])
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .eq('rating', 5)
        .order('rating', { ascending: false })
      
      if (error) throw error
      setDoctors(data || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchDoctorsByCategory(categoryId) {
    setLoading(true)
    try {
      if (!supabase || !isConfigured) {
        setDoctors([])
        setLoading(false)
        return
      }
      
      let query = supabase.from('doctors').select('*').eq('is_active', true)
      
      if (categoryId === 'all') {
        query = query.eq('rating', 5)
      } else {
        query = query.eq('category', categoryId)
      }

      const { data, error } = await query.order('rating', { ascending: false })
      
      if (error) throw error
      setDoctors(data || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    setLoading(true)
    setHasSearched(true)
    setSearchCategory(selectedCategory)
    try {
      if (!supabase || !isConfigured) {
        setDoctors([])
        setLoading(false)
        return
      }
      
      let query = supabase.from('doctors').select('*').eq('is_active', true)
      
      if (selectedCategory === 'all') {
        query = query.eq('rating', 5)
      } else {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query.order('rating', { ascending: false })
      
      if (error) throw error
      setDoctors(data || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat ? cat.name : categoryId
  }

  const handleSliderPrev = () => {
    setSliderIndex((prev) => (prev > 0 ? prev - 1 : totalPages - 1))
  }

  const handleSliderNext = () => {
    setSliderIndex((prev) => (prev < totalPages - 1 ? prev + 1 : 0))
  }

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
    setHasSearched(true)
    setSearchCategory(categoryId)
    fetchDoctorsByCategory(categoryId)
  }

  const getVisibleCategories = () => {
    const start = sliderIndex * cardsPerPage
    return categories.slice(start, start + cardsPerPage)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white text-sm font-medium">সর্বোচ্চ মানের চিকিৎসা সেবা</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              বিশেষজ্ঞ ডাক্তার
            </h1>
            <p className="text-base sm:text-lg text-primary-100 mb-6">
              খুঁজে নিন আপনার প্রয়োজনমতো
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>যাচাইকৃত ডাক্তার</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>দ্রুত অ্যাপয়েন্টমেন্ট</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>বিশ্বস্ত সেবা</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              বিশেষজ্ঞ বিভাগ নির্বাচন করুন
            </label>
            
            {isMobile ? (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer shadow-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameEn} - {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSliderPrev}
                    className="flex-shrink-0 w-10 h-10 bg-primary-100 hover:bg-primary-200 text-primary-600 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    aria-label="Previous categories"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex-1">
                    <div className="grid grid-cols-4 lg:grid-cols-5 gap-3 py-2">
                      {getVisibleCategories().map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-center hover:shadow-lg transform hover:-translate-y-1 ${
                            selectedCategory === cat.id 
                              ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' 
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary-300 hover:bg-white'
                          }`}
                        >
                          <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-primary-50 to-primary-100 rounded-full flex items-center justify-center p-2 border-2 border-primary-200">
                            <img 
                              src={cat.icon} 
                              alt={cat.name}
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                          <span className="text-xs font-bold text-primary-600 block mb-0.5">{cat.nameEn}</span>
                          <span className="text-xs font-medium line-clamp-2 leading-tight text-gray-500">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSliderNext}
                    className="flex-shrink-0 w-10 h-10 bg-primary-100 hover:bg-primary-200 text-primary-600 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    aria-label="Next categories"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex justify-center gap-1.5 mt-4">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSliderIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        sliderIndex === idx 
                          ? 'bg-primary-600 w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to page ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {hasSearched && searchCategory !== 'all'
                ? getCategoryName(searchCategory)
                : 'টপ রেটেড বিশেষজ্ঞ ডাক্তার'}
            </h2>
            <p className="text-gray-500 mt-1">
              {hasSearched && searchCategory !== 'all'
                ? `পছন্দের ${getCategoryName(searchCategory)} ডাক্তারদের সিরিয়াল নিন`
                : '৫ স্টার রেটিং প্রাপ্ত বিশেষজ্ঞগণ'}
            </p>
          </div>
          {hasSearched && (
            <button 
              onClick={() => {
                setHasSearched(false)
                setSelectedCategory('all')
                fetchTopRatedDoctors()
              }}
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              রিসেট করুন
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
            <p className="text-gray-600 font-medium">ডাক্তার খোঁজা হচ্ছে...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">কোনো ডাক্তার পাওয়া যায়নি</h3>
            <p className="text-gray-500">অন্য বিভাগ নির্বাচন করে আবার চেষ্টা করুন</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doctor => (
              <div key={doctor.id} className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-primary-300">
                <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6">
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shadow-md ${
                      doctor.online_appointment !== false 
                        ? 'bg-green-500 text-white' 
                        : 'bg-orange-500 text-white'
                    }`}>
                      {doctor.online_appointment !== false ? 'online serial' : 'phone serial'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    {doctor.image_url ? (
                      <div className="relative">
                        <img 
                          src={getWebPUrl(doctor.image_url)} 
                          alt={doctor.name}
                          className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-white">
                          <svg className="w-16 h-16 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                          </svg>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 text-center">
                      <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-4 py-1.5 rounded-full font-semibold shadow-lg border border-white/30">
                        {doctor.category_name}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 text-left">
                  <h3 className="font-bold text-xl text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">{doctor.name}</h3>
                  <p className="text-primary-600 font-medium text-sm mb-3 line-clamp-2">{doctor.degrees}</p>
                  
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${star <= Math.round(doctor.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-900 ml-1">{toBengaliNumber(doctor.rating || '0.0')}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">({toBengaliNumber(doctor.reviews_count || 0)} রিভিউ)</span>
                  </div>
                  
                  {doctor.notice && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-amber-700 text-xs font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        জরুরী বিজ্ঞপ্তি আছে
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link to={`/doctor/${doctor.slug || doctor.id}`} className="flex-1 text-center py-3 px-4 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-600 hover:text-white transition-all text-sm group/btn">
                      <span className="flex items-center justify-center gap-1">
                        বিস্তারিত
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Link>
                    {doctor.notice ? (
                      <button disabled className="flex-1 text-center py-3 px-4 bg-gray-400 text-white rounded-xl font-semibold text-sm cursor-not-allowed opacity-75">
                        সিরিয়াল বন্ধ
                      </button>
                    ) : doctor.is_serial_enabled === false ? (
                      <Link 
                        to={`/doctor/${doctor.slug || doctor.id}`}
                        className="flex-1 text-center py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        সিরিয়াল নিন
                      </Link>
                    ) : (
                      <button 
                        onClick={() => handleSerialClick(doctor.id)} 
                        className="flex-1 text-center py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        সিরিয়াল নিন
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SerialTypeModal 
        isOpen={showSerialTypeModal} 
        onClose={() => setShowSerialTypeModal(false)} 
        doctorId={selectedDoctorId} 
      />
    </div>
  )
}

export default SpecialistDoctors
