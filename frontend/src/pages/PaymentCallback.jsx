import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import html2canvas from 'html2canvas'

const API_URL = import.meta.env.VITE_API_URL || '';

const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)])
}

const PAID_SERIAL_FEE = 100

function PaymentCallback() {
  const navigate = useNavigate()
  const popupRef = useRef(null)
  const paymentProcessedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [appointmentData, setAppointmentData] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (paymentProcessedRef.current) {
      console.log('Payment already being processed, skipping...')
      return
    }
    
    const urlParams = new URLSearchParams(window.location.search)
    const paymentID = urlParams.get('paymentID')
    
    if (paymentID) {
      const callbackKey = `payment_callback_${paymentID}`
      const callbackStatus = sessionStorage.getItem(callbackKey)
      
      if (callbackStatus === 'completed' || callbackStatus === 'processing') {
        console.log('Payment callback already processed or in progress')
        setLoading(false)
        
        const savedData = sessionStorage.getItem('pendingPaidAppointment')
        if (!savedData) {
          navigate('/')
          return
        }
        return
      }
      
      paymentProcessedRef.current = true
      sessionStorage.setItem(callbackKey, 'processing')
    }
    
    handleCallback()
  }, [])

  async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentID = urlParams.get('paymentID')
    const status = urlParams.get('status')

    if (!paymentID || !status) {
      setError('পেমেন্ট তথ্য পাওয়া যায়নি।')
      setLoading(false)
      return
    }

    const savedData = sessionStorage.getItem('pendingPaidAppointment')
    
    if (!savedData) {
      setError('সেশন ডাটা পাওয়া যায়নি। অনুগ্রহ করে আবার বুকিং শুরু করুন।')
      setLoading(false)
      return
    }

    if (status === 'success') {
      try {
        const response = await fetch(`${API_URL}/api/bkash/execute-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentID })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setTransactionId(data.trxID)
          await saveAppointment(data.trxID, paymentID, savedData)
        } else {
          setError(data.message || 'পেমেন্ট যাচাই করতে সমস্যা হয়েছে।')
        }
      } catch (err) {
        console.error('Execute payment error:', err)
        setError('পেমেন্ট যাচাই করতে সমস্যা হয়েছে।')
      }
    } else if (status === 'failure' || status === 'cancel') {
      setError('পেমেন্ট বাতিল হয়েছে বা ব্যর্থ হয়েছে।')
    }

    setLoading(false)
  }

  async function saveAppointment(trxID, paymentID, savedDataStr) {
    const callbackKey = `payment_callback_${paymentID}`
    
    try {
      if (!supabase || !isConfigured) {
        setError('ডাটাবেস সংযোগ নেই। Transaction ID: ' + trxID)
        sessionStorage.removeItem(callbackKey)
        return
      }

      const { data: existingAppointment } = await supabase
        .from('paid_appointments')
        .select('id, booking_ref')
        .eq('payment_id', paymentID)
        .maybeSingle()
      
      if (existingAppointment) {
        console.log('Appointment already exists for this payment, showing success...')
        sessionStorage.setItem(callbackKey, 'completed')
        sessionStorage.removeItem('pendingPaidAppointment')
        setBookingRef(existingAppointment.booking_ref)
        const { data: fullData } = await supabase
          .from('paid_appointments')
          .select('*')
          .eq('id', existingAppointment.id)
          .single()
        if (fullData) {
          setAppointmentData(fullData)
        }
        setSuccess(true)
        return
      }

      const parsed = JSON.parse(savedDataStr)
      const { formData, doctorId, doctorName, doctorCategory, doctorChamberAddress } = parsed

      if (!formData.patient_name || !formData.patient_phone) {
        setError('ফর্ম ডাটা অসম্পূর্ণ। Transaction ID: ' + trxID)
        sessionStorage.removeItem(callbackKey)
        return
      }

      const ref = 'PD' + Date.now().toString().slice(-8)

      const appointmentDataToSave = {
        doctor_id: doctorId,
        doctor_name: doctorName,
        doctor_category: doctorCategory,
        chamber_address: doctorChamberAddress,
        ...formData,
        booking_ref: ref,
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'bkash',
        payment_amount: PAID_SERIAL_FEE,
        transaction_id: trxID,
        payment_id: paymentID
      }

      const { error: dbError } = await supabase.from('paid_appointments').insert([appointmentDataToSave])

      if (dbError) {
        if (dbError.code === '23505') {
          console.log('Duplicate entry detected, appointment already exists')
          const { data: existing } = await supabase
            .from('paid_appointments')
            .select('*')
            .eq('payment_id', paymentID)
            .single()
          if (existing) {
            setBookingRef(existing.booking_ref)
            setAppointmentData(existing)
            setSuccess(true)
            sessionStorage.setItem(callbackKey, 'completed')
            sessionStorage.removeItem('pendingPaidAppointment')
            return
          }
        }
        throw dbError
      }

      sessionStorage.setItem(callbackKey, 'completed')
      sessionStorage.removeItem('pendingPaidAppointment')
      setAppointmentData({ ...appointmentDataToSave, booking_ref: ref })
      setBookingRef(ref)
      setSuccess(true)
    } catch (err) {
      console.error('Error saving appointment:', err)
      setError('অ্যাপয়েন্টমেন্ট সংরক্ষণ করতে সমস্যা। Transaction ID: ' + trxID)
      sessionStorage.removeItem(callbackKey)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('bn-BD', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })
  }

  const getGenderText = (gender) => {
    if (gender === 'male') return 'পুরুষ'
    if (gender === 'female') return 'মহিলা'
    return 'অন্যান্য'
  }

  const handleDownload = async () => {
    if (!popupRef.current) return
    
    setDownloading(true)
    try {
      const canvas = await html2canvas(popupRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      const link = document.createElement('a')
      link.download = `পেইড_সিরিয়াল_${bookingRef}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download error:', err)
      alert('ডাউনলোড করতে সমস্যা হয়েছে।')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">পেমেন্ট যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">সমস্যা হয়েছে</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-4 rounded-lg"
          >
            হোম পেইজে ফিরে যান
          </button>
        </div>
      </div>
    )
  }

  if (success && appointmentData) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[95vh] flex flex-col">
          <div ref={popupRef} className="bg-white rounded-t-xl sm:rounded-t-2xl overflow-hidden flex-1 overflow-y-auto">
            <div className="bg-white p-4 sm:p-5 text-center sticky top-0 border-b border-gray-100">
              <img src="/logo-icon.png" alt="Logo" className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full" />
              <h1 className="text-base sm:text-lg font-bold text-gray-800">Rangpur Doctor Appointment</h1>
            </div>
            
            <div className="p-3 sm:p-4">
              <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-3 mb-4 text-center">
                <p className="text-gray-600 text-xs mb-0.5">বুকিং রেফারেন্স</p>
                <p className="text-xl sm:text-2xl font-bold text-pink-600">{bookingRef}</p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                  <h3 className="font-semibold text-gray-700 text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ডাক্তার তথ্য
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">ডাক্তার</p>
                      <p className="font-medium text-gray-800">{appointmentData.doctor_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">বিভাগ</p>
                      <p className="font-medium text-gray-800">{appointmentData.doctor_category || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">অ্যাপয়েন্টমেন্ট তারিখ</p>
                      <p className="font-medium text-pink-600">{formatDate(appointmentData.appointment_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">চেম্বার ঠিকানা</p>
                      <p className="font-medium text-gray-800">{appointmentData.chamber_address || '-'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                  <h3 className="font-semibold text-gray-700 text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    রোগীর তথ্য
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                    <div className="col-span-2">
                      <p className="text-gray-500 text-[10px] sm:text-xs">নাম</p>
                      <p className="font-medium text-gray-800">{appointmentData.patient_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">বয়স/লিঙ্গ</p>
                      <p className="font-medium text-gray-800">{toBengaliNumber(appointmentData.patient_age)}/{getGenderText(appointmentData.patient_gender).charAt(0)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-[10px] sm:text-xs">মোবাইল</p>
                      <p className="font-medium text-gray-800">{appointmentData.patient_phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">ঠিকানা</p>
                      <p className="font-medium text-gray-800 text-[11px] sm:text-xs">{appointmentData.upazila}, {appointmentData.district}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-2.5 sm:p-3">
                  <h3 className="font-semibold text-green-700 text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    পেমেন্ট তথ্য
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">মাধ্যম</p>
                      <p className="font-medium text-green-700">বিকাশ</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">পরিশোধিত</p>
                      <p className="font-medium text-green-700">{toBengaliNumber(PAID_SERIAL_FEE)} টাকা</p>
                    </div>
                    {transactionId && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-[10px] sm:text-xs">ট্রানজেকশন আইডি</p>
                        <p className="font-medium text-green-700 text-xs">{transactionId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {appointmentData.problem_description && (
                  <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-500 text-[10px] sm:text-xs">সমস্যার বিবরণ</p>
                    <p className="font-medium text-gray-800 text-xs sm:text-sm">{appointmentData.problem_description}</p>
                  </div>
                )}
                
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-2 text-center">
                  <p className="text-[10px] sm:text-xs text-pink-700">
                    এই তথ্যটি সংরক্ষণ করুন এবং চেম্বারে দেখান
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 border-t bg-gray-50 rounded-b-xl sm:rounded-b-2xl flex gap-2 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-3 rounded-lg text-sm transition-colors"
            >
              হোম পেইজ
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>ডাউনলোড...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>ডাউনলোড</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default PaymentCallback
