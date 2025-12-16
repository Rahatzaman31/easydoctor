import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

function HospitalsDiagnostics() {
  const [hospitals, setHospitals] = useState([])
  const [diagnostics, setDiagnostics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      if (!supabase || !isConfigured) {
        setHospitals([])
        setDiagnostics([])
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const allData = data || []
      setHospitals(allData.filter(item => item.type !== 'diagnostic'))
      setDiagnostics(allData.filter(item => item.type === 'diagnostic'))
    } catch (error) {
      console.error('Error fetching data:', error)
      setHospitals([])
      setDiagnostics([])
    } finally {
      setLoading(false)
    }
  }

  const HospitalCard = ({ item, type }) => (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-emerald-400">
      <div className="relative h-48 overflow-hidden">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            type === 'diagnostic' 
              ? 'bg-gradient-to-br from-slate-700 to-slate-800' 
              : 'bg-gradient-to-br from-emerald-700 to-emerald-800'
          }`}>
            <svg className="w-16 h-16 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {type === 'diagnostic' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              )}
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            type === 'diagnostic' 
              ? 'bg-slate-700 text-white' 
              : 'bg-emerald-600 text-white'
          }`}>
            {type === 'diagnostic' ? 'ডায়াগনস্টিক' : 'হাসপাতাল'}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className={`font-bold text-lg text-gray-900 mb-4 transition-colors ${
          type === 'diagnostic' ? 'group-hover:text-slate-700' : 'group-hover:text-emerald-700'
        }`}>
          {item.name}
        </h3>

        <Link 
          to={`/hospital/${item.id}`}
          className={`w-full text-center py-2.5 px-4 text-white rounded-xl font-semibold transition-all text-sm shadow-md hover:shadow-lg block ${
            type === 'diagnostic'
              ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
          }`}
        >
          বিস্তারিত দেখুন
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-white text-sm font-medium">বিশ্বস্ত স্বাস্থ্যসেবা প্রতিষ্ঠান</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              হাসপাতাল ও ডায়াগনস্টিক সেন্টার
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-6">
              রংপুর বিভাগের স্বনামধন্য স্বাস্থ্যসেবা প্রতিষ্ঠানসমূহ
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>যাচাইকৃত প্রতিষ্ঠান</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>রংপুর বিভাগ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>মানসম্মত সেবা</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
            <p className="text-gray-600 font-medium">তথ্য খোঁজা হচ্ছে...</p>
          </div>
        ) : hospitals.length === 0 && diagnostics.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">কোনো হাসপাতাল বা ডায়াগনস্টিক সেন্টার পাওয়া যায়নি</h3>
            <p className="text-gray-500">শীঘ্রই এখানে তথ্য যোগ করা হবে</p>
          </div>
        ) : (
          <div className="space-y-16">
            <section>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">হাসপাতাল সমূহ</h2>
                    <p className="text-gray-500 text-sm">রংপুর বিভাগের বিশ্বস্ত হাসপাতালসমূহ</p>
                  </div>
                </div>
              </div>

              {hospitals.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">কোনো হাসপাতাল পাওয়া যায়নি</h3>
                  <p className="text-gray-500 text-sm">শীঘ্রই এখানে তথ্য যোগ করা হবে</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {hospitals.map(hospital => (
                    <HospitalCard key={hospital.id} item={hospital} type="hospital" />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg shadow-slate-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">ডায়াগনস্টিক সেন্টার সমূহ</h2>
                    <p className="text-gray-500 text-sm">রংপুর বিভাগের বিশ্বস্ত ডায়াগনস্টিক সেন্টারসমূহ</p>
                  </div>
                </div>
              </div>

              {diagnostics.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">কোনো ডায়াগনস্টিক সেন্টার পাওয়া যায়নি</h3>
                  <p className="text-gray-500 text-sm">শীঘ্রই এখানে তথ্য যোগ করা হবে</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {diagnostics.map(diagnostic => (
                    <HospitalCard key={diagnostic.id} item={diagnostic} type="diagnostic" />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default HospitalsDiagnostics
