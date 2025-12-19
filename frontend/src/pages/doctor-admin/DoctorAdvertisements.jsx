import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || '';

const defaultBannerPricing = [
  { days: 3, price: 500, label: '৩ দিন' },
  { days: 7, price: 1000, label: '৭ দিন' },
  { days: 15, price: 1500, label: '১৫ দিন' },
  { days: 30, price: 3000, label: '১ মাস' },
  { days: 365, price: 30000, label: '১ বছর' }
]

const defaultAdTypes = [
  {
    id: 'promotional_banner',
    name: 'প্রোমোশনাল ব্যানার',
    description: 'হোম স্ক্রীনে প্রোমোশনাল ব্যানারে বিজ্ঞাপন - আপনার আপডেট রোগীদের জানান সহজেই',
    icon: '🎉',
    categories: [
      { id: 'congratulations', name: 'অভিনন্দন', icon: '🎊' },
      { id: 'condolence', name: 'শোক সংবাদ', icon: '🕊️' },
      { id: 'new_chamber', name: 'নতুন চেম্বার', icon: '🏥' },
      { id: 'profile_promo', name: 'প্রোফাইল প্রমোশন', icon: '👨‍⚕️' },
      { id: 'custom', name: 'কাস্টম ব্যানার', icon: '🎨' }
    ],
    pricing: defaultBannerPricing,
    facilities: [
      'হোম পেজে ব্যানার প্রদর্শন',
      'কাস্টম ছবি ও টেক্সট',
      'সকল ভিজিটরের কাছে দৃশ্যমান',
      'মোবাইল ও ডেস্কটপে সমর্থিত',
      'তারিখ নির্ধারিত প্রচার'
    ]
  },
  {
    id: 'category_promotion',
    name: 'ক্যাটেগরি প্রমোশন',
    description: 'একই ক্যাটেগরির অন্য ডাক্তারদের প্রোফাইলে আপনার কার্ড প্রমোট করুন',
    icon: '👥',
    pricing: [{ days: 30, price: 500, label: 'মাসিক' }],
    facilities: [
      'একই বিশেষজ্ঞতার ডাক্তারদের পেজে প্রদর্শন',
      'রোগীদের কাছে সহজে পৌঁছান',
      'প্রতিযোগী ডাক্তারদের পেজে দৃশ্যমান',
      'আপনার প্রোফাইল কার্ড হাইলাইট',
      'বেশি রোগী পাওয়ার সুযোগ'
    ]
  },
  {
    id: 'top_featured',
    name: 'শীর্ষে প্রচার',
    description: "হোম স্ক্রীনে 'বর্তমানে শীর্ষে অবস্থানরত' সেকশনে প্রোফাইল প্রচার",
    icon: '⭐',
    pricing: [{ days: 30, price: 1000, label: 'মাসিক' }],
    facilities: [
      'হোম পেজে শীর্ষ সেকশনে প্রদর্শন',
      'প্রিমিয়াম ব্যাজ সহ প্রোফাইল',
      'সর্বাধিক দৃশ্যমানতা',
      'অগ্রাধিকার ভিত্তিক র‍্যাংকিং',
      'সার্চ রেজাল্টে শীর্ষে থাকুন'
    ]
  }
]

function DoctorAdvertisements() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [adTypes, setAdTypes] = useState(defaultAdTypes)
  const [requests, setRequests] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedAdType, setSelectedAdType] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(null)
  const [bannerText, setBannerText] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const doctorId = localStorage.getItem('doctorId')
  const doctorName = localStorage.getItem('doctorName')

  useEffect(() => {
    if (!localStorage.getItem('doctorLoggedIn')) {
      navigate('/doctor.admin/login')
      return
    }
    fetchAdTypesFromAPI()
    fetchRequests()
  }, [])

  async function fetchAdTypesFromAPI() {
    try {
      const response = await fetch(`${API_URL}/api/advertisement-settings`)
      const result = await response.json()
      if (result.success && result.data && result.data.length > 0) {
        const transformedAdTypes = result.data.map(adType => ({
          id: adType.type_id,
          name: adType.name,
          description: adType.description,
          icon: adType.icon,
          categories: adType.has_categories && adType.categories
            ? adType.categories.map(cat => ({
                id: cat.category_id,
                name: cat.name,
                icon: cat.icon
              }))
            : undefined,
          pricing: (adType.pricing || []).map(p => ({
            days: p.days,
            price: p.price,
            label: p.label
          })),
          facilities: (adType.facilities || []).map(f => f.facility_text)
        }))
        setAdTypes(transformedAdTypes)
      }
    } catch (error) {
      console.error('Error fetching ad types from API:', error)
    }
  }

  async function fetchRequests() {
    try {
      if (!supabase || !isConfigured || !doctorId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('advertisement_requests')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function openRequestModal(adType) {
    setSelectedAdType(adType)
    setSelectedCategory('')
    setSelectedDuration(adType.pricing[0])
    setBannerText('')
    setBannerImageUrl('')
    setShowRequestModal(true)
  }

  async function handleSubmitRequest() {
    if (selectedAdType.id === 'promotional_banner' && !selectedCategory) {
      alert('অনুগ্রহ করে বিজ্ঞাপনের ধরন নির্বাচন করুন')
      return
    }

    setSubmitting(true)
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + selectedDuration.days)

      const { error } = await supabase
        .from('advertisement_requests')
        .insert([{
          doctor_id: doctorId,
          doctor_name: doctorName,
          ad_type: selectedAdType.id,
          ad_category: selectedCategory || null,
          duration_days: selectedDuration.days,
          price: selectedDuration.price,
          banner_image_url: bannerImageUrl || null,
          banner_text: bannerText || null,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'pending'
        }])

      if (error) throw error

      alert('বিজ্ঞাপনের আবেদন সফলভাবে পাঠানো হয়েছে!')
      setShowRequestModal(false)
      fetchRequests()
    } catch (error) {
      console.error('Advertisement Request Error:', error)
      alert('আবেদন করতে সমস্যা হয়েছে: ' + (error.message || JSON.stringify(error)))
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function getStatusBadge(status) {
    const badges = {
      pending: { text: 'অপেক্ষমান', class: 'bg-yellow-100 text-yellow-700' },
      approved: { text: 'অনুমোদিত', class: 'bg-blue-100 text-blue-700' },
      active: { text: 'সক্রিয়', class: 'bg-green-100 text-green-700' },
      expired: { text: 'মেয়াদ শেষ', class: 'bg-gray-100 text-gray-700' },
      rejected: { text: 'প্রত্যাখ্যাত', class: 'bg-red-100 text-red-700' }
    }
    return badges[status] || badges.pending
  }

  function getAdTypeName(typeId) {
    return adTypes.find(t => t.id === typeId)?.name || typeId
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 pt-16 lg:pt-6 lg:p-8 bg-gray-50">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">বিজ্ঞাপন</h1>
          <p className="text-gray-500 mt-1">আপনার প্রোফাইল ও সেবা প্রচার করুন</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {adTypes.map(adType => (
            <div key={adType.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{adType.icon}</span>
                  <h3 className="text-xl font-bold text-gray-800">{adType.name}</h3>
                </div>
                <p className="text-gray-500 text-sm">{adType.description}</p>
              </div>

              <div className="p-6 flex flex-col flex-1">
                {adType.categories && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">বিজ্ঞাপনের ধরন:</p>
                    <div className="flex flex-wrap gap-2">
                      {adType.categories.map(cat => (
                        <span key={cat.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">মূল্য তালিকা:</p>
                  <div className="space-y-2">
                    {adType.pricing.map((price, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{price.label}</span>
                        <span className="font-semibold text-teal-600">৳{price.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {adType.facilities && (
                  <div className="mb-4 flex-1">
                    <p className="text-sm font-semibold text-gray-700 mb-2">সুবিধাসমূহ:</p>
                    <ul className="space-y-1.5">
                      {adType.facilities.map((facility, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-teal-500 mt-0.5">✓</span>
                          <span>{facility}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-auto pt-4">
                  <button
                    onClick={() => openRequestModal(adType)}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold hover:opacity-90"
                  >
                    আবেদন করুন
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-amber-800 font-medium">বিজ্ঞাপন সম্পর্কে</p>
              <p className="text-amber-700 text-sm mt-1">
                বিজ্ঞাপনের আবেদন করার পর এডমিন অনুমোদন করলে পেমেন্টের জন্য যোগাযোগ করা হবে।
                পেমেন্ট সম্পন্ন হলে বিজ্ঞাপন সক্রিয় হবে।
              </p>
            </div>
          </div>
        </div>

        {requests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">আপনার বিজ্ঞাপন আবেদন সমূহ</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-6 py-4 text-sm font-semibold">তারিখ</th>
                    <th className="px-6 py-4 text-sm font-semibold">বিজ্ঞাপনের ধরন</th>
                    <th className="px-6 py-4 text-sm font-semibold">সময়কাল</th>
                    <th className="px-6 py-4 text-sm font-semibold">মূল্য</th>
                    <th className="px-6 py-4 text-sm font-semibold">স্ট্যাটাস</th>
                    <th className="px-6 py-4 text-sm font-semibold">পেমেন্ট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((req) => {
                    const badge = getStatusBadge(req.status)
                    return (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600">{formatDate(req.created_at)}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{getAdTypeName(req.ad_type)}</p>
                          {req.ad_category && (
                            <p className="text-xs text-gray-500">{req.ad_category}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{req.duration_days} দিন</td>
                        <td className="px-6 py-4 font-medium text-teal-600">৳{req.price}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            req.payment_status === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {req.payment_status === 'paid' ? 'পেইড' : 'বাকি'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showRequestModal && selectedAdType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{selectedAdType.name}</h2>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedAdType.categories && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">বিজ্ঞাপনের ধরন নির্বাচন করুন</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedAdType.categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-colors ${
                          selectedCategory === cat.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{cat.icon}</span>
                        <span className="font-medium text-gray-800">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">সময়কাল নির্বাচন করুন</label>
                <div className="space-y-2">
                  {selectedAdType.pricing.map((price, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDuration(price)}
                      className={`w-full p-4 rounded-xl border-2 flex justify-between items-center transition-colors ${
                        selectedDuration?.days === price.days
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-800">{price.label}</span>
                      <span className="font-bold text-teal-600">৳{price.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedAdType.id === 'promotional_banner' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ব্যানার টেক্সট (ঐচ্ছিক)</label>
                    <textarea
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                      placeholder="ব্যানারে যা লিখতে চান..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ব্যানার ছবি URL (ঐচ্ছিক)</label>
                    <input
                      type="url"
                      value={bannerImageUrl}
                      onChange={(e) => setBannerImageUrl(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>
                </>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">মোট মূল্য</span>
                  <span className="text-2xl font-bold text-teal-600">৳{selectedDuration?.price || 0}</span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'পাঠানো হচ্ছে...' : 'আবেদন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorAdvertisements
