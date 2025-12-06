import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const DISTRICTS = [
  { id: 'all', name: 'সকল জেলা' },
  { id: 'রংপুর', name: 'রংপুর' },
  { id: 'দিনাজপুর', name: 'দিনাজপুর' },
  { id: 'গাইবান্ধা', name: 'গাইবান্ধা' },
  { id: 'কুড়িগ্রাম', name: 'কুড়িগ্রাম' },
  { id: 'লালমনিরহাট', name: 'লালমনিরহাট' },
  { id: 'নীলফামারী', name: 'নীলফামারী' },
  { id: 'পঞ্চগড়', name: 'পঞ্চগড়' },
  { id: 'ঠাকুরগাঁও', name: 'ঠাকুরগাঁও' }
]

const AMBULANCE_TYPES = [
  'এসি অ্যাম্বুলেন্স',
  'নন-এসি অ্যাম্বুলেন্স',
  'আইসিইউ অ্যাম্বুলেন্স',
  'ফ্রিজিং অ্যাম্বুলেন্স'
]

function AmbulanceService() {
  const [user, setUser] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDistrict, setSelectedDistrict] = useState('all')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDriverModal, setShowDriverModal] = useState(null)
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(null)
  const [accessCode, setAccessCode] = useState('')
  const [accessCodeError, setAccessCodeError] = useState('')
  const [unlockedRequests, setUnlockedRequests] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authData, setAuthData] = useState({ email: '', password: '', name: '', phone: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  
  const [requestForm, setRequestForm] = useState({
    user_name: '',
    user_phone: '',
    user_email: '',
    district: '',
    pickup_location: '',
    destination: '',
    patient_condition: '',
    ambulance_type_needed: '',
    preferred_date: '',
    preferred_time: '',
    additional_notes: '',
    is_urgent: false
  })

  useEffect(() => {
    checkUser()
    fetchDrivers()
    fetchRequests()
  }, [])

  async function checkUser() {
    const savedUser = localStorage.getItem('ambulanceUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setRequestForm(prev => ({
          ...prev,
          user_name: userData.name || '',
          user_phone: userData.phone || '',
          user_email: userData.email || ''
        }))
      } catch (e) {
        localStorage.removeItem('ambulanceUser')
      }
    }
  }

  function handleLogout() {
    localStorage.removeItem('ambulanceUser')
    setUser(null)
    setRequestForm({
      user_name: '',
      user_phone: '',
      user_email: '',
      district: '',
      pickup_location: '',
      destination: '',
      patient_condition: '',
      ambulance_type_needed: '',
      preferred_date: '',
      preferred_time: '',
      additional_notes: '',
      is_urgent: false
    })
  }

  async function fetchDrivers() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('ambulance_drivers')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRequests() {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('ambulance_requests')
        .select('id, district, pickup_location, destination, ambulance_type_needed, is_urgent, created_at')
        .eq('status', 'approved')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  async function hashPassword(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'ambulance_salt_2024')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function handleAuth(e) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    if (!supabase || !isConfigured) {
      setAuthError('ডাটাবেস সংযোগ স্থাপন করা যায়নি। পরে আবার চেষ্টা করুন।')
      setAuthLoading(false)
      return
    }

    try {
      const passwordHash = await hashPassword(authData.password)

      if (authMode === 'login') {
        const { data: users, error } = await supabase
          .from('ambulance_users')
          .select('*')
          .eq('email', authData.email.toLowerCase())
          .single()
        
        if (error || !users) {
          setAuthError('এই ইমেইল দিয়ে কোনো একাউন্ট নেই। সাইন আপ করুন।')
          return
        }
        
        const legacyHash = btoa(authData.password)
        const isNewHashMatch = users.password_hash === passwordHash
        const isLegacyHashMatch = users.password_hash === legacyHash
        
        if (!isNewHashMatch && !isLegacyHashMatch) {
          setAuthError('পাসওয়ার্ড সঠিক নয়')
          return
        }
        
        if (isLegacyHashMatch && !isNewHashMatch) {
          await supabase
            .from('ambulance_users')
            .update({ password_hash: passwordHash })
            .eq('id', users.id)
        }
        
        const userData = {
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone
        }
        localStorage.setItem('ambulanceUser', JSON.stringify(userData))
        setUser(userData)
        setRequestForm(prev => ({
          ...prev,
          user_name: users.name,
          user_phone: users.phone,
          user_email: users.email
        }))
        setShowAuthModal(false)
        setShowRequestForm(true)
      } else {
        const { data: existing } = await supabase
          .from('ambulance_users')
          .select('id')
          .eq('email', authData.email.toLowerCase())
          .single()
        
        if (existing) {
          setAuthError('এই ইমেইল দিয়ে একাউন্ট আছে। লগইন করুন।')
          return
        }
        
        const { data: newUser, error } = await supabase
          .from('ambulance_users')
          .insert([{
            name: authData.name,
            email: authData.email.toLowerCase(),
            phone: authData.phone,
            password_hash: passwordHash,
            is_verified: true
          }])
          .select()
          .single()
        
        if (error) throw error
        
        const userData = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone
        }
        localStorage.setItem('ambulanceUser', JSON.stringify(userData))
        setUser(userData)
        setRequestForm(prev => ({
          ...prev,
          user_name: authData.name,
          user_phone: authData.phone,
          user_email: authData.email
        }))
        setShowAuthModal(false)
        setShowRequestForm(true)
      }
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError('একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleRequestSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('ambulance_requests')
        .insert([{
          ...requestForm,
          user_id: user?.id,
          status: 'pending'
        }])

      if (error) throw error

      alert('আপনার অনুরোধ সফলভাবে জমা হয়েছে। এডমিন অনুমোদনের পর এটি প্রদর্শিত হবে।')
      setShowRequestForm(false)
      setRequestForm({
        user_name: '',
        user_phone: '',
        user_email: user?.email || '',
        district: '',
        pickup_location: '',
        destination: '',
        patient_condition: '',
        ambulance_type_needed: '',
        preferred_date: '',
        preferred_time: '',
        additional_notes: '',
        is_urgent: false
      })
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('অনুরোধ জমা দিতে সমস্যা হয়েছে: ' + (error.message || 'আবার চেষ্টা করুন।'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAccessCodeSubmit(requestId) {
    setAccessCodeError('')
    
    try {
      const { data: codeData, error: codeError } = await supabase
        .from('driver_access_codes')
        .select('*')
        .eq('code', accessCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (codeError || !codeData) {
        setAccessCodeError('অবৈধ অ্যাক্সেস কোড')
        return
      }

      const { data: requestData, error: requestError } = await supabase
        .from('ambulance_requests')
        .select('user_name, user_phone, patient_condition, additional_notes')
        .eq('id', requestId)
        .single()

      if (requestError || !requestData) {
        setAccessCodeError('রিকোয়েস্ট তথ্য পাওয়া যায়নি')
        return
      }

      setUnlockedRequests(prev => ({
        ...prev,
        [requestId]: requestData
      }))
      setShowAccessCodeModal(null)
      setAccessCode('')
    } catch (error) {
      setAccessCodeError('কোড যাচাই করতে সমস্যা হয়েছে')
    }
  }

  const filteredRequests = requests.filter(req => 
    selectedDistrict === 'all' || req.district === selectedDistrict
  )

  const filteredDrivers = drivers.filter(driver => 
    selectedDistrict === 'all' || driver.district === selectedDistrict
  )

  const featuredDrivers = drivers.filter(d => d.is_featured)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-rose-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full animate-pulse"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-5">
              <svg className="w-5 h-5 text-red-200 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="text-white text-sm font-medium">২৪/৭ জরুরী সেবা</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              অ্যাম্বুলেন্স সেবা
            </h1>
            <p className="text-lg sm:text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              রংপুর বিভাগে দ্রুত ও নির্ভরযোগ্য অ্যাম্বুলেন্স সেবা
            </p>

            {/* Emergency Call Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <a 
                href="tel:999" 
                className="group relative inline-flex items-center justify-center gap-3 bg-white text-red-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block text-xs text-red-500 font-medium">জাতীয় জরুরী সেবা</span>
                    <span className="block text-2xl font-extrabold">৯৯৯</span>
                  </div>
                </div>
              </a>

              <a 
                href="tel:16263" 
                className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block text-xs text-amber-100 font-medium">অ্যাম্বুলেন্স সেবা</span>
                    <span className="block text-2xl font-extrabold">১৬২৬৩</span>
                  </div>
                </div>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>দ্রুত সাড়া</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>নিরাপদ পরিবহন</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>রংপুর বিভাগ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Ambulance Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* User Status and Request Button */}
        <div className="text-center mb-12">
          {user && (
            <div className="mb-4 inline-flex items-center gap-3 bg-green-50 text-green-700 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">স্বাগতম, {user.name}!</span>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-700 font-medium ml-2"
              >
                লগআউট
              </button>
            </div>
          )}
          <div>
            <button
              onClick={() => user ? setShowRequestForm(true) : setShowAuthModal(true)}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              অ্যাম্বুলেন্স রিকোয়েস্ট করুন
            </button>
          </div>
          <p className="text-gray-500 mt-3 text-sm">
            {user ? 'রিকোয়েস্ট করতে উপরের বাটনে ক্লিক করুন' : 'রিকোয়েস্ট করতে প্রথমে সাইন ইন করুন'}
          </p>
        </div>

        {/* District Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {DISTRICTS.map(district => (
              <button
                key={district.id}
                onClick={() => setSelectedDistrict(district.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedDistrict === district.id
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                }`}
              >
                {district.name}
              </button>
            ))}
          </div>
        </div>

        {/* Approved Requests Section */}
        {filteredRequests.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">অ্যাম্বুলেন্স রিকোয়েস্ট সমূহ</h2>
                <p className="text-gray-500 text-sm">ড্রাইভাররা রিকোয়েস্ট দেখতে অ্যাক্সেস কোড ব্যবহার করুন</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRequests.map(request => (
                <div key={request.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  <div className={`px-3 py-2 flex items-center justify-between ${request.is_urgent ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-gray-600 to-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{request.district}</span>
                      <span className="text-white/70 text-xs">| {request.ambulance_type_needed || 'অ্যাম্বুলেন্স'}</span>
                    </div>
                    {request.is_urgent && (
                      <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                        জরুরী
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    {unlockedRequests[request.id] ? (
                      <>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="text-gray-800 font-semibold text-sm">{unlockedRequests[request.id].user_name}</span>
                          </div>
                          <a href={`tel:${unlockedRequests[request.id].user_phone}`} className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            কল
                          </a>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="4"/>
                                </svg>
                              </div>
                              <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide">পিকআপ</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-tight pl-6">{request.pickup_location}</p>
                          </div>
                          
                          <div className="flex justify-center">
                            <div className="flex flex-col items-center">
                              <div className="w-0.5 h-2 bg-gray-300"></div>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </div>
                          </div>
                          
                          <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                              </div>
                              <span className="text-rose-700 font-bold text-xs uppercase tracking-wide">গন্তব্য</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-tight pl-6">{request.destination}</p>
                          </div>
                        </div>

                        {unlockedRequests[request.id].patient_condition && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                            <div className="flex items-start gap-1">
                              <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p className="text-amber-800 text-xs leading-tight">{unlockedRequests[request.id].patient_condition}</p>
                            </div>
                          </div>
                        )}

                        <a 
                          href={`tel:${unlockedRequests[request.id].user_phone}`}
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          এখনই কল করুন
                        </a>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="4"/>
                                </svg>
                              </div>
                              <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide">পিকআপ</span>
                            </div>
                            <p className="text-gray-700 text-xs leading-tight pl-6">{request.pickup_location}</p>
                          </div>
                          
                          <div className="flex justify-center">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                          
                          <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                              </div>
                              <span className="text-rose-700 font-bold text-xs uppercase tracking-wide">গন্তব্য</span>
                            </div>
                            <p className="text-gray-700 text-xs leading-tight pl-6">{request.destination}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-center gap-2 text-gray-400 text-xs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>যোগাযোগের তথ্য লুকানো আছে</span>
                        </div>

                        <button
                          onClick={() => setShowAccessCodeModal(request.id)}
                          className="mt-2 w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg font-semibold text-sm hover:from-gray-700 hover:to-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          কোড দিয়ে আনলক করুন
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Drivers Section */}
        {featuredDrivers.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">শীর্ষ অ্যাম্বুলেন্স সেবা</h2>
                <p className="text-gray-500 text-sm">বিশ্বস্ত ও অভিজ্ঞ ড্রাইভার</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredDrivers.map(driver => (
                <div key={driver.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-amber-200 hover:border-amber-400">
                  <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-4">
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full">
                      <span className="text-xs font-bold text-amber-600">শীর্ষ</span>
                    </div>
                    <div className="flex flex-col items-center">
                      {driver.profile_image_url ? (
                        <img 
                          src={driver.profile_image_url} 
                          alt={driver.name}
                          className="w-20 h-20 object-cover rounded-full border-3 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <svg className="w-10 h-10 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                          </svg>
                        </div>
                      )}
                      <h3 className="mt-3 font-bold text-white text-center text-sm">{driver.name}</h3>
                      <p className="text-amber-100 text-xs text-center">{driver.district}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-col gap-2">
                      <span className="block w-full text-center border-2 border-amber-500 text-amber-600 py-2 rounded-lg text-sm font-semibold bg-transparent">
                        {driver.ambulance_type}
                      </span>
                      <button 
                        onClick={() => setShowDriverModal(driver)}
                        className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
                      >
                        বিস্তারিত দেখুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Drivers Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">সকল অ্যাম্বুলেন্স সেবা</h2>
              <p className="text-gray-500 text-sm">আপনার এলাকায় উপলব্ধ অ্যাম্বুলেন্স</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
              </div>
              <p className="text-gray-600 font-medium">তথ্য খোঁজা হচ্ছে...</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">এই জেলায় কোনো অ্যাম্বুলেন্স পাওয়া যায়নি</h3>
              <p className="text-gray-500">অন্য জেলা নির্বাচন করুন অথবা জরুরী নম্বরে কল করুন</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDrivers.filter(d => !d.is_featured).map(driver => (
                <div key={driver.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-300">
                  <div className="relative bg-gradient-to-br from-red-500 via-rose-500 to-red-600 p-4">
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        driver.is_available ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                      }`}>
                        {driver.is_available ? 'উপলব্ধ' : 'ব্যস্ত'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      {driver.profile_image_url ? (
                        <img 
                          src={driver.profile_image_url} 
                          alt={driver.name}
                          className="w-20 h-20 object-cover rounded-full border-3 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                          </svg>
                        </div>
                      )}
                      <h3 className="mt-3 font-bold text-white text-center text-sm">{driver.name}</h3>
                      <p className="text-red-100 text-xs text-center">{driver.district}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-col gap-2">
                      <span className="block w-full text-center border-2 border-red-500 text-red-600 py-2 rounded-lg text-sm font-semibold bg-transparent">
                        {driver.ambulance_type}
                      </span>
                      <button 
                        onClick={() => setShowDriverModal(driver)}
                        className="block w-full text-center bg-gradient-to-r from-red-500 to-rose-500 text-white py-2 rounded-lg text-sm font-semibold hover:from-red-600 hover:to-rose-600 transition-all"
                      >
                        বিস্তারিত দেখুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {authMode === 'login' ? 'সাইন ইন করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
                </h3>
                <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleAuth} className="p-6 space-y-4">
              {authError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{authError}</div>
              )}
              
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">নাম</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      value={authData.name}
                      onChange={(e) => setAuthData({...authData, name: e.target.value})}
                      placeholder="আপনার নাম"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      value={authData.phone}
                      onChange={(e) => setAuthData({...authData, phone: e.target.value})}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={authData.email}
                  onChange={(e) => setAuthData({...authData, email: e.target.value})}
                  placeholder="example@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={authData.password}
                  onChange={(e) => setAuthData({...authData, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50"
              >
                {authLoading ? 'অপেক্ষা করুন...' : (authMode === 'login' ? 'সাইন ইন' : 'অ্যাকাউন্ট তৈরি করুন')}
              </button>
              
              <p className="text-center text-gray-500 text-sm">
                {authMode === 'login' ? 'অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে অ্যাকাউন্ট আছে?'}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-red-600 font-medium ml-1 hover:underline"
                >
                  {authMode === 'login' ? 'সাইন আপ করুন' : 'সাইন ইন করুন'}
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-600 to-rose-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">অ্যাম্বুলেন্স রিকোয়েস্ট</h3>
                  <p className="text-red-100 text-sm">আপনার তথ্য পূরণ করুন</p>
                </div>
                <button onClick={() => setShowRequestForm(false)} className="text-white/80 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={requestForm.user_name}
                    onChange={(e) => setRequestForm({...requestForm, user_name: e.target.value})}
                    placeholder="রোগী/আত্মীয়ের নাম"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর *</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={requestForm.user_phone}
                    onChange={(e) => setRequestForm({...requestForm, user_phone: e.target.value})}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">জেলা *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={requestForm.district}
                    onChange={(e) => setRequestForm({...requestForm, district: e.target.value})}
                  >
                    <option value="">জেলা নির্বাচন করুন</option>
                    {DISTRICTS.filter(d => d.id !== 'all').map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">অ্যাম্বুলেন্সের ধরণ</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={requestForm.ambulance_type_needed}
                    onChange={(e) => setRequestForm({...requestForm, ambulance_type_needed: e.target.value})}
                  >
                    <option value="">যেকোনো</option>
                    {AMBULANCE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পিকআপ ঠিকানা *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={requestForm.pickup_location}
                  onChange={(e) => setRequestForm({...requestForm, pickup_location: e.target.value})}
                  placeholder="সম্পূর্ণ ঠিকানা লিখুন যেখান থেকে অ্যাম্বুলেন্স নিতে হবে"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">গন্তব্য ঠিকানা *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={requestForm.destination}
                  onChange={(e) => setRequestForm({...requestForm, destination: e.target.value})}
                  placeholder="হাসপাতাল/গন্তব্যের ঠিকানা"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">রোগীর অবস্থা</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={requestForm.patient_condition}
                  onChange={(e) => setRequestForm({...requestForm, patient_condition: e.target.value})}
                  placeholder="রোগীর বর্তমান অবস্থা সংক্ষেপে লিখুন"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পছন্দের তারিখ</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={requestForm.preferred_date}
                    onChange={(e) => setRequestForm({...requestForm, preferred_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পছন্দের সময়</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={requestForm.preferred_time}
                    onChange={(e) => setRequestForm({...requestForm, preferred_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">অতিরিক্ত তথ্য</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={requestForm.additional_notes}
                  onChange={(e) => setRequestForm({...requestForm, additional_notes: e.target.value})}
                  placeholder="অন্য কোনো তথ্য থাকলে লিখুন"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={requestForm.is_urgent}
                  onChange={(e) => setRequestForm({...requestForm, is_urgent: e.target.checked})}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="urgent" className="text-red-700 font-medium">এটি জরুরী রিকোয়েস্ট</label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    জমা দেওয়া হচ্ছে...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    রিকোয়েস্ট জমা দিন
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Driver Detail Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 p-6 text-center">
                <button 
                  onClick={() => setShowDriverModal(null)} 
                  className="absolute top-4 right-4 text-white/80 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {showDriverModal.profile_image_url ? (
                  <img 
                    src={showDriverModal.profile_image_url} 
                    alt={showDriverModal.name}
                    className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-xl mx-auto"
                  />
                ) : (
                  <div className="w-28 h-28 bg-white rounded-full shadow-xl flex items-center justify-center mx-auto">
                    <svg className="w-14 h-14 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mt-4">{showDriverModal.name}</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  showDriverModal.is_available ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {showDriverModal.is_available ? 'উপলব্ধ' : 'ব্যস্ত'}
                </span>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs mb-1">অ্যাম্বুলেন্সের ধরণ</p>
                    <p className="font-semibold text-gray-800">{showDriverModal.ambulance_type}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs mb-1">জেলা</p>
                    <p className="font-semibold text-gray-800">{showDriverModal.district}</p>
                  </div>
                </div>

                {showDriverModal.vehicle_number && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs mb-1">গাড়ি নম্বর</p>
                    <p className="font-semibold text-gray-800">{showDriverModal.vehicle_number}</p>
                  </div>
                )}

                {showDriverModal.vehicle_model && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs mb-1">গাড়ির মডেল</p>
                    <p className="font-semibold text-gray-800">{showDriverModal.vehicle_model}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {showDriverModal.has_oxygen && (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">অক্সিজেন সুবিধা</span>
                  )}
                  {showDriverModal.has_stretcher && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">স্ট্রেচার</span>
                  )}
                  {showDriverModal.has_ac && (
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">এসি সুবিধা</span>
                  )}
                </div>

                {showDriverModal.experience_years > 0 && (
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <p className="text-amber-600 text-sm">
                      <span className="font-bold">{showDriverModal.experience_years}</span> বছরের অভিজ্ঞতা
                    </p>
                  </div>
                )}

                {showDriverModal.fare_per_km && (
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-green-700 text-sm">
                      প্রতি কিলোমিটার: <span className="font-bold">৳{showDriverModal.fare_per_km}</span>
                    </p>
                  </div>
                )}

                {showDriverModal.ambulance_image_url && (
                  <div className="rounded-xl overflow-hidden">
                    <img 
                      src={showDriverModal.ambulance_image_url} 
                      alt="Ambulance"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <a 
                  href={`tel:${showDriverModal.phone}`}
                  className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {showDriverModal.phone}
                </a>

                {showDriverModal.alt_phone && (
                  <a 
                    href={`tel:${showDriverModal.alt_phone}`}
                    className="w-full inline-flex items-center justify-center gap-3 border-2 border-green-600 text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all"
                  >
                    বিকল্প নম্বর: {showDriverModal.alt_phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Code Modal */}
      {showAccessCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">অ্যাক্সেস কোড দিন</h3>
                </div>
                <button onClick={() => {setShowAccessCodeModal(null); setAccessCode(''); setAccessCodeError('')}} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-500 text-sm">
                রিকোয়েস্টের বিস্তারিত তথ্য দেখতে এডমিন প্রদত্ত অ্যাক্সেস কোড দিন।
              </p>
              
              {accessCodeError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{accessCodeError}</div>
              )}
              
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg font-mono tracking-widest uppercase"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="ABC123"
                maxLength={10}
              />
              
              <button
                onClick={() => handleAccessCodeSubmit(showAccessCodeModal)}
                disabled={!accessCode}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 rounded-xl font-semibold hover:from-gray-800 hover:to-gray-900 transition-all disabled:opacity-50"
              >
                যাচাই করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AmbulanceService
