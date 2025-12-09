import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { supabase, isConfigured } from '../lib/supabase'
import SerialTypeModal from '../components/SerialTypeModal'

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)])
}

const weekDaysList = [
  { id: 'saturday', name: 'শনিবার' },
  { id: 'sunday', name: 'রবিবার' },
  { id: 'monday', name: 'সোমবার' },
  { id: 'tuesday', name: 'মঙ্গলবার' },
  { id: 'wednesday', name: 'বুধবার' },
  { id: 'thursday', name: 'বৃহস্পতিবার' },
  { id: 'friday', name: 'শুক্রবার' },
]

const getReviewDisplayDaysAgo = (reviewId, index, totalReviews) => {
  if (index === 0 && totalReviews > 0) {
    return 0.5
  }
  
  let hash = 0
  const idStr = String(reviewId)
  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const minDays = 2
  const maxDays = 45
  const daysAgo = minDays + Math.abs(hash % (maxDays - minDays + 1))
  return daysAgo
}

const getRelativeTimeBengali = (daysAgo) => {
  if (daysAgo < 1) {
    return '১২ ঘন্টা আগে'
  } else if (daysAgo === 1) {
    return '১ দিন আগে'
  } else {
    return `${toBengaliNumber(Math.round(daysAgo))} দিন আগে`
  }
}

function DoctorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [doctorId, setDoctorId] = useState(null)
  const [expertise, setExpertise] = useState([])
  const [reviews, setReviews] = useState([])
  const [promotedDoctors, setPromotedDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFullAbout, setShowFullAbout] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewFormData, setReviewFormData] = useState({
    patient_name: '',
    email: '',
    phone: '',
    appointment_code: '',
    rating: 5,
    review_text: ''
  })
  const [showSerialTypeModal, setShowSerialTypeModal] = useState(false)
  const [adBanner, setAdBanner] = useState(null)

  useEffect(() => {
    fetchDoctor()
  }, [id])
  
  useEffect(() => {
    if (doctorId) {
      fetchExpertise()
      fetchReviews()
      fetchAdBanner()
    }
  }, [doctorId])

  useEffect(() => {
    if (doctor?.category) {
      fetchPromotedDoctors()
    }
  }, [doctor?.category, id])

  async function fetchDoctor() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      
      let data = null
      let error = null
      
      if (isUUID(id)) {
        const result = await supabase
          .from('doctors')
          .select('*')
          .eq('id', id)
          .single()
        data = result.data
        error = result.error
        
        if (data?.slug) {
          navigate(`/doctor/${data.slug}`, { replace: true })
          return
        }
      } else {
        const result = await supabase
          .from('doctors')
          .select('*')
          .eq('slug', id)
          .single()
        data = result.data
        error = result.error
        
        if (error || !data) {
          const uuidResult = await supabase
            .from('doctors')
            .select('*')
            .eq('id', id)
            .single()
          data = uuidResult.data
          error = uuidResult.error
        }
      }
      
      if (error) throw error
      setDoctor(data)
      setDoctorId(data?.id)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchExpertise() {
    try {
      if (!supabase || !isConfigured || !doctorId) return
      const { data, error } = await supabase
        .from('doctor_expertise')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('id', { ascending: true })
      
      if (error) throw error
      setExpertise(data || [])
    } catch (error) {
      console.error('Error fetching expertise:', error)
    }
  }

  async function fetchReviews() {
    try {
      if (!supabase || !isConfigured || !doctorId) return
      const { data, error } = await supabase
        .from('doctor_reviews')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  async function fetchAdBanner() {
    try {
      if (!supabase || !isConfigured || !doctorId) return
      setAdBanner(null)
      const { data, error } = await supabase
        .from('profile_ad_banner_doctors')
        .select(`
          banner_id,
          profile_ad_banners!inner (
            id,
            title,
            image_url,
            link_url,
            mobile_image_url,
            is_active
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('profile_ad_banners.is_active', true)
        .limit(1)
        .maybeSingle()
      
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching ad banner:', error)
        }
        return
      }
      
      if (data?.profile_ad_banners) {
        setAdBanner(data.profile_ad_banners)
      }
    } catch (error) {
      console.error('Error fetching ad banner:', error)
    }
  }

  async function fetchPromotedDoctors() {
    try {
      if (!supabase || !isConfigured || !doctor?.category || !doctorId) return
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('category', doctor.category)
        .eq('is_category_promoted', true)
        .eq('is_active', true)
        .neq('id', doctorId)
        .order('promoted_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(2)
      
      if (error) throw error
      setPromotedDoctors(data || [])
    } catch (error) {
      console.error('Error fetching promoted doctors:', error)
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    setSubmittingReview(true)
    
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }
      
      const { error } = await supabase
        .from('doctor_reviews')
        .insert([{
          doctor_id: doctorId,
          patient_name: reviewFormData.patient_name,
          email: reviewFormData.email,
          phone: reviewFormData.phone,
          appointment_code: reviewFormData.appointment_code,
          rating: reviewFormData.rating,
          review_text: reviewFormData.review_text,
          status: 'pending'
        }])
      
      if (error) throw error
      
      setShowReviewForm(false)
      setShowSuccessModal(true)
      setReviewFormData({
        patient_name: '',
        email: '',
        phone: '',
        appointment_code: '',
        rating: 5,
        review_text: ''
      })
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('রিভিউ জমা দিতে সমস্যা হয়েছে')
    } finally {
      setSubmittingReview(false)
    }
  }

  const stripHtmlTags = (html) => {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
  }

  const shouldShowReadMore = (text) => {
    if (!text) return false
    const plainText = stripHtmlTags(text)
    return plainText.length > 500
  }

  const getTruncatedHtml = (html) => {
    if (!html) return ''
    const plainText = stripHtmlTags(html)
    if (plainText.length <= 500) return html
    return plainText.substring(0, 500) + '...'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const getBackUrl = () => {
    if (doctor?.category) {
      return `/rangpur-specialist-doctors-list-online-serial?category=${doctor.category}`
    }
    return '/rangpur-specialist-doctors-list-online-serial'
  }

  const getBannerLink = () => {
    if (!adBanner) return null
    return adBanner.link_url
  }

  const getBannerImageUrl = () => {
    if (!adBanner) return null
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    if (isMobile && adBanner.mobile_image_url) {
      return adBanner.mobile_image_url
    }
    return adBanner.image_url
  }

  if (!doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800">ডাক্তার পাওয়া যায়নি</h1>
        <Link to="/rangpur-specialist-doctors-list-online-serial" className="btn-primary mt-4 inline-block">ফিরে যান</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none">
      {adBanner && (
        <div className="mb-4">
          {getBannerLink() ? (
            <a 
              href={getBannerLink()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <img 
                src={getBannerImageUrl()} 
                alt={adBanner.title}
                className="w-full h-auto object-contain max-h-[120px] md:max-h-[120px]"
              />
            </a>
          ) : (
            <div className="overflow-hidden rounded-lg shadow-sm">
              <img 
                src={getBannerImageUrl()} 
                alt={adBanner.title}
                className="w-full h-auto object-contain max-h-[120px] md:max-h-[120px]"
              />
            </div>
          )}
        </div>
      )}

      <Link 
        to={getBackUrl()} 
        className="inline-flex items-center gap-2 bg-white hover:bg-primary-50 text-primary-600 px-4 py-2 rounded-full shadow-md hover:shadow-lg border border-primary-100 transition-all duration-300 mb-6 group"
      >
        <span className="w-8 h-8 bg-primary-100 group-hover:bg-primary-200 rounded-full flex items-center justify-center transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </span>
        <span className="font-medium">ফিরে যান</span>
      </Link>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6 text-left">
            {doctor.image_url ? (
              <img 
                src={doctor.image_url} 
                alt={doctor.name}
                className="w-36 h-36 object-cover rounded-2xl border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-36 h-36 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-20 h-20 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">{doctor.name}</h1>
              <p className="text-primary-100 mt-2">{doctor.category_name}</p>
              
              <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
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
                  <span className="text-lg font-semibold ml-1">{toBengaliNumber(doctor.rating || '0.0')}</span>
                </div>
                <div className="text-primary-200">
                  ({toBengaliNumber(doctor.reviews_count || 0)} রিভিউ)
                </div>
              </div>
            </div>
          </div>
        </div>

        {doctor.notice && (
          <div className="mx-4 mt-4 -mb-4 md:mx-8">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-amber-800 font-semibold text-lg">জরুরী বিজ্ঞপ্তি</h3>
                  <p className="text-amber-700 mt-1 whitespace-pre-line">{doctor.notice}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-left">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">তথ্য</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">ডিগ্রি</p>
                    <p className="text-gray-800 font-medium">{doctor.degrees}</p>
                  </div>
                </div>
                {(doctor.workplace_line1 || doctor.workplace_line2) && (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">বর্তমান কর্মস্থল</p>
                      {doctor.workplace_line1 && <p className="text-gray-800 font-medium">{doctor.workplace_line1}</p>}
                      {doctor.workplace_line2 && <p className="text-gray-800 font-medium">{doctor.workplace_line2}</p>}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">চেম্বার</p>
                    <p className="text-gray-800">{doctor.chamber_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">জেলা</p>
                    <p className="text-gray-800">{doctor.district}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">পরামর্শ ফি</p>
                    <p className="text-gray-800 text-xl font-semibold">{toBengaliNumber(doctor.consultation_fee)} টাকা</p>
                  </div>
                </div>
                {doctor.phone && (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">ফোন</p>
                      <p className="text-gray-800">{doctor.phone}</p>
                    </div>
                  </div>
                )}
                {doctor.visiting_card_url && (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">ভিজিটিং কার্ড</p>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(doctor.visiting_card_url)
                            const blob = await response.blob()
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            const fileName = `visiting-card-${doctor.name.replace(/\s+/g, '-')}.${doctor.visiting_card_url.split('.').pop().split('?')[0] || 'jpg'}`
                            link.download = fileName
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            window.URL.revokeObjectURL(url)
                          } catch (error) {
                            window.open(doctor.visiting_card_url, '_blank')
                          }
                        }}
                        className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <span>কার্ড ডাউনলোড করুন</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-left">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">সময়সূচি</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                {(() => {
                  let scheduleDays = []
                  try {
                    scheduleDays = doctor.schedule_days ? JSON.parse(doctor.schedule_days) : []
                  } catch (e) {
                    scheduleDays = []
                  }
                  
                  if (scheduleDays.length === 0 && !doctor.schedule_time) {
                    return <p className="text-gray-700">সময়সূচি উল্লেখ করা হয়নি</p>
                  }
                  
                  return (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">দিন:</p>
                        <div className="flex flex-wrap gap-2">
                          {weekDaysList.map(day => {
                            const isWorkingDay = scheduleDays.includes(day.id)
                            return (
                              <span 
                                key={day.id} 
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  isWorkingDay 
                                    ? 'bg-primary-100 text-primary-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {day.name}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      {doctor.schedule_time && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">সময়:</p>
                          <p className="text-gray-800 font-medium">{doctor.schedule_time}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {doctor.about && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">পরিচিতি</h2>
                  {showFullAbout ? (
                    <div 
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doctor.about) }}
                    />
                  ) : (
                    <div className="text-gray-700">
                      {getTruncatedHtml(doctor.about)}
                    </div>
                  )}
                  {shouldShowReadMore(doctor.about) && (
                    <button
                      onClick={() => setShowFullAbout(!showFullAbout)}
                      className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-flex items-center gap-1"
                    >
                      {showFullAbout ? (
                        <>
                          সংক্ষেপে দেখুন
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          আরো পড়ুন
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            {doctor.notice ? (
              <div className="text-center">
                <button 
                  disabled 
                  className="w-full bg-gray-400 text-white text-lg py-3 rounded-lg cursor-not-allowed opacity-75"
                >
                  সিরিয়াল বন্ধ আছে
                </button>
                <p className="text-sm text-gray-500 mt-2">জরুরী বিজ্ঞপ্তি দেখুন</p>
              </div>
            ) : doctor.is_serial_enabled === false ? (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-amber-800 mb-2">অনলাইন সিরিয়াল বন্ধ আছে</h4>
                    <p className="text-amber-700 text-sm mb-4">
                      ডাক্তারের সিরিয়াল নিতে উপরে তথ্য সেকশনে প্রদত্ত ফোন নম্বরে কল করুন অথবা ভিজিটিং কার্ড ডাউনলোড করুন।
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {doctor.phone && (
                        <a 
                          href={`tel:${doctor.phone}`}
                          className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          কল করুন
                        </a>
                      )}
                      {doctor.visiting_card_url && (
                        <a 
                          href={doctor.visiting_card_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-amber-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          ভিজিটিং কার্ড ডাউনলোড
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowSerialTypeModal(true)}
                className="btn-primary w-full text-center block text-lg py-3"
              >
                এখনই সিরিয়াল নিন
              </button>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-sm">শেয়ার করুন:</span>
              <button
                onClick={() => {
                  const baseUrl = window.location.origin
                  const doctorSlug = doctor.slug || doctor.id
                  const shareUrl = `${baseUrl}/doctor/${doctorSlug}`
                  const text = `${doctor.name} - ${doctor.category_name}\n${doctor.degrees}\n\n`
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400')
                }}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                title="Facebook এ শেয়ার করুন"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                onClick={() => {
                  const baseUrl = window.location.origin
                  const doctorSlug = doctor.slug || doctor.id
                  const shareUrl = `${baseUrl}/doctor/${doctorSlug}`
                  const text = `${doctor.name} - ${doctor.category_name}, ${doctor.degrees}`
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`, '_blank')
                }}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                title="WhatsApp এ শেয়ার করুন"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button
                onClick={() => {
                  const baseUrl = window.location.origin
                  const doctorSlug = doctor.slug || doctor.id
                  const shareUrl = `${baseUrl}/doctor/${doctorSlug}`
                  const text = `${doctor.name} - ${doctor.category_name}, ${doctor.degrees}`
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400')
                }}
                className="w-10 h-10 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors"
                title="X (Twitter) এ শেয়ার করুন"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button
                onClick={() => {
                  const baseUrl = window.location.origin
                  const doctorSlug = doctor.slug || doctor.id
                  const shareUrl = `${baseUrl}/doctor/${doctorSlug}`
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('লিংক কপি হয়েছে!')
                  })
                }}
                className="w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
                title="লিংক কপি করুন"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {adBanner && (
            <div className="mt-6">
              {getBannerLink() ? (
                <a 
                  href={getBannerLink()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <img 
                    src={getBannerImageUrl()} 
                    alt={adBanner.title}
                    className="w-full h-auto object-contain max-h-[120px] md:max-h-[120px]"
                  />
                </a>
              ) : (
                <div className="overflow-hidden rounded-lg shadow-sm">
                  <img 
                    src={getBannerImageUrl()} 
                    alt={adBanner.title}
                    className="w-full h-auto object-contain max-h-[120px] md:max-h-[120px]"
                  />
                </div>
              )}
            </div>
          )}

          {expertise.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 text-left">বিশেষজ্ঞতা ও দক্ষতার ক্ষেত্রসমূহ</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {expertise.map((item) => (
                  <div key={item.id} className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {promotedDoctors.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 text-left">
                শীর্ষ {doctor.category_name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promotedDoctors.map((promotedDoc) => (
                  <Link 
                    key={promotedDoc.id} 
                    to={`/doctor/${promotedDoc.slug || promotedDoc.id}`}
                    className="group block bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 opacity-95"></div>
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2.5 py-1 rounded-full shadow-lg">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-bold">Best</span>
                        </div>
                      </div>
                      <div className="relative p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {promotedDoc.image_url ? (
                              <div className="relative">
                                <div className="absolute inset-0 bg-white rounded-full transform scale-110"></div>
                                <img 
                                  src={promotedDoc.image_url} 
                                  alt={promotedDoc.name}
                                  className="relative w-18 h-18 md:w-24 md:h-24 object-cover rounded-full border-3 border-white shadow-lg"
                                  style={{ width: '72px', height: '72px' }}
                                />
                              </div>
                            ) : (
                              <div className="w-18 h-18 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-lg" style={{ width: '72px', height: '72px' }}>
                                <svg className="w-9 h-9 md:w-12 md:h-12 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="font-bold text-white text-base md:text-lg leading-tight line-clamp-2">
                              {promotedDoc.name}
                            </h3>
                            <p className="text-xs md:text-sm text-white/80 mt-1.5 line-clamp-2">{promotedDoc.degrees}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex flex-col items-center gap-3">
                        <span className="inline-flex items-center justify-center w-full px-4 py-2 border-2 border-primary-600 text-primary-700 text-sm font-medium rounded-lg">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {promotedDoc.category_name}
                        </span>
                        <span className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors group-hover:bg-primary-700">
                          বিস্তারিত দেখুন
                          <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(reviews.length > 0 || doctor.reviews_count > 0) && (
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 text-left">রোগীদের মতামত</h2>
              
              {(() => {
                const totalReviews = doctor.reviews_count || reviews.length
                const avgRating = doctor.rating || 0
                
                const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                reviews.forEach(r => {
                  if (r.rating >= 1 && r.rating <= 5) {
                    ratingCounts[r.rating]++
                  }
                })
                
                let distributedCounts = { ...ratingCounts }
                if (totalReviews > reviews.length && avgRating > 0) {
                  const remaining = totalReviews - reviews.length
                  if (avgRating >= 4.5) {
                    distributedCounts[5] += Math.round(remaining * 0.7)
                    distributedCounts[4] += Math.round(remaining * 0.2)
                    distributedCounts[3] += Math.round(remaining * 0.07)
                    distributedCounts[2] += Math.round(remaining * 0.02)
                    distributedCounts[1] += Math.round(remaining * 0.01)
                  } else if (avgRating >= 4.0) {
                    distributedCounts[5] += Math.round(remaining * 0.5)
                    distributedCounts[4] += Math.round(remaining * 0.3)
                    distributedCounts[3] += Math.round(remaining * 0.12)
                    distributedCounts[2] += Math.round(remaining * 0.05)
                    distributedCounts[1] += Math.round(remaining * 0.03)
                  } else if (avgRating >= 3.5) {
                    distributedCounts[5] += Math.round(remaining * 0.3)
                    distributedCounts[4] += Math.round(remaining * 0.35)
                    distributedCounts[3] += Math.round(remaining * 0.2)
                    distributedCounts[2] += Math.round(remaining * 0.1)
                    distributedCounts[1] += Math.round(remaining * 0.05)
                  } else {
                    distributedCounts[5] += Math.round(remaining * 0.2)
                    distributedCounts[4] += Math.round(remaining * 0.25)
                    distributedCounts[3] += Math.round(remaining * 0.3)
                    distributedCounts[2] += Math.round(remaining * 0.15)
                    distributedCounts[1] += Math.round(remaining * 0.1)
                  }
                }
                
                const maxCount = Math.max(...Object.values(distributedCounts), 1)
                
                return (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex flex-col items-center justify-center md:border-r md:pr-8 border-gray-200">
                        <div className="text-5xl font-bold text-gray-800">{toBengaliNumber(avgRating.toFixed(1))}</div>
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <div className="text-gray-500 mt-2 text-sm">{toBengaliNumber(totalReviews)} টি রিভিউ</div>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = distributedCounts[rating]
                          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0
                          
                          return (
                            <div key={rating} className="flex items-center gap-3">
                              <div className="flex items-center gap-1 w-12">
                                <span className="text-sm font-medium text-gray-700">{toBengaliNumber(rating)}</span>
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </div>
                              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    rating >= 4 ? 'bg-green-500' : rating === 3 ? 'bg-yellow-500' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${barWidth}%` }}
                                ></div>
                              </div>
                              <div className="w-16 text-right">
                                <span className="text-sm text-gray-600">{toBengaliNumber(count)}</span>
                                <span className="text-xs text-gray-400 ml-1">({toBengaliNumber(Math.round(percentage))}%)</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })()}
              
              <div className="mt-6">
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  আপনার মতামত দিন
                </button>
              </div>

              {reviews.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-medium text-gray-700 text-left">সাম্প্রতিক রিভিউ</h3>
                  {[...reviews]
                    .map((review, idx) => ({
                      ...review,
                      displayDaysAgo: getReviewDisplayDaysAgo(review.id, idx, reviews.length)
                    }))
                    .sort((a, b) => a.displayDaysAgo - b.displayDaysAgo)
                    .map((review) => (
                    <div key={review.id} className="bg-white rounded-xl p-5 text-left border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-white font-bold text-lg">
                            {review.patient_name?.charAt(0) || 'র'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800">{review.patient_name}</h3>
                              <span className="text-xs text-gray-400">{getRelativeTimeBengali(review.displayDaysAgo)}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 leading-relaxed">{review.review_text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">আপনার মতামত দিন</h2>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">আপনার নাম *</label>
                  <input
                    type="text"
                    required
                    value={reviewFormData.patient_name}
                    onChange={(e) => setReviewFormData({...reviewFormData, patient_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="আপনার পূর্ণ নাম লিখুন"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">ইমেইল *</label>
                  <input
                    type="email"
                    required
                    value={reviewFormData.email}
                    onChange={(e) => setReviewFormData({...reviewFormData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">ফোন নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={reviewFormData.phone}
                    onChange={(e) => setReviewFormData({...reviewFormData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="০১XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">অ্যাপয়েন্টমেন্ট কোড *</label>
                  <input
                    type="text"
                    required
                    value={reviewFormData.appointment_code}
                    onChange={(e) => setReviewFormData({...reviewFormData, appointment_code: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="আপনার অ্যাপয়েন্টমেন্ট কোড লিখুন"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">রেটিং *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewFormData({...reviewFormData, rating: star})}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-10 h-10 ${star <= reviewFormData.rating ? 'text-yellow-400' : 'text-gray-300'} transition-colors`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">আপনার মতামত *</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewFormData.review_text}
                    onChange={(e) => setReviewFormData({...reviewFormData, review_text: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    placeholder="ডাক্তার সম্পর্কে আপনার অভিজ্ঞতা লিখুন..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submittingReview ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        জমা হচ্ছে...
                      </>
                    ) : (
                      'জমা দিন'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">সফলভাবে জমা হয়েছে!</h2>
            </div>
            <div className="p-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-gray-700 leading-relaxed">
                  আপনার মূল্যবান মতামতের জন্য ধন্যবাদ! আপনার রিভিউটি সফলভাবে জমা হয়েছে। 
                </p>
                <p className="text-gray-600 mt-3 text-sm">
                  আমাদের অ্যাডমিন টিম আপনার রিভিউটি পর্যালোচনা করবেন এবং অনুমোদনের পর এটি ডাক্তারের প্রোফাইলে প্রদর্শিত হবে।
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>সাধারণত ২৪-৪৮ ঘণ্টার মধ্যে অনুমোদন হয়</span>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all shadow-md"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      <SerialTypeModal 
        isOpen={showSerialTypeModal} 
        onClose={() => setShowSerialTypeModal(false)} 
        doctorId={doctor?.id}
      />
    </div>
  )
}

export default DoctorProfile
