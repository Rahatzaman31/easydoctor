import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

function DoctorPaidAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 })
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [prescriptionUrl, setPrescriptionUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const doctorId = localStorage.getItem('doctorId')

  useEffect(() => {
    if (!localStorage.getItem('doctorLoggedIn')) {
      navigate('/doctor.admin/login')
      return
    }
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    try {
      if (!supabase || !isConfigured || !doctorId) {
        setLoading(false)
        return
      }

      // Fetch both confirmed and completed status appointments
      const { data, error } = await supabase
        .from('paid_appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .in('status', ['confirmed', 'completed'])
        .order('appointment_date', { ascending: false })

      if (error) throw error
      setAppointments(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(data) {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // আজকে: শুধু 'confirmed' স্ট্যাটাস
    const daily = data.filter(apt => apt.appointment_date === todayStr && apt.status === 'confirmed').length
    // এই সপ্তাহে: বিগত ৭ দিন, শুধু 'completed' স্ট্যাটাস
    const weekly = data.filter(apt => new Date(apt.appointment_date) >= weekAgo && apt.status === 'completed').length
    // এই মাসে: বিগত ৩০ দিন, শুধু 'completed' স্ট্যাটাস
    const monthly = data.filter(apt => new Date(apt.appointment_date) >= monthAgo && apt.status === 'completed').length

    setStats({ daily, weekly, monthly })
  }

  function getFilteredAppointments() {
    let filtered = appointments

    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.booking_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patient_phone?.includes(searchQuery)
      )
    }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (dateFilter === 'all') {
      // সব: শুধু 'completed' স্ট্যাটাস
      filtered = filtered.filter(apt => apt.status === 'completed')
    } else if (dateFilter === 'today') {
      // আজকে: শুধু 'confirmed' স্ট্যাটাস
      filtered = filtered.filter(apt => apt.appointment_date === todayStr && apt.status === 'confirmed')
    } else if (dateFilter === 'week') {
      // এই সপ্তাহ: বিগত ৭ দিন, শুধু 'completed' স্ট্যাটাস
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(apt => new Date(apt.appointment_date) >= weekAgo && apt.status === 'completed')
    } else if (dateFilter === 'month') {
      // এই মাস: বিগত ৩০ দিন, শুধু 'completed' স্ট্যাটাস
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter(apt => new Date(apt.appointment_date) >= monthAgo && apt.status === 'completed')
    }

    return filtered
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function openPrescriptionModal(apt) {
    setSelectedAppointment(apt)
    setPrescriptionUrl(apt.prescription_url || '')
    setShowPrescriptionModal(true)
  }

  async function handleSavePrescription() {
    if (!prescriptionUrl.trim()) {
      alert('প্রেসক্রিপশন URL দিন')
      return
    }

    setUploading(true)
    try {
      const { error } = await supabase
        .from('paid_appointments')
        .update({ prescription_url: prescriptionUrl })
        .eq('id', selectedAppointment.id)

      if (error) throw error
      
      alert('প্রেসক্রিপশন সফলভাবে আপলোড হয়েছে!')
      setShowPrescriptionModal(false)
      fetchAppointments()
    } catch (error) {
      console.error('Error:', error)
      alert('আপলোড করতে সমস্যা হয়েছে')
    } finally {
      setUploading(false)
    }
  }

  const filteredAppointments = getFilteredAppointments()

  return (
    <div>
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">পেইড সিরিয়াল</h1>
          <p className="text-gray-500 mt-1">আপনার পেইড অ্যাপয়েন্টমেন্ট সমূহ</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💎</span>
              <span className="text-white/80 text-sm">আজকে</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{stats.daily}</p>
            <p className="text-white/70 text-sm">রোগী</p>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-4 lg:p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📆</span>
              <span className="text-white/80 text-sm">এই সপ্তাহে</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{stats.weekly}</p>
            <p className="text-white/70 text-sm">রোগী</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🗓️</span>
              <span className="text-white/80 text-sm">এই মাসে</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{stats.monthly}</p>
            <p className="text-white/70 text-sm">রোগী</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 lg:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="নাম, রেফ নম্বর বা ফোন দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                সব
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === 'today' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                আজকে
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                এই সপ্তাহ
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                এই মাস
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <span className="text-5xl mb-4 block">💎</span>
            <p className="text-gray-500 text-lg">কোনো পেইড অ্যাপয়েন্টমেন্ট নেই</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-6 py-4 text-sm font-semibold">রেফ নম্বর</th>
                    <th className="px-6 py-4 text-sm font-semibold">রোগীর নাম</th>
                    <th className="px-6 py-4 text-sm font-semibold">ফোন</th>
                    <th className="px-6 py-4 text-sm font-semibold">তারিখ</th>
                    <th className="px-6 py-4 text-sm font-semibold">পেমেন্ট</th>
                    <th className="px-6 py-4 text-sm font-semibold">প্রেসক্রিপশন</th>
                    <th className="px-6 py-4 text-sm font-semibold">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-purple-600">{apt.booking_ref}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{apt.patient_name}</p>
                        <p className="text-xs text-gray-500">{apt.patient_age} বছর, {apt.patient_gender === 'male' ? 'পুরুষ' : 'মহিলা'}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{apt.patient_phone}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(apt.appointment_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          apt.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {apt.payment_status === 'paid' ? 'পেইড' : 'অপেক্ষমান'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {apt.prescription_url ? (
                          <a
                            href={apt.prescription_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            দেখুন
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">আপলোড হয়নি</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openPrescriptionModal(apt)}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                        >
                          {apt.prescription_url ? 'আপডেট' : 'আপলোড'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3">
              {filteredAppointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-medium text-purple-600 text-sm">{apt.booking_ref}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      apt.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {apt.payment_status === 'paid' ? 'পেইড' : 'অপেক্ষমান'}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800">{apt.patient_name}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-500">
                    <span>📞 {apt.patient_phone}</span>
                    <span>📅 {formatDate(apt.appointment_date)}</span>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <button
                      onClick={() => openPrescriptionModal(apt)}
                      className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
                    >
                      {apt.prescription_url ? 'প্রেসক্রিপশন আপডেট' : 'প্রেসক্রিপশন আপলোড'}
                    </button>
                    {apt.prescription_url && (
                      <a
                        href={apt.prescription_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        দেখুন
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">প্রেসক্রিপশন আপলোড</h2>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  <strong>রোগী:</strong> {selectedAppointment?.patient_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>রেফ:</strong> {selectedAppointment?.booking_ref}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  প্রেসক্রিপশন URL
                </label>
                <input
                  type="url"
                  value={prescriptionUrl}
                  onChange={(e) => setPrescriptionUrl(e.target.value)}
                  placeholder="https://example.com/prescription.jpg"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  প্রেসক্রিপশন ছবি আপলোড করে URL দিন (Google Drive, Imgur ইত্যাদি)
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleSavePrescription}
                disabled={uploading}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {uploading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorPaidAppointments
