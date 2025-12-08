import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import html2canvas from 'html2canvas'

const API_URL = import.meta.env.VITE_API_URL || '';

const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)])
}

const districtUpazilaData = {
  'রংপুর': ['রংপুর সদর', 'গঙ্গাচড়া', 'তারাগঞ্জ', 'বদরগঞ্জ', 'মিঠাপুকুর', 'পীরগঞ্জ', 'কাউনিয়া', 'পীরগাছা'],
  'দিনাজপুর': ['দিনাজপুর সদর', 'বীরগঞ্জ', 'বিরামপুর', 'বোচাগঞ্জ', 'চিরিরবন্দর', 'ফুলবাড়ী', 'ঘোড়াঘাট', 'হাকিমপুর', 'কাহারোল', 'খানসামা', 'নবাবগঞ্জ', 'পার্বতীপুর'],
  'কুড়িগ্রাম': ['কুড়িগ্রাম সদর', 'উলিপুর', 'চিলমারী', 'নাগেশ্বরী', 'ভুরুঙ্গামারী', 'ফুলবাড়ী', 'রাজারহাট', 'রৌমারী', 'রাজীবপুর'],
  'লালমনিরহাট': ['লালমনিরহাট সদর', 'আদিতমারী', 'কালীগঞ্জ', 'হাতীবান্ধা', 'পাটগ্রাম'],
  'নীলফামারী': ['নীলফামারী সদর', 'সৈয়দপুর', 'ডোমার', 'ডিমলা', 'জলঢাকা', 'কিশোরগঞ্জ'],
  'গাইবান্ধা': ['গাইবান্ধা সদর', 'গোবিন্দগঞ্জ', 'পলাশবাড়ী', 'সাদুল্লাপুর', 'সাঘাটা', 'সুন্দরগঞ্জ', 'ফুলছড়ি'],
  'ঠাকুরগাঁও': ['ঠাকুরগাঁও সদর', 'পীরগঞ্জ', 'রাণীশংকৈল', 'হরিপুর', 'বালিয়াডাঙ্গী'],
  'পঞ্চগড়': ['পঞ্চগড় সদর', 'বোদা', 'আটোয়ারী', 'দেবীগঞ্জ', 'তেতুলিয়া']
}

const districts = Object.keys(districtUpazilaData)

const weekDaysList = [
  { id: 'sunday', name: 'রবি' },
  { id: 'monday', name: 'সোম' },
  { id: 'tuesday', name: 'মঙ্গল' },
  { id: 'wednesday', name: 'বুধ' },
  { id: 'thursday', name: 'বৃহঃ' },
  { id: 'friday', name: 'শুক্র' },
  { id: 'saturday', name: 'শনি' },
]

const getDayId = (date) => {
  const dayIndex = date.getDay()
  const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return dayMap[dayIndex]
}

const getNext8Days = () => {
  const days = []
  const today = new Date()
  for (let i = 1; i <= 8; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayId = getDayId(date)
    const dayName = weekDaysList.find(d => d.id === dayId)?.name || ''
    days.push({
      date: date,
      dateStr: date.toISOString().split('T')[0],
      dayId: dayId,
      dayName: dayName,
      dayNum: date.getDate(),
      month: date.toLocaleDateString('bn-BD', { month: 'short' })
    })
  }
  return days
}

const PAID_SERIAL_FEE = 100

function PaidBookAppointment() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const popupRef = useRef(null)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [paymentStep, setPaymentStep] = useState('form')
  const [paymentError, setPaymentError] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [savedAppointmentData, setSavedAppointmentData] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [appointmentCounts, setAppointmentCounts] = useState({})
  const [showRemainingPopup, setShowRemainingPopup] = useState(false)
  const [selectedDateInfo, setSelectedDateInfo] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    patient_age: '',
    patient_gender: 'male',
    district: '',
    upazila: '',
    appointment_date: '',
    problem_description: ''
  })

  useEffect(() => {
    fetchDoctor()
  }, [doctorId])

  useEffect(() => {
    if (doctor) {
      fetchAppointmentCounts()
    }
  }, [doctor])

  async function fetchDoctor() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorId)
      
      let data, error
      
      if (isUUID) {
        const result = await supabase
          .from('doctors')
          .select('*')
          .eq('id', doctorId)
          .single()
        data = result.data
        error = result.error
      } else {
        const result = await supabase
          .from('doctors')
          .select('*')
          .eq('slug', doctorId)
          .single()
        data = result.data
        error = result.error
        
        if (error && !data) {
          const fallbackResult = await supabase
            .from('doctors')
            .select('*')
            .eq('id', doctorId)
            .single()
          data = fallbackResult.data
          error = fallbackResult.error
        }
      }
      
      if (error) throw error
      setDoctor(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAppointmentCounts() {
    try {
      if (!supabase || !isConfigured || !doctor) return
      
      const next8Days = getNext8Days()
      const dateStrings = next8Days.map(d => d.dateStr)
      
      const { data: paidAppointments, error: err } = await supabase
        .from('paid_appointments')
        .select('appointment_date')
        .eq('doctor_id', doctor.id)
        .in('appointment_date', dateStrings)
      
      if (err) {
        console.error('Error fetching appointments:', err)
        return
      }
      
      const counts = {}
      dateStrings.forEach(date => {
        const paidCount = paidAppointments?.filter(a => a.appointment_date === date).length || 0
        counts[date] = paidCount
      })
      
      setAppointmentCounts(counts)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function handleDateSelect(day, isLimitFull, event) {
    if (isLimitFull) return
    
    const limit = doctor?.paid_appointment_limit
    const currentCount = appointmentCounts[day.dateStr] || 0
    const remaining = limit ? limit - currentCount : null
    
    setFormData({ ...formData, appointment_date: day.dateStr })
    setSelectedDateInfo({
      date: day.dateStr,
      dayNum: day.dayNum,
      month: day.month,
      remaining: remaining,
      limit: limit
    })
  }

  function handleChange(e) {
    const { name, value } = e.target
    
    if (name === 'district') {
      setFormData({
        ...formData,
        district: value,
        upazila: ''
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  function validateForm() {
    if (!formData.patient_name.trim()) {
      alert('অনুগ্রহ করে রোগীর নাম লিখুন।')
      return false
    }
    if (!formData.patient_phone.trim()) {
      alert('অনুগ্রহ করে মোবাইল নম্বর লিখুন।')
      return false
    }
    if (!formData.patient_age.trim()) {
      alert('অনুগ্রহ করে বয়স লিখুন।')
      return false
    }
    if (!formData.district) {
      alert('অনুগ্রহ করে জেলা নির্বাচন করুন।')
      return false
    }
    if (!formData.upazila) {
      alert('অনুগ্রহ করে উপজেলা নির্বাচন করুন।')
      return false
    }
    if (!formData.appointment_date) {
      alert('অনুগ্রহ করে অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন।')
      return false
    }
    return true
  }

  async function handleProceedToPayment(e) {
    e.preventDefault()
    if (!validateForm()) return
    setPaymentStep('payment')
  }

  async function initiatePayment() {
    setSubmitting(true)
    setPaymentError('')
    
    try {
      if (!doctor?.id) {
        setPaymentError('ডাক্তার তথ্য লোড হয়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।')
        setSubmitting(false)
        return
      }
      
      sessionStorage.setItem('pendingPaidAppointment', JSON.stringify({
        formData,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorCategory: doctor.category_name,
        doctorChamberAddress: doctor.chamber_address
      }))
      
      const response = await fetch(`${API_URL}/api/bkash/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: PAID_SERIAL_FEE,
          payerReference: formData.patient_phone,
          merchantInvoiceNumber: 'PAID' + Date.now().toString().slice(-8)
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.bkashURL) {
        window.location.href = data.bkashURL
      } else {
        sessionStorage.removeItem('pendingPaidAppointment')
        setPaymentError(data.message || 'পেমেন্ট শুরু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      }
    } catch (error) {
      console.error('Payment error:', error)
      sessionStorage.removeItem('pendingPaidAppointment')
      setPaymentError('পেমেন্ট শুরু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setSubmitting(false)
    }
  }

  const paymentProcessedRef = useRef(false)
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentID = urlParams.get('paymentID')
    const status = urlParams.get('status')
    
    if (paymentID && status) {
      const callbackKey = `payment_callback_${paymentID}`
      const callbackStatus = sessionStorage.getItem(callbackKey)
      
      if (callbackStatus === 'completed' || callbackStatus === 'processing' || paymentProcessedRef.current) {
        console.log('Payment callback already processed or in progress, skipping...')
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }
      
      paymentProcessedRef.current = true
      sessionStorage.setItem(callbackKey, 'processing')
      
      const savedData = sessionStorage.getItem('pendingPaidAppointment')
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          setFormData(parsed.formData)
        } catch (e) {
          console.error('Error parsing saved data:', e)
        }
      }
      handlePaymentCallback(paymentID, status, callbackKey)
    }
  }, [])

  async function handlePaymentCallback(paymentID, status, callbackKey) {
    const savedData = sessionStorage.getItem('pendingPaidAppointment')
    
    if (!savedData) {
      setPaymentError('সেশন ডাটা পাওয়া যায়নি। অনুগ্রহ করে আবার বুকিং শুরু করুন।')
      setPaymentStep('form')
      if (callbackKey) sessionStorage.removeItem(callbackKey)
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }
    
    if (status === 'success') {
      setSubmitting(true)
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
          await saveAppointment(data.trxID, paymentID, callbackKey)
        } else {
          setPaymentError(data.message || 'পেমেন্ট যাচাই করতে সমস্যা হয়েছে।')
          setPaymentStep('payment')
          if (callbackKey) sessionStorage.removeItem(callbackKey)
        }
      } catch (error) {
        console.error('Execute payment error:', error)
        setPaymentError('পেমেন্ট যাচাই করতে সমস্যা হয়েছে।')
        setPaymentStep('payment')
        if (callbackKey) sessionStorage.removeItem(callbackKey)
      } finally {
        setSubmitting(false)
      }
    } else if (status === 'failure' || status === 'cancel') {
      setPaymentError('পেমেন্ট বাতিল হয়েছে বা ব্যর্থ হয়েছে। তথ্য সংরক্ষিত আছে, আবার চেষ্টা করুন।')
      setPaymentStep('payment')
      if (callbackKey) sessionStorage.removeItem(callbackKey)
    }
    
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  async function saveAppointment(trxID, paymentID, callbackKey) {
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই। অনুগ্রহ করে পরে চেষ্টা করুন।')
        if (callbackKey) sessionStorage.removeItem(callbackKey)
        return
      }
      
      const { data: existingAppointment } = await supabase
        .from('paid_appointments')
        .select('id, booking_ref')
        .eq('payment_id', paymentID)
        .maybeSingle()
      
      if (existingAppointment) {
        console.log('Appointment already exists for this payment, showing success...')
        if (callbackKey) sessionStorage.setItem(callbackKey, 'completed')
        sessionStorage.removeItem('pendingPaidAppointment')
        setBookingRef(existingAppointment.booking_ref)
        setSuccess(true)
        return
      }
      
      const savedData = sessionStorage.getItem('pendingPaidAppointment')
      
      if (!savedData) {
        alert('সেশন ডাটা পাওয়া যায়নি। পেমেন্ট সফল হয়েছে (TrxID: ' + trxID + ')। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।')
        if (callbackKey) sessionStorage.removeItem(callbackKey)
        return
      }
      
      let appointmentFormData = formData
      let savedDoctorName = doctor?.name
      let savedDoctorId = doctor?.id
      let savedDoctorCategory = doctor?.category_name
      let savedDoctorChamberAddress = doctor?.chamber_address
      
      try {
        const parsed = JSON.parse(savedData)
        appointmentFormData = parsed.formData || formData
        savedDoctorName = parsed.doctorName || doctor?.name
        savedDoctorId = parsed.doctorId || doctor?.id
        savedDoctorCategory = parsed.doctorCategory || doctor?.category_name
        savedDoctorChamberAddress = parsed.doctorChamberAddress || doctor?.chamber_address
        
        if (!appointmentFormData.patient_name || !appointmentFormData.patient_phone) {
          throw new Error('Incomplete form data')
        }
        
        if (!savedDoctorId) {
          throw new Error('Doctor ID not found')
        }
      } catch (e) {
        console.error('Error parsing saved data:', e)
        alert('ডাটা প্রসেস করতে সমস্যা। পেমেন্ট সফল (TrxID: ' + trxID + ')। আমাদের সাথে যোগাযোগ করুন।')
        if (callbackKey) sessionStorage.removeItem(callbackKey)
        return
      }
      
      const ref = 'PD' + Date.now().toString().slice(-8)
      
      const appointmentData = {
        doctor_id: savedDoctorId,
        doctor_name: savedDoctorName,
        doctor_category: savedDoctorCategory,
        chamber_address: savedDoctorChamberAddress,
        ...appointmentFormData,
        booking_ref: ref,
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'bkash',
        payment_amount: PAID_SERIAL_FEE,
        transaction_id: trxID,
        payment_id: paymentID
      }

      const { error } = await supabase.from('paid_appointments').insert([appointmentData])

      if (error) {
        if (error.code === '23505') {
          console.log('Duplicate entry detected, appointment already exists')
          const { data: existing } = await supabase
            .from('paid_appointments')
            .select('booking_ref')
            .eq('payment_id', paymentID)
            .single()
          if (existing) {
            setBookingRef(existing.booking_ref)
            setSuccess(true)
            if (callbackKey) sessionStorage.setItem(callbackKey, 'completed')
            sessionStorage.removeItem('pendingPaidAppointment')
            return
          }
        }
        throw error
      }
      
      if (callbackKey) sessionStorage.setItem(callbackKey, 'completed')
      sessionStorage.removeItem('pendingPaidAppointment')
      setSavedAppointmentData({ ...appointmentData, booking_ref: ref, doctor_category: savedDoctorCategory, chamber_address: savedDoctorChamberAddress })
      setBookingRef(ref)
      setSuccess(true)
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert('অ্যাপয়েন্টমেন্ট সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন। Transaction ID: ' + trxID)
      if (callbackKey) sessionStorage.removeItem(callbackKey)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
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
    } catch (error) {
      console.error('Download error:', error)
      alert('ডাউনলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setDownloading(false)
    }
  }

  if (success) {
    const appointmentInfo = savedAppointmentData || formData

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
                      <p className="font-medium text-gray-800">{appointmentInfo.doctor_name || doctor?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">বিভাগ</p>
                      <p className="font-medium text-gray-800">{appointmentInfo.doctor_category || doctor?.category_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">অ্যাপয়েন্টমেন্ট তারিখ</p>
                      <p className="font-medium text-pink-600">{formatDate(appointmentInfo.appointment_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">চেম্বার ঠিকানা</p>
                      <p className="font-medium text-gray-800">{appointmentInfo.chamber_address || doctor?.chamber_address || '-'}</p>
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
                      <p className="font-medium text-gray-800">{appointmentInfo.patient_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">বয়স/লিঙ্গ</p>
                      <p className="font-medium text-gray-800">{toBengaliNumber(appointmentInfo.patient_age)}/{getGenderText(appointmentInfo.patient_gender).charAt(0)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-[10px] sm:text-xs">মোবাইল</p>
                      <p className="font-medium text-gray-800">{appointmentInfo.patient_phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] sm:text-xs">ঠিকানা</p>
                      <p className="font-medium text-gray-800 text-[11px] sm:text-xs">{appointmentInfo.upazila}, {appointmentInfo.district}</p>
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

                {appointmentInfo.problem_description && (
                  <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-500 text-[10px] sm:text-xs">সমস্যার বিবরণ</p>
                    <p className="font-medium text-gray-800 text-xs sm:text-sm">{appointmentInfo.problem_description}</p>
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

  if (!doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800">ডাক্তার পাওয়া যায়নি</h1>
        <Link to="/rangpur-specialist-doctors-list-online-serial" className="btn-primary mt-4 inline-block">ফিরে যান</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/doctor/${doctor?.slug || doctorId}`} className="text-pink-600 hover:underline mb-6 inline-flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        ফিরে যান
      </Link>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">পেইড সিরিয়াল</h1>
              <p className="text-pink-100 text-sm">প্রিমিয়াম সুবিধা সহ</p>
            </div>
          </div>
          <p className="text-pink-200 mt-2">{doctor.name} - {doctor.category_name}</p>
        </div>

        {paymentStep === 'form' ? (
          <form onSubmit={handleProceedToPayment} className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-pink-200">
                <span className="text-gray-600">পেইড সিরিয়াল ফি:</span>
                <span className="text-xl font-bold text-pink-600">{toBengaliNumber(PAID_SERIAL_FEE)} টাকা</span>
              </div>
              <p className="text-sm text-gray-600 mt-3 bg-white p-2 rounded">
                <span className="font-medium text-pink-700">বিকাশ পেমেন্ট:</span> পেইড সিরিয়াল ফি ({toBengaliNumber(PAID_SERIAL_FEE)} টাকা) বিকাশে প্রদান করুন।
              </p>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h3 className="font-semibold text-pink-800 mb-3">পেইড সিরিয়ালের সুবিধা:</h3>
              <ul className="space-y-2 text-sm text-pink-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">✓</span>
                  <span>সিরিয়াল প্রথমে হবে - অপেক্ষার সময় কম</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">✓</span>
                  <span>আমাদের একজন প্রতিনিধি উপস্থিত থাকবে</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">✓</span>
                  <span>প্রেসক্রিপশন অনলাইনে - বুকিং আইডি দিয়ে ডাউনলোড করা যাবে</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">✓</span>
                  <span>আমাদের কাছে ঔষুধ কিনলে ১০% ডিসকাউন্ট</span>
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">রোগীর নাম *</label>
              <input
                type="text"
                name="patient_name"
                required
                className="input-field"
                placeholder="আপনার পুরো নাম লিখুন"
                value={formData.patient_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">মোবাইল নম্বর (বিকাশ) *</label>
              <input
                type="tel"
                name="patient_phone"
                required
                className="input-field"
                placeholder="01XXXXXXXXX"
                value={formData.patient_phone}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">এই নম্বরে বিকাশ পেমেন্ট করা হবে</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">বয়স *</label>
                <input
                  type="number"
                  name="patient_age"
                  required
                  min="1"
                  max="120"
                  className="input-field"
                  placeholder="বছর"
                  value={formData.patient_age}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">লিঙ্গ *</label>
                <select
                  name="patient_gender"
                  required
                  className="input-field"
                  value={formData.patient_gender}
                  onChange={handleChange}
                >
                  <option value="male">পুরুষ</option>
                  <option value="female">মহিলা</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">জেলা *</label>
                <select
                  name="district"
                  required
                  className="input-field"
                  value={formData.district}
                  onChange={handleChange}
                >
                  <option value="">জেলা নির্বাচন করুন</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">উপজেলা *</label>
                <select
                  name="upazila"
                  required
                  className="input-field"
                  value={formData.upazila}
                  onChange={handleChange}
                  disabled={!formData.district}
                >
                  <option value="">{formData.district ? 'উপজেলা নির্বাচন করুন' : 'প্রথমে জেলা নির্বাচন করুন'}</option>
                  {formData.district && districtUpazilaData[formData.district]?.map((upazila) => (
                    <option key={upazila} value={upazila}>{upazila}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <label className="block text-sm font-medium text-gray-700">অ্যাপয়েন্টমেন্টের তারিখ *</label>
                <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 px-3 py-1.5 rounded-lg">
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formData.appointment_date && selectedDateInfo ? (
                    <span className="text-sm font-medium text-pink-700">
                      অবশিষ্ট সিরিয়াল: {selectedDateInfo.limit ? <span className="font-bold">{toBengaliNumber(selectedDateInfo.remaining)} টি</span> : <span>সীমাহীন</span>}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-pink-600">
                      দৈনিক লিমিট: {doctor?.paid_appointment_limit ? <span className="font-bold">{toBengaliNumber(doctor.paid_appointment_limit)} টি</span> : <span>সীমাহীন</span>}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {(() => {
                  const next8Days = getNext8Days()
                  let scheduleDays = []
                  try {
                    scheduleDays = doctor?.schedule_days ? JSON.parse(doctor.schedule_days) : []
                  } catch (e) {
                    scheduleDays = []
                  }
                  
                  const limit = doctor?.paid_appointment_limit
                  
                  return next8Days.map((day) => {
                    const isOffDay = scheduleDays.length > 0 && !scheduleDays.includes(day.dayId)
                    const currentCount = appointmentCounts[day.dateStr] || 0
                    const isLimitFull = limit && currentCount >= limit
                    const isSelected = formData.appointment_date === day.dateStr
                    const isDisabled = isOffDay || isLimitFull
                    const remaining = limit ? limit - currentCount : null
                    
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={(e) => !isDisabled && handleDateSelect(day, isLimitFull, e)}
                        className={`relative p-2.5 sm:p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                          isLimitFull
                            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 text-orange-500 cursor-not-allowed'
                            : isOffDay 
                              ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : isSelected
                                ? 'bg-gradient-to-br from-pink-500 to-pink-600 border-pink-500 text-white shadow-xl shadow-pink-200 scale-[1.03] ring-2 ring-pink-300 ring-offset-1'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-pink-400 hover:bg-gradient-to-br hover:from-pink-50 hover:to-white hover:shadow-md'
                        }`}
                      >
                        {isLimitFull ? (
                          <div className="flex flex-col items-center justify-center h-full min-h-[60px]">
                            <div className="text-[10px] sm:text-xs font-medium text-orange-600 mb-0.5">
                              {day.dayName}
                            </div>
                            <div className="text-base sm:text-lg font-bold text-orange-500">
                              {toBengaliNumber(day.dayNum)}
                            </div>
                            <div className="text-[9px] sm:text-[10px] font-semibold text-orange-400 bg-orange-100 px-1.5 py-0.5 rounded mt-0.5">
                              পূর্ণ
                            </div>
                          </div>
                        ) : isOffDay ? (
                          <div className="flex flex-col items-center justify-center h-full min-h-[60px]">
                            <div className="text-[10px] sm:text-xs font-medium text-gray-400 mb-0.5">
                              {day.dayName}
                            </div>
                            <div className="text-base sm:text-lg font-bold text-gray-400">
                              {toBengaliNumber(day.dayNum)}
                            </div>
                            <div className="text-[9px] sm:text-[10px] font-medium text-gray-400">
                              বন্ধ
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full min-h-[60px]">
                            <div className={`text-[10px] sm:text-xs font-semibold mb-0.5 ${isSelected ? 'text-pink-100' : 'text-pink-500'}`}>
                              {day.dayName}
                            </div>
                            <div className={`text-xl sm:text-2xl font-bold leading-none ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                              {toBengaliNumber(day.dayNum)}
                            </div>
                            <div className={`text-[10px] sm:text-xs ${isSelected ? 'text-pink-100' : 'text-gray-500'}`}>
                              {day.month}
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })
                })()}
              </div>
              {!formData.appointment_date && (
                <p className="text-sm text-gray-500 mt-2 text-center">উপরে থেকে তারিখ নির্বাচন করুন</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">সমস্যার বিবরণ</label>
              <textarea
                name="problem_description"
                rows="3"
                className="input-field"
                placeholder="আপনার সমস্যা সংক্ষেপে লিখুন (ঐচ্ছিক)"
                value={formData.problem_description}
                onChange={handleChange}
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 text-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg"
            >
              পেমেন্টে এগিয়ে যান
            </button>
          </form>
        ) : (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <img 
                  src="https://www.bkash.com/sites/default/files/bkash_favicon.ico" 
                  alt="bKash" 
                  className="w-12 h-12"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
              <h2 className="text-xl font-bold text-gray-800">বিকাশ পেমেন্ট</h2>
              <p className="text-gray-600">পেমেন্ট সম্পন্ন করতে নিচের বাটনে ক্লিক করুন</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">পেমেন্টের পরিমাণ:</span>
                <span className="text-2xl font-bold text-pink-600">{toBengaliNumber(PAID_SERIAL_FEE)} টাকা</span>
              </div>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-pink-800 mb-2">অর্ডার সামারি:</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">রোগীর নাম:</span> {formData.patient_name}</p>
                <p><span className="font-medium">মোবাইল:</span> {formData.patient_phone}</p>
                <p><span className="font-medium">তারিখ:</span> {formData.appointment_date}</p>
                <p><span className="font-medium">ডাক্তার:</span> {doctor.name}</p>
              </div>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">{paymentError}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setPaymentStep('form')}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ফিরে যান
              </button>
              <button
                onClick={initiatePayment}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    প্রক্রিয়াকরণ...
                  </>
                ) : (
                  'বিকাশে পে করুন'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaidBookAppointment
