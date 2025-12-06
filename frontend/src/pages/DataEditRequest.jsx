import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { supabase, isConfigured } from '../lib/supabase'

function DataEditRequest() {
  const [formData, setFormData] = useState({
    providerType: '',
    requestType: '',
    name: '',
    email: '',
    mobile: '',
    registrationNumber: '',
    currentInfo: '',
    updatedInfo: '',
    reason: '',
    document: null,
    termsAccepted: false
  })
  const [documentPreview, setDocumentPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const providerTypes = [
    { value: 'doctor', label: 'ডাক্তার' },
    { value: 'hospital', label: 'হাসপাতাল' },
    { value: 'diagnostic_center', label: 'ডায়াগনস্টিক সেন্টার' },
    { value: 'ambulance', label: 'অ্যাম্বুলেন্স সার্ভিস' }
  ]

  const requestTypes = [
    { value: 'edit', label: 'তথ্য সংশোধন করতে চাই' },
    { value: 'delete', label: 'তথ্য মুছে ফেলতে চাই' }
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleDocumentChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, document: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocumentPreview(reader.result)
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
      const requestData = {
        provider_type: formData.providerType,
        request_type: formData.requestType,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        registration_number: formData.registrationNumber,
        current_info: formData.currentInfo,
        updated_info: formData.updatedInfo,
        reason: formData.reason,
        document_url: documentPreview,
        terms_accepted: formData.termsAccepted,
        status: 'pending'
      }

      const { error } = await supabase
        .from('data_edit_requests')
        .insert([requestData])

      if (error) throw error

      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('অনুরোধ জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
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
              অনুরোধ সফলভাবে জমা হয়েছে!
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              আপনার তথ্য সংশোধন/মুছে ফেলার অনুরোধ সফলভাবে জমা হয়েছে। আমাদের টিম শীঘ্রই আপনার অনুরোধ পর্যালোচনা করবে এবং প্রয়োজনে আপনার সাথে যোগাযোগ করবে।
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            তথ্য সম্পাদনা
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">তথ্য সংশোধন বা মুছে ফেলুন</h1>
          <p className="text-teal-100 max-w-2xl mx-auto">
            আপনি যদি ডাক্তার, হাসপাতাল, ডায়াগনস্টিক সেন্টার বা অ্যাম্বুলেন্স সার্ভিস হিসেবে নিবন্ধিত থাকেন এবং আপনার তথ্য সংশোধন বা মুছে ফেলতে চান, তাহলে নিচের ফর্মটি পূরণ করুন।
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              অনুরোধের ধরন
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  আপনি কোন ধরনের সেবাদাতা? <span className="text-red-500">*</span>
                </label>
                <select
                  name="providerType"
                  value={formData.providerType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="">নির্বাচন করুন</option>
                  {providerTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  আপনি কী করতে চান? <span className="text-red-500">*</span>
                </label>
                <select
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="">নির্বাচন করুন</option>
                  {requestTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              আপনার তথ্য
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  আপনার নাম <span className="text-red-500">*</span>
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
                  রেজিস্ট্রেশন/রেফারেন্স নম্বর
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="যদি থাকে (যেমন: BM&DC নম্বর)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              সংশোধন/মুছে ফেলার বিবরণ
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  বর্তমান তথ্য (যা সংশোধন/মুছতে চান) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="currentInfo"
                  value={formData.currentInfo}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="আমাদের ওয়েবসাইটে বর্তমানে যে তথ্য প্রদর্শিত হচ্ছে তা লিখুন..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {formData.requestType === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    সংশোধিত/নতুন তথ্য <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="updatedInfo"
                    value={formData.updatedInfo}
                    onChange={handleChange}
                    required={formData.requestType === 'edit'}
                    rows={4}
                    placeholder="আপনি যে তথ্য দেখাতে চান তা লিখুন..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  কারণ <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="কেন এই সংশোধন/মুছে ফেলার প্রয়োজন তা সংক্ষেপে লিখুন..."
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
              সহায়ক ডকুমেন্ট (ঐচ্ছিক)
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                পরিচয় প্রমাণ বা সহায়ক ডকুমেন্ট
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleDocumentChange}
                  className="hidden"
                  id="document-upload"
                />
                <label
                  htmlFor="document-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 transition-colors"
                >
                  {documentPreview ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={documentPreview} 
                        alt="Document preview" 
                        className="w-full h-full object-contain rounded-xl p-2"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm">পরিবর্তন করুন</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500">ক্লিক করে আপলোড করুন</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (সর্বোচ্চ 10MB)</p>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                যাচাইকরণের জন্য আপনার পরিচয় প্রমাণ বা সংশ্লিষ্ট ডকুমেন্ট আপলোড করতে পারেন।
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                required
                className="w-5 h-5 mt-0.5 text-teal-600 rounded focus:ring-teal-500"
              />
              <label className="text-sm text-gray-600 leading-relaxed">
                আমি নিশ্চিত করছি যে উপরে প্রদত্ত সমস্ত তথ্য সঠিক এবং আমি এই প্রতিষ্ঠান/সেবার সাথে সম্পর্কিত ব্যক্তি। আমি <Link to="/terms-of-use" className="text-teal-600 hover:underline">ব্যবহারের শর্তাবলী</Link> এবং <Link to="/privacy-policy" className="text-teal-600 hover:underline">গোপনীয়তা নীতি</Link> মেনে নিচ্ছি।
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-medium text-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                জমা হচ্ছে...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                অনুরোধ জমা দিন
              </>
            )}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  )
}

export default DataEditRequest
