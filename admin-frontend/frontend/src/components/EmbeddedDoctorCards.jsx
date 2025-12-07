import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)])
}

function EmbeddedDoctorCards({ doctorSlugs }) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (doctorSlugs && doctorSlugs.length > 0) {
      fetchDoctors()
    } else {
      setLoading(false)
    }
  }, [doctorSlugs])

  async function fetchDoctors() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const uuidSlugs = doctorSlugs.filter(slug => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
      )
      const regularSlugs = doctorSlugs.filter(slug => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
      )

      let allDoctors = []

      if (uuidSlugs.length > 0) {
        const { data } = await supabase
          .from('doctors')
          .select('*')
          .eq('is_active', true)
          .in('id', uuidSlugs)
        if (data) allDoctors = [...allDoctors, ...data]
      }

      if (regularSlugs.length > 0) {
        const { data } = await supabase
          .from('doctors')
          .select('*')
          .eq('is_active', true)
          .in('slug', regularSlugs)
        if (data) allDoctors = [...allDoctors, ...data]
      }

      const orderedDoctors = doctorSlugs
        .map(slug => allDoctors.find(d => d.slug === slug || d.id === slug))
        .filter(Boolean)

      setDoctors(orderedDoctors)
    } catch (error) {
      console.error('Error fetching embedded doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="my-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (doctors.length === 0) {
    return null
  }

  return (
    <div className="my-8 not-prose">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      src={doctor.image_url} 
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
              
              <div className="flex gap-2">
                <Link 
                  to={`/doctor/${doctor.slug || doctor.id}`} 
                  className="flex-1 text-center py-3 px-4 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-600 hover:text-white transition-all text-sm group/btn"
                >
                  <span className="flex items-center justify-center gap-1">
                    বিস্তারিত
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
                <Link 
                  to={`/doctor/${doctor.slug || doctor.id}`}
                  className="flex-1 text-center py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  সিরিয়াল নিন
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EmbeddedDoctorCards
