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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {doctors.map(doctor => (
          <Link 
            key={doctor.id}
            to={`/doctor/${doctor.slug || doctor.id}`}
            className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group border border-gray-200 hover:border-emerald-300"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
              {doctor.image_url ? (
                <img 
                  src={doctor.image_url} 
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[14px] text-gray-800 group-hover:text-emerald-700 transition-colors truncate" style={{ textDecoration: 'none', lineHeight: '1.4' }}>{doctor.name}</h3>
              {doctor.degrees && (
                <p className="text-xs text-emerald-600 truncate" style={{ textDecoration: 'none', lineHeight: '1.3' }}>{doctor.degrees}</p>
              )}
              {doctor.category_name && (
                <p className="text-xs text-gray-500 truncate" style={{ textDecoration: 'none', lineHeight: '1.3' }}>{doctor.category_name}</p>
              )}
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default EmbeddedDoctorCards
