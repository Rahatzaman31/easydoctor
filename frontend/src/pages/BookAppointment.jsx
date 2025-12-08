import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

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

function BookAppointment() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
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
      
      const { data: regularAppointments, error: err1 } = await supabase
        .from('appointments')
        .select('appointment_date')
        .eq('doctor_id', doctor.id)
        .in('appointment_date', dateStrings)
      
      const { data: paidAppointments, error: err2 } = await supabase
        .from('paid_appointments')
        .select('appointment_date')
        .eq('doctor_id', doctor.id)
        .in('appointment_date', dateStrings)
      
      if (err1 || err2) {
        console.error('Error fetching appointments:', err1 || err2)
        return
      }
      
      const counts = {}
      dateStrings.forEach(date => {
        const regularCount = regularAppointments?.filter(a => a.appointment_date === date).length || 0
        const paidCount = paidAppointments?.filter(a => a.appointment_date === date).length || 0
        counts[date] = regularCount + paidCount
      })
      
      setAppointmentCounts(counts)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function handleDateSelect(day, isLimitFull, event) {
    if (isLimitFull) return
    
    const limit = doctor?.daily_appointment_limit
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

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.appointment_date) {
      alert('অনুগ্রহ করে অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন।')
      return
    }
    
    setSubmitting(true)

    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই। অনুগ্রহ করে পরে চেষ্টা করুন।')
        setSubmitting(false)
        return
      }
      const ref = 'RD' + Date.now().toString().slice(-8)
      
      const { error } = await supabase.from('appointments').insert([{
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        ...formData,
        booking_ref: ref,
        status: 'pending'
      }])

      if (error) throw error
      
      setBookingRef(ref)
      setSuccess(true)
    } catch (error) {
      console.error('Error:', error)
      alert('বুকিং করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setSubmitting(false)
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">সিরিয়াল সফল হয়েছে!</h1>
          <p className="text-gray-600 mb-2">আপনার বুকিং রেফারেন্স নম্বর:</p>
          <p className="text-3xl font-bold text-primary-600 mb-6">{bookingRef}</p>
          <p className="text-gray-500 text-sm mb-6">এই নম্বরটি সংরক্ষণ করুন। চেম্বারে এটি দেখাতে হবে।</p>
          <div className="flex gap-4 justify-center">
            <Link to="/" className="btn-secondary">হোমে যান</Link>
            <Link to="/rangpur-specialist-doctors-list-online-serial" className="btn-primary">আরো ডাক্তার দেখুন</Link>
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
      <Link to={`/doctor/${doctor?.slug || doctorId}`} className="text-primary-600 hover:underline mb-6 inline-flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        ফিরে যান
      </Link>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary-600 p-6 text-white">
          <h1 className="text-2xl font-bold">সিরিয়াল নিন</h1>
          <p className="text-primary-200 mt-1">{doctor.name} - {doctor.category_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">মোবাইল নম্বর *</label>
            <input
              type="tel"
              name="patient_phone"
              required
              className="input-field"
              placeholder="01XXXXXXXXX"
              value={formData.patient_phone}
              onChange={handleChange}
            />
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
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formData.appointment_date && selectedDateInfo ? (
                  <span className="text-sm font-medium text-primary-700">
                    অবশিষ্ট সিরিয়াল: {selectedDateInfo.limit ? <span className="font-bold">{toBengaliNumber(selectedDateInfo.remaining)} টি</span> : <span>সীমাহীন</span>}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-primary-600">
                    দৈনিক লিমিট: {doctor?.daily_appointment_limit ? <span className="font-bold">{toBengaliNumber(doctor.daily_appointment_limit)} টি</span> : <span>সীমাহীন</span>}
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
                
                const limit = doctor?.daily_appointment_limit
                
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
                              ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500 text-white shadow-xl shadow-primary-200 scale-[1.03] ring-2 ring-primary-300 ring-offset-1'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:bg-gradient-to-br hover:from-primary-50 hover:to-white hover:shadow-md'
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
                          <div className={`text-[10px] sm:text-xs font-semibold mb-0.5 ${isSelected ? 'text-primary-100' : 'text-primary-500'}`}>
                            {day.dayName}
                          </div>
                          <div className={`text-xl sm:text-2xl font-bold leading-none ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                            {toBengaliNumber(day.dayNum)}
                          </div>
                          <div className={`text-[10px] sm:text-xs ${isSelected ? 'text-primary-100' : 'text-gray-500'}`}>
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
            <input
              type="hidden"
              name="appointment_date"
              required
              value={formData.appointment_date}
            />
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
            disabled={submitting}
            className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                প্রক্রিয়াকরণ হচ্ছে...
              </span>
            ) : 'সিরিয়াল নিশ্চিত করুন'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default BookAppointment
