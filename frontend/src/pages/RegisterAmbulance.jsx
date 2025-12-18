import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { supabase, isConfigured } from '../lib/supabase'

function RegisterAmbulance() {
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    altPhone: '',
    nidNumber: '',
    drivingLicenseNumber: '',
    serviceName: '',
    district: '',
    address: '',
    serviceAreas: '',
    ambulanceType: '',
    vehicleNumber: '',
    vehicleModel: '',
    vehicleYear: '',
    hasOxygen: false,
    hasStretcher: true,
    hasAc: false,
    hasIcuEquipment: false,
    hasFreezing: false,
    experienceYears: '',
    farePerKm: '',
    baseFare: '',
    available24Hours: true,
    availableDays: '',
    additionalInfo: '',
    ownerPhoto: null,
    ambulancePhoto: null,
    drivingLicense: null,
    vehicleRegistration: null,
    termsAccepted: false
  })
  
  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState(null)
  const [ambulancePhotoPreview, setAmbulancePhotoPreview] = useState(null)
  const [drivingLicensePreview, setDrivingLicensePreview] = useState(null)
  const [vehicleRegistrationPreview, setVehicleRegistrationPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const districts = [
    'রংপুর',
    'দিনাজপুর',
    'গাইবান্ধা',
    'কুড়িগ্রাম',
    'লালমনিরহাট',
    'নীলফামারী',
    'পঞ্চগড়',
    'ঠাকুরগাঁও'
  ]

  const ambulanceTypes = [
    'এসি অ্যাম্বুলেন্স',
    'নন-এসি অ্যাম্বুলেন্স',
    'আইসিইউ অ্যাম্বুলেন্স',
    'ফ্রিজিং অ্যাম্বুলেন্স'
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileChange = (e, field, setPreview) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
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
        owner_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        alt_phone: formData.altPhone,
        nid_number: formData.nidNumber,
        driving_license_number: formData.drivingLicenseNumber,
        service_name: formData.serviceName,
        district: formData.district,
        address: formData.address,
        service_areas: formData.serviceAreas,
        ambulance_type: formData.ambulanceType,
        vehicle_number: formData.vehicleNumber,
        vehicle_model: formData.vehicleModel,
        vehicle_year: formData.vehicleYear,
        has_oxygen: formData.hasOxygen,
        has_stretcher: formData.hasStretcher,
        has_ac: formData.hasAc,
        has_icu_equipment: formData.hasIcuEquipment,
        has_freezing: formData.hasFreezing,
        experience_years: formData.experienceYears ? parseInt(formData.experienceYears) : 0,
        fare_per_km: formData.farePerKm ? parseFloat(formData.farePerKm) : null,
        base_fare: formData.baseFare,
        available_24_hours: formData.available24Hours,
        available_days: formData.availableDays,
        additional_info: formData.additionalInfo,
        terms_accepted: formData.termsAccepted,
        status: 'pending'
      }

      const { error } = await supabase
        .from('ambulance_applications')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              আবেদন সফলভাবে জমা হয়েছে!
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              আপনার অ্যাম্বুলেন্স সেবা নিবন্ধন আবেদন সফলভাবে জমা হয়েছে। আমাদের টিম আপনার আবেদন পর্যালোচনা করবে এবং শীঘ্রই আপনার সাথে যোগাযোগ করবে।
            </p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-8 py-3 rounded-xl font-medium hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-500/30"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            অ্যাম্বুলেন্স নিবন্ধন
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">অ্যাম্বুলেন্স তালিকাভুক্ত করুন</h1>
          <p className="text-red-100 max-w-2xl mx-auto">
            ইজি ডক্টর রংপুর প্ল্যাটফর্মে আপনার অ্যাম্বুলেন্স সেবা যুক্ত করুন এবং আরও বেশি রোগীদের সেবা দিন। নিচের ফর্মটি পূরণ করুন।
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              মালিক/ড্রাইভারের তথ্য
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  মালিক/ড্রাইভারের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  placeholder="সম্পূর্ণ নাম লিখুন"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ইমেইল
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  বিকল্প মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  name="altPhone"
                  value={formData.altPhone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  জাতীয় পরিচয়পত্র (NID) নম্বর
                </label>
                <input
                  type="text"
                  name="nidNumber"
                  value={formData.nidNumber}
                  onChange={handleChange}
                  placeholder="NID নম্বর"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ড্রাইভিং লাইসেন্স নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="drivingLicenseNumber"
                  value={formData.drivingLicenseNumber}
                  onChange={handleChange}
                  required
                  placeholder="ড্রাইভিং লাইসেন্স নম্বর"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              সেবা তথ্য
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  সার্ভিসের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleChange}
                  required
                  placeholder="যেমন: রংপুর অ্যাম্বুলেন্স সার্ভিস"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  জেলা <span className="text-red-500">*</span>
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                >
                  <option value="">নির্বাচন করুন</option>
                  {districts.map((district, index) => (
                    <option key={index} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="বাড়ি নং, রোড, এলাকা, থানা"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  সেবা এলাকাসমূহ
                </label>
                <textarea
                  name="serviceAreas"
                  value={formData.serviceAreas}
                  onChange={handleChange}
                  rows={2}
                  placeholder="কোন কোন এলাকায় সেবা দিতে পারবেন লিখুন"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
              গাড়ির তথ্য
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  অ্যাম্বুলেন্সের ধরণ <span className="text-red-500">*</span>
                </label>
                <select
                  name="ambulanceType"
                  value={formData.ambulanceType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                >
                  <option value="">নির্বাচন করুন</option>
                  {ambulanceTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  গাড়ির নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                  placeholder="যেমন: রংপুর মেট্রো-১২৩৪"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  গাড়ির মডেল
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  placeholder="যেমন: Toyota Hiace"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  গাড়ির বছর
                </label>
                <input
                  type="text"
                  name="vehicleYear"
                  value={formData.vehicleYear}
                  onChange={handleChange}
                  placeholder="যেমন: 2020"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                গাড়িতে উপলব্ধ সুবিধাসমূহ
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    name="hasOxygen"
                    checked={formData.hasOxygen}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">অক্সিজেন সিলিন্ডার</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    name="hasStretcher"
                    checked={formData.hasStretcher}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">স্ট্রেচার</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    name="hasAc"
                    checked={formData.hasAc}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">এয়ার কন্ডিশন (AC)</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    name="hasIcuEquipment"
                    checked={formData.hasIcuEquipment}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">ICU সরঞ্জাম</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    name="hasFreezing"
                    checked={formData.hasFreezing}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">ফ্রিজিং সুবিধা</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              অভিজ্ঞতা ও ভাড়া তথ্য
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  অভিজ্ঞতা (বছর)
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  min="0"
                  placeholder="যেমন: 5"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  প্রতি কিলোমিটার ভাড়া (টাকা)
                </label>
                <input
                  type="number"
                  name="farePerKm"
                  value={formData.farePerKm}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="যেমন: 25"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  বেস ভাড়া/প্রাথমিক খরচ
                </label>
                <input
                  type="text"
                  name="baseFare"
                  value={formData.baseFare}
                  onChange={handleChange}
                  placeholder="যেমন: ৫০০ টাকা"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    name="available24Hours"
                    checked={formData.available24Hours}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">২৪ ঘণ্টা সেবা উপলব্ধ</span>
                </label>
              </div>

              {!formData.available24Hours && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    উপলব্ধ সময়
                  </label>
                  <input
                    type="text"
                    name="availableDays"
                    value={formData.availableDays}
                    onChange={handleChange}
                    placeholder="যেমন: সকাল ৮টা - রাত ১০টা"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              ছবি ও ডকুমেন্ট আপলোড
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  মালিক/ড্রাইভারের ছবি <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'ownerPhoto', setOwnerPhotoPreview)}
                    required
                    className="hidden"
                    id="owner-photo-upload"
                  />
                  <label
                    htmlFor="owner-photo-upload"
                    className="block cursor-pointer"
                  >
                    {ownerPhotoPreview ? (
                      <div className="relative">
                        <img src={ownerPhotoPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border-2 border-red-200" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm">পরিবর্তন করুন</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-gray-500 text-sm">ছবি আপলোড করুন</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  অ্যাম্বুলেন্সের ছবি <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'ambulancePhoto', setAmbulancePhotoPreview)}
                    required
                    className="hidden"
                    id="ambulance-photo-upload"
                  />
                  <label
                    htmlFor="ambulance-photo-upload"
                    className="block cursor-pointer"
                  >
                    {ambulancePhotoPreview ? (
                      <div className="relative">
                        <img src={ambulancePhotoPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border-2 border-red-200" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm">পরিবর্তন করুন</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-gray-500 text-sm">ছবি আপলোড করুন</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ড্রাইভিং লাইসেন্সের ছবি
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'drivingLicense', setDrivingLicensePreview)}
                    className="hidden"
                    id="license-upload"
                  />
                  <label
                    htmlFor="license-upload"
                    className="block cursor-pointer"
                  >
                    {drivingLicensePreview ? (
                      <div className="relative">
                        <img src={drivingLicensePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border-2 border-red-200" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm">পরিবর্তন করুন</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-gray-500 text-sm">ছবি আপলোড করুন</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  গাড়ির রেজিস্ট্রেশন পেপারের ছবি
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'vehicleRegistration', setVehicleRegistrationPreview)}
                    className="hidden"
                    id="registration-upload"
                  />
                  <label
                    htmlFor="registration-upload"
                    className="block cursor-pointer"
                  >
                    {vehicleRegistrationPreview ? (
                      <div className="relative">
                        <img src={vehicleRegistrationPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border-2 border-red-200" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm">পরিবর্তন করুন</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-gray-500 text-sm">ছবি আপলোড করুন</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              অতিরিক্ত তথ্য
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                অতিরিক্ত তথ্য বা মন্তব্য
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={4}
                placeholder="আপনার সেবা সম্পর্কে আরও কিছু জানাতে চাইলে এখানে লিখুন..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                required
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500 mt-1"
              />
              <div>
                <label className="text-sm text-gray-700">
                  আমি নিশ্চিত করছি যে উপরে প্রদত্ত সকল তথ্য সঠিক এবং আমি ইজি ডক্টর রংপুর প্ল্যাটফর্মের{' '}
                  <Link to="/terms" className="text-red-600 hover:underline">শর্তাবলী</Link> ও{' '}
                  <Link to="/privacy" className="text-red-600 hover:underline">গোপনীয়তা নীতি</Link>{' '}
                  মেনে চলতে সম্মত। <span className="text-red-500">*</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  জমা দেওয়া হচ্ছে...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  আবেদন জমা দিন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  )
}

export default RegisterAmbulance
