import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

const DISTRICTS = [
  'রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম',
  'লালমনিরহাট', 'নীলফামারী', 'পঞ্চগড়', 'ঠাকুরগাঁও'
]

const AMBULANCE_TYPES = [
  'এসি অ্যাম্বুলেন্স',
  'নন-এসি অ্যাম্বুলেন্স',
  'আইসিইউ অ্যাম্বুলেন্স',
  'ফ্রিজিং অ্যাম্বুলেন্স'
]

function AdminAmbulance() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('drivers')
  const [drivers, setDrivers] = useState([])
  const [requests, setRequests] = useState([])
  const [accessCodes, setAccessCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    alt_phone: '',
    district: '',
    address: '',
    ambulance_type: '',
    vehicle_number: '',
    vehicle_model: '',
    has_oxygen: false,
    has_stretcher: true,
    has_ac: false,
    is_available: true,
    is_active: true,
    is_featured: false,
    profile_image_url: '',
    ambulance_image_url: '',
    experience_years: 0,
    fare_per_km: '',
    notes: ''
  })

  const [codeForm, setCodeForm] = useState({
    code: '',
    driver_id: '',
    driver_name: '',
    notes: ''
  })

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      navigate('/admin/login')
      return
    }
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    await Promise.all([fetchDrivers(), fetchRequests(), fetchAccessCodes()])
    setLoading(false)
  }

  async function fetchDrivers() {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('ambulance_drivers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  async function fetchRequests() {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('ambulance_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  async function fetchAccessCodes() {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('driver_access_codes')
        .select('*')
        .order('issued_at', { ascending: false })
      if (error) throw error
      setAccessCodes(data || [])
    } catch (error) {
      console.error('Error fetching access codes:', error)
    }
  }

  async function handleDriverSubmit(e) {
    e.preventDefault()
    try {
      const driverData = {
        name: driverForm.name,
        phone: driverForm.phone,
        alt_phone: driverForm.alt_phone,
        district: driverForm.district,
        address: driverForm.address,
        ambulance_type: driverForm.ambulance_type,
        vehicle_number: driverForm.vehicle_number,
        vehicle_model: driverForm.vehicle_model,
        has_oxygen: driverForm.has_oxygen,
        has_stretcher: driverForm.has_stretcher,
        has_ac: driverForm.has_ac,
        is_available: driverForm.is_available,
        is_active: driverForm.is_active,
        is_featured: driverForm.is_featured,
        profile_image_url: driverForm.profile_image_url,
        ambulance_image_url: driverForm.ambulance_image_url,
        experience_years: driverForm.experience_years,
        fare_per_km: driverForm.fare_per_km,
        notes: driverForm.notes
      }

      if (editingDriver) {
        driverData.updated_at = new Date().toISOString()
        const { error } = await supabase
          .from('ambulance_drivers')
          .update(driverData)
          .eq('id', editingDriver.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ambulance_drivers')
          .insert([driverData])
        if (error) throw error
      }
      await fetchDrivers()
      setShowDriverModal(false)
      resetDriverForm()
    } catch (error) {
      console.error('Error saving driver:', error)
      alert('ড্রাইভার সংরক্ষণে সমস্যা হয়েছে: ' + error.message)
    }
  }

  async function handleCodeSubmit(e) {
    e.preventDefault()
    try {
      const selectedDriver = drivers.find(d => d.id === codeForm.driver_id)
      const { error } = await supabase
        .from('driver_access_codes')
        .insert([{
          code: codeForm.code.toUpperCase(),
          driver_id: codeForm.driver_id || null,
          driver_name: selectedDriver?.name || codeForm.driver_name,
          notes: codeForm.notes,
          is_active: true
        }])
      if (error) throw error
      await fetchAccessCodes()
      setShowCodeModal(false)
      setCodeForm({ code: '', driver_id: '', driver_name: '', notes: '' })
    } catch (error) {
      console.error('Error creating access code:', error)
      alert('অ্যাক্সেস কোড তৈরিতে সমস্যা হয়েছে')
    }
  }

  async function handleRequestStatus(id, status) {
    try {
      const { error } = await supabase
        .from('ambulance_requests')
        .update({ status })
        .eq('id', id)
      if (error) throw error
      await fetchRequests()
    } catch (error) {
      console.error('Error updating request:', error)
    }
  }

  async function toggleDriverStatus(id, field, value) {
    try {
      const { error } = await supabase
        .from('ambulance_drivers')
        .update({ [field]: value })
        .eq('id', id)
      if (error) throw error
      await fetchDrivers()
    } catch (error) {
      console.error('Error updating driver:', error)
    }
  }

  async function toggleCodeStatus(id, isActive) {
    try {
      const { error } = await supabase
        .from('driver_access_codes')
        .update({ is_active: isActive })
        .eq('id', id)
      if (error) throw error
      await fetchAccessCodes()
    } catch (error) {
      console.error('Error updating access code:', error)
    }
  }

  async function deleteDriver(id) {
    if (!confirm('আপনি কি এই ড্রাইভার মুছে ফেলতে চান?')) return
    try {
      const { error } = await supabase
        .from('ambulance_drivers')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchDrivers()
    } catch (error) {
      console.error('Error deleting driver:', error)
    }
  }

  async function deleteCode(id) {
    if (!confirm('আপনি কি এই অ্যাক্সেস কোড মুছে ফেলতে চান?')) return
    try {
      const { error } = await supabase
        .from('driver_access_codes')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchAccessCodes()
    } catch (error) {
      console.error('Error deleting code:', error)
    }
  }

  function resetDriverForm() {
    setDriverForm({
      name: '',
      phone: '',
      alt_phone: '',
      district: '',
      address: '',
      ambulance_type: '',
      vehicle_number: '',
      vehicle_model: '',
      has_oxygen: false,
      has_stretcher: true,
      has_ac: false,
      is_available: true,
      is_active: true,
      is_featured: false,
      profile_image_url: '',
      ambulance_image_url: '',
      experience_years: 0,
      fare_per_km: '',
      notes: ''
    })
    setEditingDriver(null)
  }

  function openEditDriver(driver) {
    setDriverForm(driver)
    setEditingDriver(driver)
    setShowDriverModal(true)
  }

  function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCodeForm({ ...codeForm, code })
  }

  const filteredRequests = requests.filter(req =>
    req.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">অ্যাম্বুলেন্স সেবা ব্যবস্থাপনা</h1>
                <p className="text-gray-500 text-sm">ড্রাইভার, রিকোয়েস্ট ও অ্যাক্সেস কোড পরিচালনা</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'drivers'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            ড্রাইভার ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all relative ${
              activeTab === 'requests'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            রিকোয়েস্ট ({requests.length})
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === 'codes'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            অ্যাক্সেস কোড ({accessCodes.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">তথ্য লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">সকল ড্রাইভার</h2>
                  <button
                    onClick={() => { resetDriverForm(); setShowDriverModal(true); }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    নতুন ড্রাইভার
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ড্রাইভার</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ধরণ</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">জেলা</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ফোন</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">সক্রিয়</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">উপলব্ধ</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">শীর্ষ</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {drivers.map(driver => (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {driver.profile_image_url ? (
                                  <img src={driver.profile_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                    </svg>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{driver.name}</p>
                                  <p className="text-sm text-gray-500">{driver.vehicle_number}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{driver.ambulance_type}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{driver.district}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{driver.phone}</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => toggleDriverStatus(driver.id, 'is_active', !driver.is_active)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  driver.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                }`}
                              >
                                {driver.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => toggleDriverStatus(driver.id, 'is_available', !driver.is_available)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  driver.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {driver.is_available ? 'হ্যাঁ' : 'না'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => toggleDriverStatus(driver.id, 'is_featured', !driver.is_featured)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  driver.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {driver.is_featured ? 'হ্যাঁ' : 'না'}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditDriver(driver)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteDriver(driver.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex gap-4">
                    <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-semibold">
                      অপেক্ষমাণ: {pendingCount}
                    </div>
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
                      অনুমোদিত: {approvedCount}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="খুঁজুন..."
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  {filteredRequests.map(request => (
                    <div key={request.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
                      request.status === 'pending' ? 'border-amber-500' :
                      request.status === 'approved' ? 'border-green-500' :
                      request.status === 'completed' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-lg text-gray-800">{request.user_name}</h3>
                              {request.is_urgent && (
                                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                                  জরুরী
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                request.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {request.status === 'pending' ? 'অপেক্ষমাণ' :
                                 request.status === 'approved' ? 'অনুমোদিত' :
                                 request.status === 'completed' ? 'সম্পন্ন' : 'বাতিল'}
                              </span>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <a href={`tel:${request.user_phone}`} className="font-semibold text-blue-600 hover:underline">{request.user_phone}</a>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span className="font-medium text-gray-800">{request.district}</span>
                                {request.ambulance_type_needed && (
                                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{request.ambulance_type_needed}</span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 flex flex-col md:flex-row gap-3">
                              <div className="flex-1 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="4"/>
                                    </svg>
                                  </div>
                                  <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide">পিকআপ স্থান</span>
                                </div>
                                <p className="text-gray-700 text-sm pl-8">{request.pickup_location}</p>
                              </div>
                              
                              <div className="hidden md:flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </div>
                              <div className="md:hidden flex justify-center">
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              </div>
                              
                              <div className="flex-1 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                  </div>
                                  <span className="text-rose-700 font-bold text-xs uppercase tracking-wide">গন্তব্য স্থান</span>
                                </div>
                                <p className="text-gray-700 text-sm pl-8">{request.destination}</p>
                              </div>
                            </div>

                            {request.patient_condition && (
                              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div>
                                    <span className="text-amber-700 font-semibold text-xs uppercase">রোগীর অবস্থা</span>
                                    <p className="text-amber-800 text-sm mt-0.5">{request.patient_condition}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleRequestStatus(request.id, 'approved')}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                >
                                  অনুমোদন
                                </button>
                                <button
                                  onClick={() => handleRequestStatus(request.id, 'cancelled')}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                  বাতিল
                                </button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <button
                                onClick={() => handleRequestStatus(request.id, 'completed')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                              >
                                সম্পন্ন
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                          <span>রিকোয়েস্ট তারিখ: {new Date(request.created_at).toLocaleDateString('bn-BD')}</span>
                          {request.preferred_date && (
                            <span>পছন্দের তারিখ: {request.preferred_date}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Access Codes Tab */}
            {activeTab === 'codes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">ড্রাইভার অ্যাক্সেস কোড</h2>
                  <button
                    onClick={() => setShowCodeModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    নতুন কোড
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">কোড</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ড্রাইভার</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">তারিখ</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">সক্রিয়</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {accessCodes.map(code => (
                          <tr key={code.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <span className="font-mono font-bold text-lg text-gray-800 bg-gray-100 px-3 py-1 rounded">
                                {code.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{code.driver_name || 'সকল ড্রাইভার'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(code.issued_at).toLocaleDateString('bn-BD')}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => toggleCodeStatus(code.id, !code.is_active)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  code.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {code.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(code.code)
                                    alert('কোড কপি হয়েছে!')
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="কপি করুন"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteCode(code.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingDriver ? 'ড্রাইভার সম্পাদনা' : 'নতুন ড্রাইভার যোগ করুন'}
                </h3>
                <button onClick={() => { setShowDriverModal(false); resetDriverForm(); }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleDriverSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({...driverForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর *</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বিকল্প ফোন</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.alt_phone}
                    onChange={(e) => setDriverForm({...driverForm, alt_phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">জেলা *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.district}
                    onChange={(e) => setDriverForm({...driverForm, district: e.target.value})}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">অ্যাম্বুলেন্সের ধরণ *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.ambulance_type}
                    onChange={(e) => setDriverForm({...driverForm, ambulance_type: e.target.value})}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {AMBULANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">গাড়ি নম্বর</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.vehicle_number}
                    onChange={(e) => setDriverForm({...driverForm, vehicle_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">গাড়ির মডেল</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.vehicle_model}
                    onChange={(e) => setDriverForm({...driverForm, vehicle_model: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">অভিজ্ঞতা (বছর)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.experience_years}
                    onChange={(e) => setDriverForm({...driverForm, experience_years: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={driverForm.address}
                  onChange={(e) => setDriverForm({...driverForm, address: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">প্রতি কিমি ভাড়া (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.fare_per_km}
                    onChange={(e) => setDriverForm({...driverForm, fare_per_km: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">প্রোফাইল ছবি URL</label>
                  <input
                    type="url"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={driverForm.profile_image_url}
                    onChange={(e) => setDriverForm({...driverForm, profile_image_url: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">অ্যাম্বুলেন্স ছবি URL</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={driverForm.ambulance_image_url}
                  onChange={(e) => setDriverForm({...driverForm, ambulance_image_url: e.target.value})}
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={driverForm.has_oxygen}
                    onChange={(e) => setDriverForm({...driverForm, has_oxygen: e.target.checked})}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-gray-700">অক্সিজেন সুবিধা</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={driverForm.has_stretcher}
                    onChange={(e) => setDriverForm({...driverForm, has_stretcher: e.target.checked})}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-gray-700">স্ট্রেচার</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={driverForm.has_ac}
                    onChange={(e) => setDriverForm({...driverForm, has_ac: e.target.checked})}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-gray-700">এসি সুবিধা</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={driverForm.is_active}
                    onChange={(e) => setDriverForm({...driverForm, is_active: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">সক্রিয় (পাবলিক লিস্টে দেখাবে)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={driverForm.is_available}
                    onChange={(e) => setDriverForm({...driverForm, is_available: e.target.checked})}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-gray-700">উপলব্ধ</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={driverForm.is_featured}
                    onChange={(e) => setDriverForm({...driverForm, is_featured: e.target.checked})}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-gray-700">শীর্ষে দেখান</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নোট</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={driverForm.notes}
                  onChange={(e) => setDriverForm({...driverForm, notes: e.target.value})}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:from-red-700 hover:to-rose-700 transition-all"
              >
                {editingDriver ? 'আপডেট করুন' : 'যোগ করুন'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Access Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">নতুন অ্যাক্সেস কোড</h3>
                <button onClick={() => setShowCodeModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCodeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">অ্যাক্সেস কোড *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono uppercase text-lg"
                    value={codeForm.code}
                    onChange={(e) => setCodeForm({...codeForm, code: e.target.value.toUpperCase()})}
                    maxLength={10}
                    placeholder="ABC123"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    জেনারেট
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ড্রাইভার (ঐচ্ছিক)</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={codeForm.driver_id}
                  onChange={(e) => setCodeForm({...codeForm, driver_id: e.target.value})}
                >
                  <option value="">সকল ড্রাইভার</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} - {d.district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নোট</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={codeForm.notes}
                  onChange={(e) => setCodeForm({...codeForm, notes: e.target.value})}
                  placeholder="অতিরিক্ত তথ্য..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-4 rounded-xl font-bold text-lg hover:from-red-700 hover:to-rose-700 transition-all"
              >
                কোড তৈরি করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAmbulance
