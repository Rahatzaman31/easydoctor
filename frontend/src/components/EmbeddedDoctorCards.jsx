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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map(doctor => (
          <Link 
            key={doctor.id}
            to={`/doctor/${doctor.slug || doctor.id}`}
            className="flex flex-col p-4 bg-white hover:bg-slate-50 rounded-2xl transition-all group border border-gray-200 hover:border-emerald-400 shadow-sm hover:shadow-md h-full"
            style={{ textDecoration: 'none' }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-emerald-100 group-hover:border-emerald-300 transition-colors">
                {doctor.image_url ? (
                  <img 
                    src={doctor.image_url} 
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors truncate leading-relaxed pt-1 pb-0.5" style={{ textDecoration: 'none' }}>{doctor.name}</h3>
                {doctor.degrees && (
                  <p className="text-[11px] text-emerald-600 font-medium line-clamp-1 leading-normal" style={{ textDecoration: 'none' }}>{doctor.degrees}</p>
                ) || (
                  <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal">এমবিবিএস</p>
                )}
                {doctor.category_name && (
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{doctor.category_name}</p>
                )}
              </div>
            </div>
            
            <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-end">
              <div className="bg-emerald-600 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm">
                বিস্তারিত দেখুন
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default EmbeddedDoctorCards
