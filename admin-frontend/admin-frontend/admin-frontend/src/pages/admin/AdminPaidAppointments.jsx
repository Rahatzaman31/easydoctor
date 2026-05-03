import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)])
}

function AdminPaidAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [prescriptionModal, setPrescriptionModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [prescriptionUrl, setPrescriptionUrl] = useState('')
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [uploadingPrescription, setUploadingPrescription] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('paid_appointments')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      const { error } = await supabase
        .from('paid_appointments')
        .update({ status })
        .eq('id', id)
      
      if (error) throw error
      fetchAppointments()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে')
    }
  }

  async function deleteAppointment(id, bookingRef) {
    if (!confirm(`আপনি কি নিশ্চিত যে "${bookingRef}" মুছে ফেলতে চান?`)) {
      return
    }
    try {
      const { error } = await supabase
        .from('paid_appointments')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchAppointments()
      alert('সফলভাবে মুছে ফেলা হয়েছে')
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('মুছে ফেলতে সমস্যা হয়েছে')
    }
  }

  function openPrescriptionModal(appointment) {
    setSelectedAppointment(appointment)
    setPrescriptionUrl(appointment.prescription_url || '')
    setPrescriptionNotes(appointment.prescription_notes || '')
    setPrescriptionModal(true)
  }

  function closePrescriptionModal() {
    setPrescriptionModal(false)
    setSelectedAppointment(null)
    setPrescriptionUrl('')
    setPrescriptionNotes('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('শুধুমাত্র JPEG, PNG বা PDF ফাইল আপলোড করুন')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ফাইলের সাইজ ১০MB এর বেশি হতে পারবে না')
      return
    }

    setUploadingPrescription(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `prescription_${selectedAppointment.booking_ref}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      setPrescriptionUrl(`storage:${filePath}`)
      alert('ফাইল সফলভাবে আপলোড হয়েছে। সংরক্ষণ করতে "সংরক্ষণ করুন" বাটনে ক্লিক করুন।')
    } catch (error) {
      console.error('Upload error:', error)
      alert('ফাইল আপলোড করতে সমস্যা হয়েছে। সরাসরি URL দিন অথবা আবার চেষ্টা করুন।')
    } finally {
      setUploadingPrescription(false)
    }
  }

  async function getSignedUrl(storagePath) {
    if (!storagePath.startsWith('storage:')) {
      return storagePath
    }
    const filePath = storagePath.replace('storage:', '')
    const { data, error } = await supabase.storage
      .from('prescriptions')
      .createSignedUrl(filePath, 3600)
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }
    return data.signedUrl
  }

  async function viewPrescription(apt) {
    if (!apt.prescription_url) return
    
    try {
      const url = await getSignedUrl(apt.prescription_url)
      if (url) {
        window.open(url, '_blank')
      } else {
        alert('প্রেসক্রিপশন দেখতে সমস্যা হয়েছে')
      }
    } catch (error) {
      console.error('Error viewing prescription:', error)
      alert('প্রেসক্রিপশন দেখতে সমস্যা হয়েছে')
    }
  }

  async function savePrescription() {
    if (!selectedAppointment) return

    if (!prescriptionUrl.trim()) {
      alert('প্রেসক্রিপশনের URL দিন')
      return
    }

    setUploadingPrescription(true)
    try {
      const { error } = await supabase
        .from('paid_appointments')
        .update({
          prescription_url: prescriptionUrl.trim(),
          prescription_notes: prescriptionNotes.trim(),
          prescription_uploaded_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id)

      if (error) throw error
      
      fetchAppointments()
      closePrescriptionModal()
      alert('প্রেসক্রিপশন সফলভাবে সংরক্ষণ করা হয়েছে')
    } catch (error) {
      console.error('Error saving prescription:', error)
      alert('প্রেসক্রিপশন সংরক্ষণ করতে সমস্যা হয়েছে')
    } finally {
      setUploadingPrescription(false)
    }
  }

  async function removePrescription(appointmentId) {
    if (!confirm('আপনি কি নিশ্চিত যে প্রেসক্রিপশন মুছে ফেলতে চান?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('paid_appointments')
        .update({
          prescription_url: null,
          prescription_notes: null,
          prescription_uploaded_at: null
        })
        .eq('id', appointmentId)

      if (error) throw error
      fetchAppointments()
      alert('প্রেসক্রিপশন মুছে ফেলা হয়েছে')
    } catch (error) {
      console.error('Error removing prescription:', error)
      alert('প্রেসক্রিপশন মুছে ফেলতে সমস্যা হয়েছে')
    }
  }

  const getDuplicatePaymentIds = () => {
    const paymentIdCounts = {}
    appointments.forEach(apt => {
      if (apt.payment_id) {
        paymentIdCounts[apt.payment_id] = (paymentIdCounts[apt.payment_id] || 0) + 1
      }
    })
    return Object.keys(paymentIdCounts).filter(id => paymentIdCounts[id] > 1)
  }

  const duplicatePaymentIds = getDuplicatePaymentIds()

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.booking_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_phone?.includes(searchTerm) ||
      apt.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    totalRevenue: appointments.reduce((sum, a) => sum + (a.payment_amount || 0), 0)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">পেইড সিরিয়াল</h1>
            <p className="text-gray-600">বিকাশ পেমেন্টের মাধ্যমে বুকিংসমূহ</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">মোট বুকিং</p>
                <p className="text-2xl font-bold text-gray-800">{toBengaliNumber(stats.total)}</p>
              </div>
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">নিশ্চিত</p>
                <p className="text-2xl font-bold text-green-600">{toBengaliNumber(stats.confirmed)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">সম্পন্ন</p>
                <p className="text-2xl font-bold text-blue-600">{toBengaliNumber(stats.completed)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">মোট আয়</p>
                <p className="text-2xl font-bold text-pink-600">৳{toBengaliNumber(stats.totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {duplicatePaymentIds.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">ডুপ্লিকেট এন্ট্রি পাওয়া গেছে!</span>
            </div>
            <p className="text-red-600 text-sm mt-2">
              একই পেমেন্ট আইডি দিয়ে {duplicatePaymentIds.length}টি ডুপ্লিকেট সেট আছে। ডুপ্লিকেট রো গুলো লাল রঙে হাইলাইট করা আছে। অতিরিক্ত এন্ট্রি মুছে ফেলুন।
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="নাম, রেফারেন্স, ফোন বা ট্রানজেকশন আইডি দিয়ে খুঁজুন..."
                className="input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="input-field md:w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="confirmed">নিশ্চিত</option>
              <option value="completed">সম্পন্ন</option>
              <option value="cancelled">বাতিল</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">কোনো পেইড সিরিয়াল পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">রেফারেন্স</th>
                    <th className="pb-3 font-medium">রোগী</th>
                    <th className="pb-3 font-medium">ডাক্তার</th>
                    <th className="pb-3 font-medium">তারিখ</th>
                    <th className="pb-3 font-medium">পেমেন্ট</th>
                    <th className="pb-3 font-medium">প্রেসক্রিপশন</th>
                    <th className="pb-3 font-medium">স্ট্যাটাস</th>
                    <th className="pb-3 font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(apt => {
                    const isDuplicate = duplicatePaymentIds.includes(apt.payment_id)
                    return (
                      <tr key={apt.id} className={`border-b last:border-b-0 ${isDuplicate ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                        <td className="py-4">
                          <span className="font-medium text-pink-600">{apt.booking_ref}</span>
                          {apt.transaction_id && (
                            <p className="text-xs text-gray-500 mt-1">TrxID: {apt.transaction_id}</p>
                          )}
                          {isDuplicate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 mt-1">
                              ডুপ্লিকেট
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <p className="font-medium text-gray-800">{apt.patient_name}</p>
                          <p className="text-sm text-gray-500">{apt.patient_phone}</p>
                          {(apt.upazila || apt.district) && (
                            <p className="text-xs text-gray-400 mt-0.5">{apt.upazila}{apt.upazila && apt.district ? ', ' : ''}{apt.district}</p>
                          )}
                        </td>
                        <td className="py-4 text-gray-700">{apt.doctor_name}</td>
                        <td className="py-4 text-gray-700">{apt.appointment_date}</td>
                        <td className="py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            ৳{apt.payment_amount} ({apt.payment_method})
                          </span>
                        </td>
                        <td className="py-4">
                          {apt.prescription_url ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                আপলোড হয়েছে
                              </span>
                              <button
                                onClick={() => openPrescriptionModal(apt)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="দেখুন/পরিবর্তন করুন"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => viewPrescription(apt)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                title="দেখুন"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removePrescription(apt.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="মুছে ফেলুন"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openPrescriptionModal(apt)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              আপলোড করুন
                            </button>
                          )}
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {apt.status === 'confirmed' ? 'নিশ্চিত' : 
                             apt.status === 'completed' ? 'সম্পন্ন' : 
                             apt.status === 'cancelled' ? 'বাতিল' : 'অপেক্ষমান'}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={apt.status}
                              onChange={(e) => updateStatus(apt.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                            >
                              <option value="confirmed">নিশ্চিত</option>
                              <option value="completed">সম্পন্ন</option>
                              <option value="cancelled">বাতিল</option>
                            </select>
                            <button
                              onClick={() => deleteAppointment(apt.id, apt.booking_ref)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="মুছে ফেলুন"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {prescriptionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">প্রেসক্রিপশন আপলোড</h3>
                    <p className="text-white/80 text-sm">{selectedAppointment.booking_ref}</p>
                  </div>
                </div>
                <button
                  onClick={closePrescriptionModal}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-2">রোগীর তথ্য</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">নাম:</span>
                    <p className="font-medium">{selectedAppointment.patient_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ফোন:</span>
                    <p className="font-medium">{selectedAppointment.patient_phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ডাক্তার:</span>
                    <p className="font-medium">{selectedAppointment.doctor_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">তারিখ:</span>
                    <p className="font-medium">{selectedAppointment.appointment_date}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ফাইল আপলোড করুন (JPEG, PNG, PDF)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-amber-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="prescription-file"
                  />
                  <label
                    htmlFor="prescription-file"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-600 font-medium">ফাইল নির্বাচন করুন</span>
                    <span className="text-gray-400 text-sm mt-1">অথবা এখানে ড্র্যাগ করুন</span>
                  </label>
                </div>
                {uploadingPrescription && (
                  <div className="mt-3 flex items-center gap-2 text-amber-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
                    <span className="text-sm">আপলোড হচ্ছে...</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  অথবা সরাসরি URL দিন
                </label>
                <input
                  type="url"
                  value={prescriptionUrl}
                  onChange={(e) => setPrescriptionUrl(e.target.value)}
                  placeholder="https://example.com/prescription.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                {prescriptionUrl && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    প্রেসক্রিপশন URL সেট করা হয়েছে
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  নোট (ঐচ্ছিক)
                </label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="প্রেসক্রিপশন সম্পর্কে কোনো নোট..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closePrescriptionModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={savePrescription}
                  disabled={uploadingPrescription || !prescriptionUrl.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPrescription ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPaidAppointments
