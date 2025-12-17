import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

function FeaturedHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedHospitals()
  }, [])

  async function fetchFeaturedHospitals() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured_home', true)
        .order('display_order', { ascending: true })
        .limit(4)
      
      if (error) throw error
      setHospitals(data || [])
    } catch (error) {
      console.error('Error fetching featured hospitals:', error)
      setHospitals([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
            স্বনামধন্য হাসপাতাল ও ডায়াগনস্টিক সেন্টার
          </h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </section>
    )
  }

  if (hospitals.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gradient-to-r from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            স্বনামধন্য হাসপাতাল ও ডায়াগনস্টিক সেন্টার
          </h2>
          <Link 
            to="/hospitals-diagnostics" 
            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            সব দেখুন
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hospitals.map(hospital => (
            <div 
              key={hospital.id} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-slate-200 hover:border-emerald-400 group"
            >
              <div className="relative w-full aspect-video overflow-hidden">
                {hospital.image_url ? (
                  <img 
                    src={hospital.image_url} 
                    alt={hospital.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-emerald-500 px-2 py-1 rounded-full">
                  <span className="text-xs font-bold text-white">
                    {hospital.type === 'diagnostic' ? 'ডায়াগনস্টিক' : 'হাসপাতাল'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="text-center text-slate-800 font-semibold text-sm line-clamp-2">
                    {hospital.name}
                  </h3>
                </div>
                <Link 
                  to={`/hospital/${hospital.id}`}
                  className="block w-full text-center bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 rounded-lg text-sm font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all"
                >
                  বিস্তারিত দেখুন
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedHospitals
