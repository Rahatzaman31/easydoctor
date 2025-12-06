import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import DoctorAdminSidebar from '../../components/DoctorAdminSidebar'

const API_URL = import.meta.env.VITE_API_URL || '';

const defaultPackages = [
  {
    id: 'standard',
    name: 'স্ট্যান্ডার্ড প্যাকেজ',
    price: 'ফ্রী',
    priceValue: 0,
    isDefault: true,
    duration: 'আজীবন',
    features: [
      { label: 'রেটিং', value: '4.8' },
      { label: 'রিভিউ', value: '৫ থেকে ১০ টি' },
      { label: 'দৈনিক অ্যাপয়েন্টমেন্ট লিমিট', value: '২ টি' },
    ],
    color: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-300',
    badge: 'ডিফল্ট'
  },
  {
    id: 'professional',
    name: 'প্রোফেশনাল প্যাকেজ',
    price: '৫০০ টাকা',
    priceValue: 500,
    isDefault: false,
    features: [
      { label: 'রেটিং', value: '4.9' },
      { label: 'রিভিউ', value: '১০ থেকে ২০ টি' },
      { label: 'দৈনিক অ্যাপয়েন্টমেন্ট লিমিট', value: '৫ টি' },
    ],
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-300',
    badge: 'জনপ্রিয়'
  },
  {
    id: 'premium',
    name: 'প্রিমিয়াম প্যাকেজ',
    price: '১৫০০ টাকা',
    priceValue: 1500,
    isDefault: false,
    features: [
      { label: 'রেটিং', value: '5.0' },
      { label: 'রিভিউ', value: '২০ থেকে আনলিমিটেড' },
      { label: 'দৈনিক অ্যাপয়েন্টমেন্ট লিমিট', value: 'আনলিমিটেড' },
    ],
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-300',
    badge: 'সেরা'
  }
]

function DoctorPackages() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState(defaultPackages)
  const [currentPackage, setCurrentPackage] = useState('standard')
  const [requests, setRequests] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const doctorId = localStorage.getItem('doctorId')
  const doctorName = localStorage.getItem('doctorName')

  useEffect(() => {
    if (!localStorage.getItem('doctorLoggedIn')) {
      navigate('/doctor.admin/login')
      return
    }
    fetchPackagesFromAPI()
    fetchData()
  }, [])

  async function fetchPackagesFromAPI() {
    try {
      const response = await fetch(`${API_URL}/api/doctor-packages`)
      const result = await response.json()
      if (result.success && result.data && result.data.length > 0) {
        const transformedPackages = result.data.map(pkg => ({
          id: pkg.package_id,
          name: pkg.name,
          price: pkg.price_display,
          priceValue: pkg.price_value || 0,
          isDefault: pkg.is_default,
          duration: pkg.duration || (pkg.is_default ? 'আজীবন' : null),
          features: (pkg.features || []).map(f => ({
            label: f.label,
            value: f.value
          })),
          color: `from-${pkg.color_from || 'gray-500'} to-${pkg.color_to || 'gray-600'}`,
          borderColor: pkg.border_color || 'border-gray-300',
          badge: pkg.badge
        }))
        setPackages(transformedPackages)
      }
    } catch (error) {
      console.error('Error fetching packages from API:', error)
    }
  }

  async function fetchData() {
    try {
      if (!supabase || !isConfigured || !doctorId) {
        setLoading(false)
        return
      }

      const [doctorRes, requestsRes] = await Promise.all([
        supabase
          .from('doctors')
          .select('package_type')
          .eq('id', doctorId)
          .single(),
        supabase
          .from('package_requests')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('created_at', { ascending: false })
      ])

      if (doctorRes.data) {
        setCurrentPackage(doctorRes.data.package_type || 'standard')
      }

      setRequests(requestsRes.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function openRequestModal(pkg) {
    if (pkg.id === currentPackage) {
      alert('আপনি ইতিমধ্যে এই প্যাকেজে আছেন')
      return
    }
    setSelectedPackage(pkg)
    setShowRequestModal(true)
  }

  async function handleSubmitRequest() {
    setSubmitting(true)
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      const { error } = await supabase
        .from('package_requests')
        .insert([{
          doctor_id: parseInt(doctorId),
          doctor_name: doctorName,
          current_package: currentPackage,
          requested_package: selectedPackage.id,
          status: 'pending'
        }])

      if (error) throw error

      alert('প্যাকেজ পরিবর্তনের আবেদন সফলভাবে পাঠানো হয়েছে!')
      setShowRequestModal(false)
      fetchData()
    } catch (error) {
      console.error('Package Request Error:', error)
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
      approved: { text: 'অনুমোদিত', class: 'bg-green-100 text-green-700' },
      rejected: { text: 'প্রত্যাখ্যাত', class: 'bg-red-100 text-red-700' }
    }
    return badges[status] || badges.pending
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DoctorAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorAdminSidebar />

      <div className="flex-1 p-4 pt-16 lg:pt-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">প্যাকেজ</h1>
          <p className="text-gray-500 mt-1">আপনার প্যাকেজ পরিবর্তন করুন</p>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="text-teal-800 font-medium">বর্তমান প্যাকেজ: {packages.find(p => p.id === currentPackage)?.name}</p>
              <p className="text-teal-600 text-sm">প্যাকেজ পরিবর্তন করতে নিচের প্যাকেজ গুলো থেকে একটি নির্বাচন করুন</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${
                currentPackage === pkg.id ? 'border-teal-500' : pkg.borderColor
              }`}
            >
              <div className={`bg-gradient-to-r ${pkg.color} p-6 text-white relative`}>
                {pkg.badge && (
                  <span className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                    {pkg.badge}
                  </span>
                )}
                <h3 className="text-xl font-bold">{pkg.name}</h3>
                <p className="text-3xl font-bold mt-2">{pkg.price}</p>
                {pkg.duration ? (
                  <p className="text-white/80 text-sm">{pkg.duration}</p>
                ) : !pkg.isDefault && (
                  <p className="text-white/80 text-sm">মাসিক</p>
                )}
              </div>
              
              <div className="p-6">
                <ul className="space-y-4">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span className="text-gray-600">{feature.label}</span>
                      <span className="font-semibold text-gray-800">{feature.value}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => openRequestModal(pkg)}
                  disabled={currentPackage === pkg.id}
                  className={`w-full mt-6 py-3 rounded-xl font-semibold transition-colors ${
                    currentPackage === pkg.id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : `bg-gradient-to-r ${pkg.color} text-white hover:opacity-90`
                  }`}
                >
                  {currentPackage === pkg.id ? 'বর্তমান প্যাকেজ' : 'নির্বাচন করুন'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {requests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">আপনার আবেদন সমূহ</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-6 py-4 text-sm font-semibold">তারিখ</th>
                    <th className="px-6 py-4 text-sm font-semibold">বর্তমান প্যাকেজ</th>
                    <th className="px-6 py-4 text-sm font-semibold">আবেদিত প্যাকেজ</th>
                    <th className="px-6 py-4 text-sm font-semibold">স্ট্যাটাস</th>
                    <th className="px-6 py-4 text-sm font-semibold">এডমিন নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((req) => {
                    const badge = getStatusBadge(req.status)
                    return (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600">{formatDate(req.created_at)}</td>
                        <td className="px-6 py-4 text-gray-800">
                          {packages.find(p => p.id === req.current_package)?.name}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {packages.find(p => p.id === req.requested_package)?.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{req.admin_notes || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showRequestModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">প্যাকেজ পরিবর্তনের আবেদন</h2>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">বর্তমান প্যাকেজ</span>
                  <span className="font-semibold">{packages.find(p => p.id === currentPackage)?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">নতুন প্যাকেজ</span>
                  <span className="font-semibold text-teal-600">{selectedPackage.name}</span>
                </div>
              </div>

              <div className={`bg-gradient-to-r ${selectedPackage.color} rounded-xl p-4 text-white mb-4`}>
                <p className="font-semibold">প্যাকেজ মূল্য: {selectedPackage.price}</p>
                {selectedPackage.priceValue > 0 && (
                  <p className="text-white/80 text-sm mt-1">পেমেন্ট এডমিন অনুমোদনের পর করতে হবে</p>
                )}
              </div>

              <p className="text-gray-500 text-sm">
                আবেদন করার পর এডমিন আপনার আবেদন রিভিউ করবে এবং অনুমোদন করলে প্যাকেজ পরিবর্তন হবে।
              </p>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className={`flex-1 py-3 bg-gradient-to-r ${selectedPackage.color} text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50`}
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

export default DoctorPackages
