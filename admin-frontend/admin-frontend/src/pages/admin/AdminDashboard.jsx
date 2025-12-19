import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    todayAppointments: 0,
    paidAppointments: 0,
    healthcareProviders: 0,
    contactMessages: 0,
    totalReviews: 0
  })
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchData()
  }, [])

  async function fetchData() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { count: doctorCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true })
      const { count: appointmentCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
      const { count: pendingCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      
      const today = new Date().toISOString().split('T')[0]
      const { count: todayCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today)

      const { count: paidCount } = await supabase.from('paid_appointments').select('*', { count: 'exact', head: true })
      const { count: healthcareCount } = await supabase.from('data_edit_requests').select('*', { count: 'exact', head: true })
      const { count: messagesCount } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true })
      const { count: reviewsCount } = await supabase.from('doctor_reviews').select('*', { count: 'exact', head: true })

      const { data: recentAppts } = await supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(5)

      setStats({
        totalDoctors: doctorCount || 0,
        totalAppointments: appointmentCount || 0,
        pendingAppointments: pendingCount || 0,
        todayAppointments: todayCount || 0,
        paidAppointments: paidCount || 0,
        healthcareProviders: healthcareCount || 0,
        contactMessages: messagesCount || 0,
        totalReviews: reviewsCount || 0
      })
      setRecentAppointments(recentAppts || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8">ড্যাশবোর্ড</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs lg:text-sm">মোট ডাক্তার</p>
                <p className="text-xl lg:text-3xl font-bold text-gray-800">{stats.totalDoctors}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg lg:text-2xl">👨‍⚕️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs lg:text-sm">মোট অ্যাপয়েন্টমেন্ট</p>
                <p className="text-xl lg:text-3xl font-bold text-gray-800">{stats.totalAppointments}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg lg:text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs lg:text-sm">অপেক্ষমান</p>
                <p className="text-xl lg:text-3xl font-bold text-orange-600">{stats.pendingAppointments}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-lg lg:text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs lg:text-sm">আজকের সিরিয়াল</p>
                <p className="text-xl lg:text-3xl font-bold text-primary-600">{stats.todayAppointments}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-lg lg:text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <Link to="/admin/paid-appointments" className="bg-white rounded-xl shadow-md p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs lg:text-sm">পেইড সিরিয়াল</p>
                <p className="text-xl lg:text-3xl font-bold text-purple-600">{stats.paidAppointments}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg lg:text-2xl">💎</span>
              </div>
            </div>
          </Link>

          <Link to="/admin/healthcare-providers" className="bg-white rounded-xl shadow-md p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs lg:text-sm">স্বাস্থ্যসেবা প্রদানকারী</p>
                <p className="text-xl lg:text-3xl font-bold text-teal-600">{stats.healthcareProviders}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-lg lg:text-2xl">🏛️</span>
              </div>
            </div>
          </Link>

          <Link to="/admin/contact-settings" className="bg-white rounded-xl shadow-md p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs lg:text-sm">প্রাপ্ত বার্তাসমূহ</p>
                <p className="text-xl lg:text-3xl font-bold text-pink-600">{stats.contactMessages}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-lg lg:text-2xl">✉️</span>
              </div>
            </div>
          </Link>

          <Link to="/admin/reviews" className="bg-white rounded-xl shadow-md p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs lg:text-sm">রিভিউ ম্যানেজমেন্ট</p>
                <p className="text-xl lg:text-3xl font-bold text-amber-600">{stats.totalReviews}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-lg lg:text-2xl">💬</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800">সাম্প্রতিক অ্যাপয়েন্টমেন্ট</h2>
            <Link to="/admin/appointments" className="text-primary-600 hover:underline text-sm lg:text-base">সব দেখুন</Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : recentAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-3 text-sm">রেফ</th>
                      <th className="pb-3 text-sm">রোগী</th>
                      <th className="pb-3 text-sm">ডাক্তার</th>
                      <th className="pb-3 text-sm">তারিখ</th>
                      <th className="pb-3 text-sm">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map(apt => (
                      <tr key={apt.id} className="border-b last:border-b-0">
                        <td className="py-3 font-medium text-sm">{apt.booking_ref}</td>
                        <td className="py-3 text-sm">{apt.patient_name}</td>
                        <td className="py-3 text-sm">{apt.doctor_name}</td>
                        <td className="py-3 text-sm">{apt.appointment_date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
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

              <div className="md:hidden space-y-3">
                {recentAppointments.map(apt => (
                  <div key={apt.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{apt.booking_ref}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {apt.status === 'confirmed' ? 'নিশ্চিত' : apt.status === 'cancelled' ? 'বাতিল' : 'অপেক্ষমান'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">রোগী: {apt.patient_name}</p>
                    <p className="text-sm text-gray-600">ডাক্তার: {apt.doctor_name}</p>
                    <p className="text-sm text-gray-500">{apt.appointment_date}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
  )
}

export default AdminDashboard
