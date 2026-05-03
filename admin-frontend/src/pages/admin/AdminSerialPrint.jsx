import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminSerialPrint() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [doctorGroups, setDoctorGroups] = useState([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchAppointmentsByDate(selectedDate)
  }, [selectedDate])

  async function fetchAppointmentsByDate(date) {
    setLoading(true)
    try {
      if (!supabase || !isConfigured) { setLoading(false); return }
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', date)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true })
      if (error) throw error

      const grouped = {}
      ;(data || []).forEach(apt => {
        const key = apt.doctor_name || 'অজানা ডাক্তার'
        if (!grouped[key]) {
          grouped[key] = { doctor_name: key, doctor_id: apt.doctor_id || null, appointments: [] }
        }
        grouped[key].appointments.push(apt)
      })
      setDoctorGroups(Object.values(grouped).sort((a, b) => a.doctor_name.localeCompare(b.doctor_name)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDateBengali = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const totalAppointments = doctorGroups.reduce((sum, g) => sum + g.appointments.length, 0)

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">সিরিয়াল প্রিন্ট</h1>
            <p className="text-gray-500 text-sm mt-1">ডাক্তার অনুযায়ী অ্যাপয়েন্টমেন্ট তালিকা</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">তারিখ নির্বাচন:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-800 font-medium text-sm">
            {formatDateBengali(selectedDate)} — মোট {totalAppointments}টি অ্যাপয়েন্টমেন্ট, {doctorGroups.length}জন ডাক্তার
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">লোড হচ্ছে...</p>
          </div>
        ) : doctorGroups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">এই তারিখে কোনো অ্যাপয়েন্টমেন্ট নেই</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctorGroups.map(group => (
              <Link
                key={group.doctor_name}
                to={`/admin/serial-print/${encodeURIComponent(group.doctor_name)}?date=${selectedDate}`}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg hover:border-primary-300 border border-transparent transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
                      <span className="text-primary-700 font-bold text-lg">
                        {group.doctor_name.replace(/ডাঃ\s*|ডা\.\s*|Dr\.\s*/i, '').charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{group.doctor_name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                      {group.appointments.length}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">সিরিয়াল</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">প্রিন্ট তালিকা দেখুন</span>
                  <svg className="w-4 h-4 text-primary-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSerialPrint
