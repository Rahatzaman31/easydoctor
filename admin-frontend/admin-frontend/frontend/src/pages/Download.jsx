import { useState, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import html2canvas from 'html2canvas'

const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)])
}

function Download() {
  const [activeTab, setActiveTab] = useState('appointment')
  
  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [appointmentData, setAppointmentData] = useState(null)
  const [appointmentLoading, setAppointmentLoading] = useState(false)
  const [appointmentError, setAppointmentError] = useState('')
  const appointmentCardRef = useRef(null)
  const [downloadingAppointment, setDownloadingAppointment] = useState(false)

  const [prescriptionSearch, setPrescriptionSearch] = useState('')
  const [prescriptionData, setPrescriptionData] = useState(null)
  const [prescriptionLoading, setPrescriptionLoading] = useState(false)
  const [prescriptionError, setPrescriptionError] = useState('')
  const [downloadingPrescription, setDownloadingPrescription] = useState(false)

  async function searchAppointment(e) {
    e.preventDefault()
    if (!appointmentSearch.trim()) {
      setAppointmentError('রেফারেন্স নম্বর বা ফোন নম্বর দিন')
      return
    }

    setAppointmentLoading(true)
    setAppointmentError('')
    setAppointmentData(null)

    try {
      if (!supabase || !isConfigured) {
        setAppointmentError('ডাটাবেস সংযোগ নেই')
        return
      }

      let { data, error } = await supabase
        .from('appointments')
        .select('*')
        .or(`booking_ref.ilike.%${appointmentSearch}%,patient_phone.ilike.%${appointmentSearch}%`)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (!data || data.length === 0) {
        let { data: paidData, error: paidError } = await supabase
          .from('paid_appointments')
          .select('*')
          .or(`booking_ref.ilike.%${appointmentSearch}%,patient_phone.ilike.%${appointmentSearch}%`)
          .not('status', 'eq', 'cancelled')
          .order('created_at', { ascending: false })
          .limit(1)

        if (paidError) throw paidError

        if (paidData && paidData.length > 0 && paidData[0].patient_name) {
          setAppointmentData({ ...paidData[0], isPaid: true })
        } else {
          setAppointmentError('কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি। সঠিক রেফারেন্স বা ফোন নম্বর দিন।')
        }
      } else {
        setAppointmentData({ ...data[0], isPaid: false })
      }
    } catch (error) {
      console.error('Error:', error)
      setAppointmentError('তথ্য খোঁজার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setAppointmentLoading(false)
    }
  }

  async function searchPrescription(e) {
    e.preventDefault()
    if (!prescriptionSearch.trim()) {
      setPrescriptionError('রেফারেন্স নম্বর বা ফোন নম্বর দিন')
      return
    }

    setPrescriptionLoading(true)
    setPrescriptionError('')
    setPrescriptionData(null)

    try {
      if (!supabase || !isConfigured) {
        setPrescriptionError('ডাটাবেস সংযোগ নেই')
        return
      }

      let { data, error } = await supabase
        .from('paid_appointments')
        .select('*')
        .or(`booking_ref.ilike.%${prescriptionSearch}%,patient_phone.ilike.%${prescriptionSearch}%`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (!data || data.length === 0) {
        setPrescriptionError('কোনো প্রিমিয়াম বুকিং পাওয়া যায়নি। এই সেবাটি শুধুমাত্র পেইড সিরিয়াল গ্রাহকদের জন্য।')
      } else {
        setPrescriptionData(data[0])
      }
    } catch (error) {
      console.error('Error:', error)
      setPrescriptionError('তথ্য খোঁজার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setPrescriptionLoading(false)
    }
  }

  async function downloadAppointmentCard(format) {
    if (!appointmentCardRef.current) return
    
    setDownloadingAppointment(true)
    try {
      const canvas = await html2canvas(appointmentCardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })
      
      const link = document.createElement('a')
      link.download = `appointment-${appointmentData.booking_ref}.${format}`
      link.href = canvas.toDataURL(`image/${format}`, 0.95)
      link.click()
    } catch (error) {
      console.error('Download error:', error)
      alert('ডাউনলোড করতে সমস্যা হয়েছে')
    } finally {
      setDownloadingAppointment(false)
    }
  }

  async function getSignedUrl(storagePath) {
    if (!storagePath) return null
    
    if (!storagePath.startsWith('storage:')) {
      return storagePath
    }
    
    const filePath = storagePath.replace('storage:', '')
    const { data, error } = await supabase.storage
      .from('prescriptions')
      .createSignedUrl(filePath, 3600)
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }
    return data.signedUrl
  }

  async function downloadPrescription() {
    if (!prescriptionData?.prescription_url) return
    
    setDownloadingPrescription(true)
    try {
      const url = await getSignedUrl(prescriptionData.prescription_url)
      
      if (!url) {
        alert('প্রেসক্রিপশন ডাউনলোড করতে সমস্যা হয়েছে')
        return
      }

      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      
      const ext = prescriptionData.prescription_url.startsWith('storage:') 
        ? prescriptionData.prescription_url.split('.').pop()
        : prescriptionData.prescription_url.split('.').pop()
      link.download = `prescription-${prescriptionData.booking_ref}.${ext}`
      link.click()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download error:', error)
      const url = await getSignedUrl(prescriptionData.prescription_url)
      if (url) {
        window.open(url, '_blank')
      }
    } finally {
      setDownloadingPrescription(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 border-4 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ডাউনলোড সেন্টার</h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-2xl mx-auto">
              আপনার অ্যাপয়েন্টমেন্ট স্লিপ এবং প্রেসক্রিপশন ডাউনলোড করুন
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 md:p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
            <div className="flex justify-center">
              <div className="inline-flex p-1.5 bg-gray-100 rounded-2xl shadow-inner">
                <button
                  onClick={() => setActiveTab('appointment')}
                  className={`relative flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
                    activeTab === 'appointment'
                      ? 'bg-white text-primary-700 shadow-lg shadow-primary-100'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                    activeTab === 'appointment'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">অ্যাপয়েন্টমেন্ট স্লিপ</span>
                  <span className="sm:hidden">স্লিপ</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('prescription')}
                  className={`relative flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
                    activeTab === 'prescription'
                      ? 'bg-white text-amber-700 shadow-lg shadow-amber-100'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                    activeTab === 'prescription'
                      ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">প্রেসক্রিপশন</span>
                  <span className="sm:hidden">প্রেসক্রিপশন</span>
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    প্রিমিয়াম
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'appointment' && (
              <div className="space-y-8">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">অ্যাপয়েন্টমেন্ট খুঁজুন</h2>
                  <p className="text-gray-600">
                    আপনার রেফারেন্স নম্বর অথবা ফোন নম্বর দিয়ে অ্যাপয়েন্টমেন্ট খুঁজুন এবং স্লিপ ডাউনলোড করুন
                  </p>
                </div>

                <form onSubmit={searchAppointment} className="max-w-xl mx-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={appointmentSearch}
                        onChange={(e) => setAppointmentSearch(e.target.value)}
                        placeholder="রেফারেন্স নম্বর বা ফোন নম্বর"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={appointmentLoading}
                      className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary-600/30"
                    >
                      {appointmentLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          খুঁজছি...
                        </span>
                      ) : 'খুঁজুন'}
                    </button>
                  </div>
                </form>

                {appointmentError && (
                  <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-red-600 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {appointmentError}
                    </p>
                  </div>
                )}

                {appointmentData && (
                  <div className="max-w-2xl mx-auto">
                    <div 
                      ref={appointmentCardRef}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-primary-100 overflow-hidden"
                    >
                      <div className={`${appointmentData.isPaid ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-primary-600 to-primary-700'} text-white p-6`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src="/logo-icon.png" alt="ইজি ডক্টর রংপুর" className="w-12 h-12 rounded-xl object-cover" />
                            <div>
                              <h3 className="text-xl font-bold">ইজি ডক্টর রংপুর</h3>
                              <p className="text-sm opacity-90">অ্যাপয়েন্টমেন্ট স্লিপ</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {appointmentData.isPaid && (
                              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs px-3 py-1 rounded-full mb-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                পেইড সিরিয়াল
                              </span>
                            )}
                            <p className="text-2xl font-bold">{appointmentData.booking_ref}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">রোগীর তথ্য</h4>
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">নাম</p>
                                  <p className="font-semibold text-gray-800">{appointmentData.patient_name || 'তথ্য নেই'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">ফোন</p>
                                  <p className="font-semibold text-gray-800">{appointmentData.patient_phone || 'তথ্য নেই'}</p>
                                </div>
                              </div>
                              {appointmentData.patient_age && (
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">বয়স</p>
                                    <p className="font-semibold text-gray-800">{toBengaliNumber(appointmentData.patient_age)} বছর</p>
                                  </div>
                                </div>
                              )}
                              {(appointmentData.upazila || appointmentData.district) && (
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">ঠিকানা</p>
                                    <p className="font-semibold text-gray-800">
                                      {appointmentData.upazila}{appointmentData.upazila && appointmentData.district ? ', ' : ''}{appointmentData.district}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">অ্যাপয়েন্টমেন্ট তথ্য</h4>
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">ডাক্তার</p>
                                  <p className="font-semibold text-gray-800">{appointmentData.doctor_name || 'তথ্য নেই'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">তারিখ</p>
                                  <p className="font-semibold text-gray-800">{appointmentData.appointment_date || 'তথ্য নেই'}</p>
                                </div>
                              </div>
                              {appointmentData.serial_number && (
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">সিরিয়াল নম্বর</p>
                                    <p className="font-semibold text-gray-800">{toBengaliNumber(appointmentData.serial_number)}</p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">স্ট্যাটাস</p>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    appointmentData.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    appointmentData.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                    appointmentData.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {appointmentData.status === 'confirmed' ? 'নিশ্চিত' : 
                                     appointmentData.status === 'completed' ? 'সম্পন্ন' : 
                                     appointmentData.status === 'cancelled' ? 'বাতিল' : 'অপেক্ষমান'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {appointmentData.isPaid && appointmentData.transaction_id && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs text-green-600">পেমেন্ট সফল</p>
                                <p className="font-semibold text-green-700">TrxID: {appointmentData.transaction_id}</p>
                                {appointmentData.payment_amount && (
                                  <p className="text-sm text-green-600">৳{toBengaliNumber(appointmentData.payment_amount)}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="text-center text-xs text-gray-400 pt-4 border-t">
                          <p>অনুগ্রহ করে এই স্লিপটি ডাক্তারের চেম্বারে দেখান</p>
                          <p className="mt-1">www.rangpurdoctor.com</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                      <button
                        onClick={() => downloadAppointmentCard('jpeg')}
                        disabled={downloadingAppointment}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg"
                      >
                        {downloadingAppointment ? (
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        JPEG ডাউনলোড
                      </button>
                      <button
                        onClick={() => downloadAppointmentCard('png')}
                        disabled={downloadingAppointment}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg"
                      >
                        {downloadingAppointment ? (
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        PNG ডাউনলোড
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prescription' && (
              <div className="space-y-8">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">প্রেসক্রিপশন ডাউনলোড</h2>
                    <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      প্রিমিয়াম সার্ভিস
                    </span>
                  </div>
                  <p className="text-gray-600">
                    পেইড সিরিয়াল গ্রাহকরা ডাক্তারের প্রেসক্রিপশন ডাউনলোড করতে পারবেন
                  </p>
                </div>

                <div className="max-w-xl mx-auto bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-1">এই সেবা কীভাবে কাজ করে?</h3>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          শুধুমাত্র পেইড সিরিয়াল গ্রাহকরা এই সেবা পাবেন
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          ডাক্তার দেখানোর পর প্রেসক্রিপশন আপলোড করা হবে
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          প্রেসক্রিপশন আপলোড হলে এখান থেকে ডাউনলোড করতে পারবেন
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <form onSubmit={searchPrescription} className="max-w-xl mx-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={prescriptionSearch}
                        onChange={(e) => setPrescriptionSearch(e.target.value)}
                        placeholder="পেইড সিরিয়াল রেফারেন্স বা ফোন নম্বর"
                        className="w-full pl-12 pr-4 py-4 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={prescriptionLoading}
                      className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-amber-500/30"
                    >
                      {prescriptionLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          খুঁজছি...
                        </span>
                      ) : 'খুঁজুন'}
                    </button>
                  </div>
                </form>

                {prescriptionError && (
                  <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-red-600 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {prescriptionError}
                    </p>
                  </div>
                )}

                {prescriptionData && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl border-2 border-amber-100 overflow-hidden shadow-lg">
                      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">প্রেসক্রিপশন</h3>
                              <p className="text-sm opacity-90">রেফ: {prescriptionData.booking_ref}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              prescriptionData.prescription_url 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-white/20 text-white'
                            }`}>
                              {prescriptionData.prescription_url ? (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                  প্রেসক্রিপশন প্রস্তুত
                                </>
                              ) : 'অপেক্ষমান'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-1">রোগী</p>
                            <p className="font-semibold text-gray-800">{prescriptionData.patient_name || 'তথ্য নেই'}</p>
                            <p className="text-sm text-gray-600">{prescriptionData.patient_phone || 'তথ্য নেই'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-1">ডাক্তার</p>
                            <p className="font-semibold text-gray-800">{prescriptionData.doctor_name || 'তথ্য নেই'}</p>
                            <p className="text-sm text-gray-600">{prescriptionData.appointment_date || 'তথ্য নেই'}</p>
                          </div>
                        </div>

                        {prescriptionData.prescription_url ? (
                          <div className="text-center">
                            <div className="bg-green-50 rounded-xl p-6 mb-4">
                              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h4 className="text-lg font-semibold text-green-700 mb-2">প্রেসক্রিপশন প্রস্তুত!</h4>
                              <p className="text-green-600 text-sm mb-4">আপনার প্রেসক্রিপশন ডাউনলোডের জন্য প্রস্তুত</p>
                              <button
                                onClick={downloadPrescription}
                                disabled={downloadingPrescription}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg"
                              >
                                {downloadingPrescription ? (
                                  <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    ডাউনলোড হচ্ছে...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    প্রেসক্রিপশন ডাউনলোড
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="bg-amber-50 rounded-xl p-6">
                              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h4 className="text-lg font-semibold text-amber-700 mb-2">প্রেসক্রিপশন অপেক্ষমান</h4>
                              <p className="text-amber-600 text-sm">
                                ডাক্তার দেখানোর পর প্রেসক্রিপশন আপলোড করা হবে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেক করুন।
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">কীভাবে ডাউনলোড করবেন?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              সহজ তিনটি ধাপে আপনার অ্যাপয়েন্টমেন্ট স্লিপ বা প্রেসক্রিপশন ডাউনলোড করুন
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-primary-600">১</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">রেফারেন্স দিন</h3>
              <p className="text-gray-600">আপনার বুকিং রেফারেন্স নম্বর অথবা মোবাইল নম্বর দিন</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-blue-600">২</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">তথ্য দেখুন</h3>
              <p className="text-gray-600">আপনার অ্যাপয়েন্টমেন্ট বা প্রেসক্রিপশন এর বিস্তারিত দেখুন</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-green-600">৩</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">ডাউনলোড করুন</h3>
              <p className="text-gray-600">JPEG বা PNG ফরম্যাটে ডাউনলোড করুন</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">নিরাপদ ও গোপনীয়</h3>
                <p className="text-sm text-gray-600">আপনার তথ্য সম্পূর্ণ সুরক্ষিত</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">দ্রুত ডাউনলোড</h3>
                <p className="text-sm text-gray-600">মাত্র কয়েক সেকেন্ডে</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">হাই কোয়ালিটি</h3>
                <p className="text-sm text-gray-600">JPEG ও PNG ফরম্যাট</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Download
