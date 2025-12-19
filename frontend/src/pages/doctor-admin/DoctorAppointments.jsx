import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

function DoctorAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 })
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

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .in('status', ['pending', 'confirmed', 'completed'])
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
    // Use local date string instead of ISO to avoid timezone issues
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const nextWeek = new Date(todayStart)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const daily = data.filter(apt => apt.appointment_date === todayStr && apt.status === 'confirmed').length
    
    const weekly = data.filter(apt => {
      const aptDate = new Date(apt.appointment_date + 'T00:00:00')
      return aptDate >= todayStart && aptDate < nextWeek && ['pending', 'confirmed'].includes(apt.status)
    }).length
    
    const monthly = data.filter(apt => {
      const aptDate = new Date(apt.appointment_date + 'T00:00:00')
      return aptDate >= monthStart && aptDate <= monthEnd && ['pending', 'confirmed'].includes(apt.status)
    }).length

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
    // Use local date string instead of ISO to avoid timezone issues
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    if (dateFilter === 'all') {
      filtered = filtered.filter(apt => ['pending', 'confirmed', 'completed'].includes(apt.status))
    } else if (dateFilter === 'today') {
      filtered = filtered.filter(apt => apt.appointment_date === todayStr && apt.status === 'confirmed')
    } else if (dateFilter === 'week') {
      const nextWeek = new Date(todayStart)
      nextWeek.setDate(nextWeek.getDate() + 7)
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointment_date + 'T00:00:00')
        return aptDate >= todayStart && aptDate < nextWeek && ['pending', 'confirmed'].includes(apt.status)
      })
    } else if (dateFilter === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointment_date + 'T00:00:00')
        return aptDate >= monthStart && aptDate < todayEnd && ['pending', 'confirmed', 'completed'].includes(apt.status)
      })
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

  function getStatusBadge(status) {
    if (status === 'confirmed') return { text: 'নিশ্চিত', class: 'bg-green-100 text-green-700' }
    if (status === 'completed') return { text: 'সম্পন্ন', class: 'bg-blue-100 text-blue-700' }
    return { text: 'অপেক্ষমান', class: 'bg-yellow-100 text-yellow-700' }
  }

  const filteredAppointments = getFilteredAppointments()

  return (
    <div className="p-4 pt-16 lg:pt-6 lg:p-8 bg-gray-50">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">সাধারন সিরিয়াল</h1>
          <p className="text-gray-500 mt-1">আপনার অ্যাপয়েন্টমেন্ট সমূহ</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📅</span>
              <span className="text-white/80 text-sm">আজকে</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{stats.daily}</p>
            <p className="text-white/70 text-sm">নিশ্চিত রোগী</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📆</span>
              <span className="text-white/80 text-sm">এই সপ্তাহে</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{stats.weekly}</p>
            <p className="text-white/70 text-sm">বুক করা</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🗓️</span>
              <span className="text-white/80 text-sm">এই মাসে</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{stats.monthly}</p>
            <p className="text-white/70 text-sm">বুক করা</p>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                সব
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === 'today' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                আজকে
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === 'week' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                এই সপ্তাহ
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === 'month' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                এই মাস
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <span className="text-5xl mb-4 block">📭</span>
            <p className="text-gray-500 text-lg">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
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
                    <th className="px-6 py-4 text-sm font-semibold">বয়স</th>
                    <th className="px-6 py-4 text-sm font-semibold">লিঙ্গ</th>
                    <th className="px-6 py-4 text-sm font-semibold">তারিখ</th>
                    <th className="px-6 py-4 text-sm font-semibold">সিরিয়াল নম্বর</th>
                    <th className="px-6 py-4 text-sm font-semibold">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.map((apt) => {
                    const badge = getStatusBadge(apt.status)
                    return (
                      <tr key={apt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-teal-600">{apt.booking_ref}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{apt.patient_name}</td>
                        <td className="px-6 py-4 text-gray-600">{apt.patient_phone}</td>
                        <td className="px-6 py-4 text-gray-600">{apt.patient_age} বছর</td>
                        <td className="px-6 py-4 text-gray-600">
                          {apt.patient_gender === 'male' ? 'পুরুষ' : apt.patient_gender === 'female' ? 'মহিলা' : 'অন্যান্য'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(apt.appointment_date)}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                            #{apt.serial_number || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                            {badge.text}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3">
              {filteredAppointments.map((apt) => {
                const badge = getStatusBadge(apt.status)
                return (
                  <div key={apt.id} className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-medium text-teal-600 text-sm">{apt.booking_ref}</span>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                          সিরিয়াল #{apt.serial_number || '-'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    <p className="font-medium text-gray-800">{apt.patient_name}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-500">
                      <span>📞 {apt.patient_phone}</span>
                      <span>📅 {formatDate(apt.appointment_date)}</span>
                      <span>🎂 {apt.patient_age} বছর</span>
                      <span>👤 {apt.patient_gender === 'male' ? 'পুরুষ' : apt.patient_gender === 'female' ? 'মহিলা' : 'অন্যান্য'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
    </div>
  )
}

export default DoctorAppointments
