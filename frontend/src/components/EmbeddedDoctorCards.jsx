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
    <div className="my-8 not-prose embedded-doctor-cards">
      <div className="flex flex-col gap-4">
        {doctors.map(doctor => (
          <Link 
            key={doctor.id}
            to={`/doctor/${doctor.slug || doctor.id}`}
            className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 rounded-2xl transition-all group border border-gray-200 hover:border-emerald-400 shadow-sm hover:shadow-md"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-emerald-100 group-hover:border-emerald-300 transition-colors">
              {doctor.image_url ? (
                <img 
                  src={doctor.image_url} 
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-700 transition-colors truncate mb-1" style={{ textDecoration: 'none' }}>{doctor.name}</h3>
              {doctor.degrees && (
                <p className="text-sm text-emerald-600 font-medium mb-1 line-clamp-1" style={{ textDecoration: 'none' }}>{doctor.degrees}</p>
              )}
              <div className="flex flex-wrap gap-2 items-center mt-1">
                {doctor.category_name && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{doctor.category_name}</span>
                )}
                {doctor.specialist && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{doctor.specialist}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 ml-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors uppercase tracking-wider">সিরিয়াল</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default EmbeddedDoctorCards
