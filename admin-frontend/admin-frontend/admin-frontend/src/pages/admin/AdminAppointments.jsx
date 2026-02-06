import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchAppointments()
  }, [filter])

  async function fetchAppointments() {
    setLoading(true)
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            name
          )
        `)
        .order('created_at', { ascending: false })
      
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
      
      if (error) throw error
      fetchAppointments()
    } catch (error) {
      console.error('Error:', error)
      alert('আপডেট করতে সমস্যা হয়েছে')
    }
  }

  const filteredAppointments = appointments.filter(apt =>
    apt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.booking_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.patient_phone?.includes(searchQuery)
  )

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8">অ্যাপয়েন্টমেন্ট পরিচালনা</h1>

        <div className="bg-white rounded-xl shadow-md p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex flex-col gap-3 lg:gap-4">
            <div className="flex-1">
              <input
                type="text"
                className="input-field w-full"
                placeholder="নাম, রেফ নম্বর বা ফোন দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                সব
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                অপেক্ষমান
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base ${filter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                নিশ্চিত
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base ${filter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                বাতিল
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 lg:p-12 text-center">
            <p className="text-gray-500 text-base lg:text-lg">কোনো অ্যাপয়েন্টমেন্ট নেই</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-600">
                      <th className="px-6 py-4 text-sm">রেফ নম্বর</th>
                      <th className="px-6 py-4 text-sm">রোগী</th>
                      <th className="px-6 py-4 text-sm">ডাক্তার</th>
                      <th className="px-6 py-4 text-sm">তারিখ</th>
                      <th className="px-6 py-4 text-sm">স্ট্যাটাস</th>
                      <th className="px-6 py-4 text-sm">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map(apt => (
                      <tr key={apt.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-primary-600">{apt.booking_ref}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{apt.patient_name}</p>
                            <p className="text-sm text-gray-500">{apt.patient_phone}</p>
                            <p className="text-xs text-gray-400">{apt.patient_age} বছর, {apt.patient_gender === 'male' ? 'পুরুষ' : apt.patient_gender === 'female' ? 'মহিলা' : 'অন্যান্য'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">{apt.doctors?.name || 'N/A'}</td>
                        <td className="px-6 py-4">{apt.appointment_date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {apt.status === 'confirmed' ? 'নিশ্চিত' : apt.status === 'cancelled' ? 'বাতিল' : apt.status === 'completed' ? 'সম্পন্ন' : 'অপেক্ষমান'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {apt.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(apt.id, 'confirmed')}
                                  className="text-green-600 hover:underline text-sm"
                                >
                                  নিশ্চিত
                                </button>
                                <button
                                  onClick={() => updateStatus(apt.id, 'cancelled')}
                                  className="text-red-600 hover:underline text-sm"
                                >
                                  বাতিল
                                </button>
                              </>
                            )}
                            {apt.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => updateStatus(apt.id, 'completed')}
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  সম্পন্ন
                                </button>
                                <button
                                  onClick={() => updateStatus(apt.id, 'cancelled')}
                                  className="text-red-600 hover:underline text-sm"
                                >
                                  বাতিল
                                </button>
                              </>
                            )}
                            {apt.status === 'completed' && (
                              <span className="text-blue-600 text-sm">সম্পন্ন হয়েছে</span>
                            )}
                            {apt.status === 'cancelled' && (
                              <button
                                onClick={() => updateStatus(apt.id, 'pending')}
                                className="text-primary-600 hover:underline text-sm"
                              >
                                পুনরায় সক্রিয়
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:hidden space-y-3">
              {filteredAppointments.map(apt => (
                <div key={apt.id} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-medium text-primary-600 text-sm">{apt.booking_ref}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {apt.status === 'confirmed' ? 'নিশ্চিত' : apt.status === 'cancelled' ? 'বাতিল' : apt.status === 'completed' ? 'সম্পন্ন' : 'অপেক্ষমান'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div>
                      <p className="font-medium text-gray-800">{apt.patient_name}</p>
                      <p className="text-sm text-gray-500">{apt.patient_phone}</p>
                      <p className="text-xs text-gray-400">{apt.patient_age} বছর, {apt.patient_gender === 'male' ? 'পুরুষ' : apt.patient_gender === 'female' ? 'মহিলা' : 'অন্যান্য'}</p>
                    </div>
                    <p className="text-sm"><span className="text-gray-500">ডাক্তার:</span> {apt.doctors?.name || 'N/A'}</p>
                    <p className="text-sm"><span className="text-gray-500">তারিখ:</span> {apt.appointment_date}</p>
                  </div>

                  <div className="flex gap-3 pt-3 border-t">
                    {apt.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(apt.id, 'confirmed')}
                          className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                        >
                          নিশ্চিত করুন
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                        >
                          বাতিল করুন
                        </button>
                      </>
                    )}
                    {apt.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateStatus(apt.id, 'completed')}
                          className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                        >
                          সম্পন্ন করুন
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                        >
                          বাতিল করুন
                        </button>
                      </>
                    )}
                    {apt.status === 'completed' && (
                      <span className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium text-center">
                        সম্পন্ন হয়েছে
                      </span>
                    )}
                    {apt.status === 'cancelled' && (
                      <button
                        onClick={() => updateStatus(apt.id, 'pending')}
                        className="flex-1 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200"
                      >
                        পুনরায় সক্রিয় করুন
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminAppointments
