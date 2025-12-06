import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { supabase, isConfigured } from '../lib/supabase'

function JoinAsDoctor() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    qualifications: '',
    specialty: '',
    designation: '',
    workplace: '',
    experience: '',
    bmdcNumber: '',
    gender: '',
    chamberName: '',
    visitingHour: '',
    appointmentNumber: '',
    chamberLocation: '',
    consultationFee: '',
    additionalInfo: '',
    photo: null,
    visitingCard: null,
    termsAccepted: false
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [visitingCardPreview, setVisitingCardPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const specialties = [
    'মেডিসিন বিশেষজ্ঞ',
    'হৃদরোগ বিশেষজ্ঞ',
    'নিউরোলজি বিশেষজ্ঞ',
    'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ',
    'শিশু রোগ বিশেষজ্ঞ',
    'অর্থোপেডিক্স বিশেষজ্ঞ',
    'নাক-কান-গলা বিশেষজ্ঞ',
    'চর্মরোগ বিশেষজ্ঞ',
    'মানসিক রোগ বিশেষজ্ঞ',
    'চক্ষু রোগ বিশেষজ্ঞ',
    'দন্ত বিশেষজ্ঞ',
    'সার্জারি বিশেষজ্ঞ',
    'ক্যান্সার বিশেষজ্ঞ',
    'কিডনি রোগ বিশেষজ্ঞ',
    'গ্যাস্ট্রোএন্টারোলজি বিশেষজ্ঞ',
    'ডায়াবেটিস বিশেষজ্ঞ',
    'ফিজিওথেরাপি বিশেষজ্ঞ',
    'অন্যান্য'
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVisitingCardChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, visitingCard: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setVisitingCardPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.termsAccepted) {
      alert('অনুগ্রহ করে শর্তাবলী মেনে নিন')
      return
    }
    
    if (!supabase || !isConfigured) {
      alert('ডাটাবেস কনফিগার করা হয়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।')
      return
    }

    setIsSubmitting(true)
    
    try {
      const applicationData = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        gender: formData.gender,
        qualifications: formData.qualifications,
        specialty: formData.specialty,
        designation: formData.designation,
        workplace: formData.workplace,
        experience: formData.experience,
        bmdc_number: formData.bmdcNumber,
        chamber_name: formData.chamberName,
        visiting_hour: formData.visitingHour,
        appointment_number: formData.appointmentNumber,
        consultation_fee: formData.consultationFee,
        chamber_location: formData.chamberLocation,
        additional_info: formData.additionalInfo,
        photo_url: photoPreview,
        visiting_card_url: visitingCardPreview,
        terms_accepted: formData.termsAccepted,
        status: 'pending'
      }

      const { error } = await supabase
        .from('doctor_applications')
        .insert([applicationData])

      if (error) throw error

      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              আবেদন সফলভাবে জমা হয়েছে!
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              আপনার আবেদন সফলভাবে জমা হয়েছে। রেজিস্ট্রেশন সম্পন্ন করার বিস্তারিত তথ্যের জন্য অনুগ্রহ করে আপনার ইমেইল চেক করুন।
            </p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-medium hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              হোম পেজে ফিরে যান
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            ডাক্তার রেজিস্ট্রেশন
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">ডাক্তার হিসেবে যোগ দিন</h1>
          <p className="text-teal-100 max-w-2xl mx-auto">
            ইজি ডক্টর রংপুর প্ল্যাটফর্মে যোগ দিন এবং আরও বেশি রোগীদের কাছে পৌঁছান। নিচের ফর্মটি পূরণ করুন।
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              ব্যক্তিগত তথ্য
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ডাক্তারের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="সম্পূর্ণ নাম লিখুন"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ইমেইল <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  লিঙ্গ <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="male">পুরুষ</option>
                  <option value="female">মহিলা</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </span>
              পেশাগত তথ্য
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  শিক্ষাগত যোগ্যতা ও সনদপত্র <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="যেমন: MBBS, FCPS, MD, MS ইত্যাদি"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  বিশেষত্ব <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="">নির্বাচন করুন</option>
                  {specialties.map((specialty, index) => (
                    <option key={index} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  পদবী ও বিভাগ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  placeholder="যেমন: সহকারী অধ্যাপক, মেডিসিন বিভাগ"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  কর্মস্থল <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="workplace"
                  value={formData.workplace}
                  onChange={handleChange}
                  required
                  placeholder="হাসপাতাল/ক্লিনিকের নাম"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  অভিজ্ঞতা <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  placeholder="যেমন: ১০+ বছর"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BM&DC নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bmdcNumber"
                  value={formData.bmdcNumber}
                  onChange={handleChange}
                  required
                  placeholder="আপনার BM&DC রেজিস্ট্রেশন নম্বর"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              চেম্বার তথ্য
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  প্রাইভেট চেম্বার/ক্লিনিকের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="chamberName"
                  value={formData.chamberName}
                  onChange={handleChange}
                  required
                  placeholder="চেম্বার/ক্লিনিকের নাম"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ভিজিটিং সময় <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="visitingHour"
                  value={formData.visitingHour}
                  onChange={handleChange}
                  required
                  placeholder="যেমন: সন্ধ্যা ৬টা - রাত ৯টা"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  অ্যাপয়েন্টমেন্ট নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="appointmentNumber"
                  value={formData.appointmentNumber}
                  onChange={handleChange}
                  required
                  placeholder="অ্যাপয়েন্টমেন্টের জন্য ফোন নম্বর"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  পরামর্শ ফি <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  required
                  placeholder="যেমন: ৫০০ টাকা"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  চেম্বারের ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="chamberLocation"
                  value={formData.chamberLocation}
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="সম্পূর্ণ ঠিকানা লিখুন"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  অতিরিক্ত চেম্বার তথ্য ও অন্যান্য তথ্য (ঐচ্ছিক)
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={3}
                  placeholder="অন্য কোনো চেম্বার থাকলে বা অতিরিক্ত তথ্য থাকলে লিখুন..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              ছবি আপলোড
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  আপনার ছবি <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    required
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-sm text-gray-500">ছবি আপলোড করতে ক্লিক করুন</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (সর্বোচ্চ 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ভিজিটিং কার্ডের ছবি <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVisitingCardChange}
                    required
                    className="hidden"
                    id="card-upload"
                  />
                  <label
                    htmlFor="card-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all"
                  >
                    {visitingCardPreview ? (
                      <img src={visitingCardPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500">ভিজিটিং কার্ড আপলোড করুন</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (সর্বোচ্চ 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                required
                className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 mt-0.5"
              />
              <label className="text-sm text-gray-700">
                আমি ইজি ডক্টর রংপুর এর{' '}
                <Link to="/doctors-terms" className="text-teal-600 hover:text-teal-700 font-medium underline">
                  শর্তাবলী
                </Link>{' '}
                এবং{' '}
                <Link to="/privacy-policy" className="text-teal-600 hover:text-teal-700 font-medium underline">
                  গোপনীয়তা নীতি
                </Link>{' '}
                পড়েছি এবং সম্মত আছি। <span className="text-red-500">*</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  প্রেরণ করা হচ্ছে...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  প্রেরণ করুন
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-6 bg-teal-50 p-4 rounded-xl">
              <svg className="w-5 h-5 inline-block mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ফর্ম জমা দেওয়ার পর, আপনার রেজিস্ট্রেশন সম্পন্ন করার বিস্তারিত তথ্যের জন্য অনুগ্রহ করে আপনার ইমেইল চেক করুন।
            </p>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}

export default JoinAsDoctor
