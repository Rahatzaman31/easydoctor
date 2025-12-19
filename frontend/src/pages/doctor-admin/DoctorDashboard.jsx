import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

function DoctorDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    todayAppointments: 0,
    totalCompleted: 0
  })
  const [recentAppointments, setRecentAppointments] = useState([])
  const doctorId = localStorage.getItem('doctorId')
  const doctorName = localStorage.getItem('doctorName')

  useEffect(() => {
    if (!localStorage.getItem('doctorLoggedIn')) {
      navigate('/doctor.admin/login')
      return
    }
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      if (!supabase || !isConfigured || !doctorId) {
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      const [
        completedApptsRes,
        pendingApptsRes,
        todayConfirmedApptsRes,
        recentApptsRes
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('doctor_id', doctorId)
          .eq('status', 'completed'),
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('doctor_id', doctorId)
          .eq('status', 'pending'),
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('doctor_id', doctorId)
          .eq('status', 'confirmed')
          .eq('appointment_date', today),
        supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctorId)
          .in('status', ['confirmed', 'pending'])
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      const completedAppts = completedApptsRes.count || 0
      const pendingAppts = pendingApptsRes.count || 0
      const todayConfirmedGeneral = todayConfirmedApptsRes.count || 0

      setStats({
        totalAppointments: completedAppts,
        pendingAppointments: pendingAppts,
        todayAppointments: todayConfirmedGeneral,
        totalCompleted: completedAppts
      })

      setRecentAppointments(recentApptsRes.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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

  const statCards = [
    { label: 'মোট অ্যাপয়েন্টমেন্ট', value: stats.totalAppointments, icon: '📋', color: 'from-blue-500 to-blue-600' },
    { label: 'অপেক্ষমান', value: stats.pendingAppointments, icon: '⏳', color: 'from-yellow-500 to-orange-500' },
    { label: 'আজকের সিরিয়াল', value: stats.todayAppointments, icon: '📅', color: 'from-green-500 to-emerald-600' },
    { label: 'মোট সম্পন্ন', value: stats.totalCompleted, icon: '✅', color: 'from-teal-500 to-cyan-600' }
  ]

  return (
    <div className="flex-1 p-4 pt-16 lg:pt-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">স্বাগতম, {doctorName}</h1>
          <p className="text-gray-500 mt-1">আপনার ড্যাশবোর্ডে স্বাগতম</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((card, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 lg:p-6 text-white shadow-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl lg:text-3xl">{card.icon}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold">{card.value}</p>
                  <p className="text-white/80 text-sm mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>📋</span>
                  সাম্প্রতিক অ্যাপয়েন্টমেন্ট
                </h2>
              </div>

              {recentAppointments.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-5xl mb-4 block">📭</span>
                  <p className="text-gray-500">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600">
                          <th className="px-6 py-4 text-sm font-semibold">রেফ নম্বর</th>
                          <th className="px-6 py-4 text-sm font-semibold">রোগীর নাম</th>
                          <th className="px-6 py-4 text-sm font-semibold">ফোন</th>
                          <th className="px-6 py-4 text-sm font-semibold">তারিখ</th>
                          <th className="px-6 py-4 text-sm font-semibold">ধরন</th>
                          <th className="px-6 py-4 text-sm font-semibold">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentAppointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-teal-600">{apt.booking_ref}</td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-800">{apt.patient_name}</p>
                              <p className="text-xs text-gray-500">{apt.patient_age} বছর</p>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{apt.patient_phone}</td>
                            <td className="px-6 py-4 text-gray-600">{formatDate(apt.appointment_date)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                apt.hasOwnProperty('payment_status') 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {apt.hasOwnProperty('payment_status') ? 'পেইড' : 'সাধারন'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {apt.status === 'confirmed' ? 'নিশ্চিত' : apt.status === 'cancelled' ? 'বাতিল' : 'অপেক্ষমান'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:hidden space-y-3 p-4">
                    {recentAppointments.map((apt) => (
                      <div key={apt.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-teal-600 text-sm">{apt.booking_ref}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {apt.status === 'confirmed' ? 'নিশ্চিত' : apt.status === 'cancelled' ? 'বাতিল' : 'অপেক্ষমান'}
                          </span>
                        </div>
                        <p className="font-medium text-gray-800">{apt.patient_name}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>{apt.patient_phone}</span>
                          <span>{formatDate(apt.appointment_date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DoctorDashboard
