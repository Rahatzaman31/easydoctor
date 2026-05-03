import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { supabase, isConfigured } from '../../lib/supabase'

function AdminHealthcareProviders() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('doctors')
  const [doctorApplications, setDoctorApplications] = useState([])
  const [hospitalApplications, setHospitalApplications] = useState([])
  const [ambulanceApplications, setAmbulanceApplications] = useState([])
  const [adApplications, setAdApplications] = useState([])
  const [dataEditRequests, setDataEditRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      navigate('/admin/login')
      return
    }
    fetchAllApplications()
  }, [navigate])

  async function fetchAllApplications() {
    setLoading(true)
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const [doctors, hospitals, ambulances, ads, dataEdits] = await Promise.all([
        supabase.from('doctor_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('hospital_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('ambulance_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('advertisement_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('data_edit_requests').select('*').order('created_at', { ascending: false })
      ])

      setDoctorApplications(doctors.data || [])
      setHospitalApplications(hospitals.data || [])
      setAmbulanceApplications(ambulances.data || [])
      setAdApplications(ads.data || [])
      setDataEditRequests(dataEdits.data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(table, id, newStatus) {
    try {
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      fetchAllApplications()
      setShowModal(false)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  async function deleteApplication(table, id) {
    if (!confirm('আপনি কি নিশ্চিত এই আবেদন মুছে ফেলতে চান?')) return
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      fetchAllApplications()
      setShowModal(false)
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      approved: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800'
    }
    const labels = {
      pending: 'অপেক্ষমান',
      contacted: 'যোগাযোগ হয়েছে',
      in_progress: 'প্রক্রিয়াধীন',
      approved: 'অনুমোদিত',
      completed: 'সম্পন্ন',
      rejected: 'বাতিল'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || 'অপেক্ষমান'}
      </span>
    )
  }

  const tabs = [
    { id: 'doctors', label: 'ডাক্তার', icon: '👨‍⚕️', count: doctorApplications.length },
    { id: 'hospitals', label: 'হাসপাতাল', icon: '🏥', count: hospitalApplications.length },
    { id: 'ambulances', label: 'অ্যাম্বুলেন্স', icon: '🚑', count: ambulanceApplications.length },
    { id: 'ads', label: 'বিজ্ঞাপন', icon: '📢', count: adApplications.length },
    { id: 'data_edits', label: 'তথ্য সম্পাদনা', icon: '✏️', count: dataEditRequests.length }
  ]

  const renderDoctorApplications = () => (
    <div className="space-y-4">
      {doctorApplications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-4xl mb-4 block">👨‍⚕️</span>
          <p className="text-gray-500">কোনো ডাক্তার আবেদন পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">নাম</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">বিশেষত্ব</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">মোবাইল</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">তারিখ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctorApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {app.photo_url ? (
                        <img src={app.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                          {app.name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{app.name}</p>
                        <p className="text-xs text-gray-500">{app.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{app.specialty}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{app.mobile}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-4">{getStatusBadge(app.status)}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { setSelectedApplication({ ...app, type: 'doctor' }); setShowModal(true); }}
                      className="text-teal-600 hover:text-teal-800 font-medium text-sm"
                    >
                      বিস্তারিত
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderHospitalApplications = () => (
    <div className="space-y-4">
      {hospitalApplications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-4xl mb-4 block">🏥</span>
          <p className="text-gray-500">কোনো হাসপাতাল আবেদন পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">প্রতিষ্ঠান</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ধরন</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">মালিক</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">জেলা</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">তারিখ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hospitalApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {app.image_url ? (
                        <img src={app.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{app.name}</p>
                        <p className="text-xs text-gray-500">{app.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.type === 'diagnostic' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {app.type === 'diagnostic' ? 'ডায়াগনস্টিক' : 'হাসপাতাল'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-800">{app.owner_name}</p>
                    <p className="text-xs text-gray-500">{app.owner_mobile}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{app.district}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-4">{getStatusBadge(app.status)}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { setSelectedApplication({ ...app, appType: 'hospital' }); setShowModal(true); }}
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                    >
                      বিস্তারিত
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderAmbulanceApplications = () => (
    <div className="space-y-4">
      {ambulanceApplications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-4xl mb-4 block">🚑</span>
          <p className="text-gray-500">কোনো অ্যাম্বুলেন্স আবেদন পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">সার্ভিস নাম</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">মালিক</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ফোন</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">তারিখ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ambulanceApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium text-gray-800">{app.service_name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{app.owner_name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{app.phone}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-4">{getStatusBadge(app.status)}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { setSelectedApplication({ ...app, type: 'ambulance' }); setShowModal(true); }}
                      className="text-teal-600 hover:text-teal-800 font-medium text-sm"
                    >
                      বিস্তারিত
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const getApplicantTypeLabel = (type) => {
    const labels = {
      doctor: 'ডাক্তার',
      hospital: 'হাসপাতাল',
      diagnostic_center: 'ডায়াগনস্টিক সেন্টার',
      pharmacy: 'ফার্মেসি',
      other: 'অন্যান্য'
    }
    return labels[type] || type
  }

  const getAdTypeLabel = (type) => {
    const labels = {
      home_banner: 'হোম ব্যানার',
      profile_promotion: 'প্রোফাইল প্রোমোশন',
      featured_listing: 'ফিচার্ড লিস্টিং',
      special_offer: 'স্পেশাল অফার',
      new_chamber: 'নতুন চেম্বার',
      event: 'ইভেন্ট প্রচার'
    }
    return labels[type] || type
  }

  const renderAdApplications = () => (
    <div className="space-y-4">
      {adApplications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-4xl mb-4 block">📢</span>
          <p className="text-gray-500">কোনো বিজ্ঞাপন আবেদন পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">নাম</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ধরণ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">বিজ্ঞাপনের ধরন</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ফোন</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">তারিখ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-800">{app.name}</p>
                    {app.business_name && <p className="text-xs text-gray-500">{app.business_name}</p>}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{getApplicantTypeLabel(app.applicant_type)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{getAdTypeLabel(app.ad_type)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{app.phone}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-4">{getStatusBadge(app.status)}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { setSelectedApplication({ ...app, type: 'ad' }); setShowModal(true); }}
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                    >
                      বিস্তারিত
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderDoctorModal = () => {
    const app = selectedApplication
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b">
          {app.photo_url ? (
            <img src={app.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 text-2xl font-bold">
              {app.name?.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-800">{app.name}</h3>
            <p className="text-teal-600">{app.specialty}</p>
            {getStatusBadge(app.status)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-gray-500 text-sm">ইমেইল:</span><p className="font-medium">{app.email}</p></div>
          <div><span className="text-gray-500 text-sm">মোবাইল:</span><p className="font-medium">{app.mobile}</p></div>
          <div><span className="text-gray-500 text-sm">লিঙ্গ:</span><p className="font-medium">{app.gender === 'male' ? 'পুরুষ' : app.gender === 'female' ? 'মহিলা' : app.gender}</p></div>
          <div><span className="text-gray-500 text-sm">BM&DC নম্বর:</span><p className="font-medium">{app.bmdc_number}</p></div>
          <div><span className="text-gray-500 text-sm">অভিজ্ঞতা:</span><p className="font-medium">{app.experience}</p></div>
          <div><span className="text-gray-500 text-sm">পরামর্শ ফি:</span><p className="font-medium">{app.consultation_fee}</p></div>
        </div>

        <div><span className="text-gray-500 text-sm">শিক্ষাগত যোগ্যতা:</span><p className="font-medium">{app.qualifications}</p></div>
        <div><span className="text-gray-500 text-sm">পদবী ও বিভাগ:</span><p className="font-medium">{app.designation}</p></div>
        <div><span className="text-gray-500 text-sm">কর্মস্থল:</span><p className="font-medium">{app.workplace}</p></div>
        <div><span className="text-gray-500 text-sm">চেম্বারের নাম:</span><p className="font-medium">{app.chamber_name}</p></div>
        <div><span className="text-gray-500 text-sm">ভিজিটিং সময়:</span><p className="font-medium">{app.visiting_hour}</p></div>
        <div><span className="text-gray-500 text-sm">অ্যাপয়েন্টমেন্ট নম্বর:</span><p className="font-medium">{app.appointment_number}</p></div>
        <div><span className="text-gray-500 text-sm">চেম্বারের ঠিকানা:</span><p className="font-medium">{app.chamber_location}</p></div>
        {app.additional_info && <div><span className="text-gray-500 text-sm">অতিরিক্ত তথ্য:</span><p className="font-medium">{app.additional_info}</p></div>}
        
        {app.visiting_card_url && (
          <div>
            <span className="text-gray-500 text-sm block mb-2">ভিজিটিং কার্ড:</span>
            <img src={app.visiting_card_url} alt="Visiting Card" className="max-w-full h-auto rounded-lg border" />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => updateStatus('doctor_applications', app.id, 'approved')}
            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            অনুমোদন করুন
          </button>
          <button
            onClick={() => updateStatus('doctor_applications', app.id, 'rejected')}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            বাতিল করুন
          </button>
          <button
            onClick={() => deleteApplication('doctor_applications', app.id)}
            className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            মুছুন
          </button>
        </div>
      </div>
    )
  }

  const renderHospitalModal = () => {
    const app = selectedApplication
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4 pb-4 border-b">
          {app.image_url ? (
            <img src={app.image_url} alt="" className="w-24 h-24 rounded-xl object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">{app.name}</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              app.type === 'diagnostic' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {app.type === 'diagnostic' ? 'ডায়াগনস্টিক সেন্টার' : 'হাসপাতাল'}
            </span>
            <div className="mt-2">{getStatusBadge(app.status)}</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-purple-800 mb-3">মালিক/কর্তৃপক্ষের তথ্য</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500 text-sm">নাম:</span><p className="font-medium">{app.owner_name}</p></div>
            <div><span className="text-gray-500 text-sm">মোবাইল:</span><p className="font-medium">{app.owner_mobile}</p></div>
            <div className="col-span-2"><span className="text-gray-500 text-sm">ইমেইল:</span><p className="font-medium">{app.owner_email}</p></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-gray-500 text-sm">জেলা:</span><p className="font-medium">{app.district}</p></div>
          <div><span className="text-gray-500 text-sm">প্রতিষ্ঠান ফোন:</span><p className="font-medium">{app.phone || '-'}</p></div>
          <div><span className="text-gray-500 text-sm">প্রতিষ্ঠান ইমেইল:</span><p className="font-medium">{app.email || '-'}</p></div>
          <div><span className="text-gray-500 text-sm">ওয়েবসাইট:</span><p className="font-medium">{app.website || '-'}</p></div>
          <div><span className="text-gray-500 text-sm">খোলার সময়:</span><p className="font-medium">{app.opening_hours || '-'}</p></div>
          <div><span className="text-gray-500 text-sm">ট্রেড লাইসেন্স:</span><p className="font-medium">{app.trade_license_number || '-'}</p></div>
        </div>

        <div className="col-span-2"><span className="text-gray-500 text-sm">ঠিকানা:</span><p className="font-medium">{app.address}</p></div>
        
        {app.description && <div><span className="text-gray-500 text-sm">বিবরণ:</span><p className="font-medium whitespace-pre-line">{app.description}</p></div>}
        {app.services && <div><span className="text-gray-500 text-sm">সেবাসমূহ:</span><p className="font-medium">{app.services}</p></div>}
        {app.facilities && <div><span className="text-gray-500 text-sm">সুবিধাসমূহ:</span><p className="font-medium">{app.facilities}</p></div>}
        {app.additional_info && <div><span className="text-gray-500 text-sm">অতিরিক্ত তথ্য:</span><p className="font-medium">{app.additional_info}</p></div>}
        
        {app.trade_license_url && (
          <div>
            <span className="text-gray-500 text-sm block mb-2">ট্রেড লাইসেন্স ছবি:</span>
            <img src={app.trade_license_url} alt="Trade License" className="max-w-full h-auto rounded-lg border" />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => updateStatus('hospital_applications', app.id, 'approved')}
            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            অনুমোদন করুন
          </button>
          <button
            onClick={() => updateStatus('hospital_applications', app.id, 'rejected')}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            বাতিল করুন
          </button>
          <button
            onClick={() => deleteApplication('hospital_applications', app.id)}
            className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            মুছুন
          </button>
        </div>
      </div>
    )
  }

  const renderAmbulanceModal = () => {
    const app = selectedApplication
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4 pb-4 border-b">
          <div className="flex gap-3">
            {app.owner_photo_url ? (
              <img src={app.owner_photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            {app.ambulance_photo_url && (
              <img src={app.ambulance_photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">{app.service_name}</h3>
            <p className="text-red-600">{app.ambulance_type}</p>
            <div className="mt-2">{getStatusBadge(app.status)}</div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-3">মালিক/ড্রাইভারের তথ্য</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500 text-sm">নাম:</span><p className="font-medium">{app.owner_name}</p></div>
            <div><span className="text-gray-500 text-sm">মোবাইল:</span><p className="font-medium">{app.phone}</p></div>
            {app.alt_phone && <div><span className="text-gray-500 text-sm">বিকল্প মোবাইল:</span><p className="font-medium">{app.alt_phone}</p></div>}
            {app.email && <div><span className="text-gray-500 text-sm">ইমেইল:</span><p className="font-medium">{app.email}</p></div>}
            {app.nid_number && <div><span className="text-gray-500 text-sm">NID নম্বর:</span><p className="font-medium">{app.nid_number}</p></div>}
            {app.driving_license_number && <div><span className="text-gray-500 text-sm">ড্রাইভিং লাইসেন্স:</span><p className="font-medium">{app.driving_license_number}</p></div>}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">সেবা ও অবস্থান তথ্য</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500 text-sm">জেলা:</span><p className="font-medium">{app.district}</p></div>
            <div className="col-span-2"><span className="text-gray-500 text-sm">ঠিকানা:</span><p className="font-medium">{app.address}</p></div>
            {app.service_areas && <div className="col-span-2"><span className="text-gray-500 text-sm">সেবা এলাকাসমূহ:</span><p className="font-medium">{app.service_areas}</p></div>}
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">গাড়ির তথ্য</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500 text-sm">অ্যাম্বুলেন্সের ধরণ:</span><p className="font-medium">{app.ambulance_type}</p></div>
            <div><span className="text-gray-500 text-sm">গাড়ির নম্বর:</span><p className="font-medium">{app.vehicle_number}</p></div>
            {app.vehicle_model && <div><span className="text-gray-500 text-sm">গাড়ির মডেল:</span><p className="font-medium">{app.vehicle_model}</p></div>}
            {app.vehicle_year && <div><span className="text-gray-500 text-sm">গাড়ির বছর:</span><p className="font-medium">{app.vehicle_year}</p></div>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {app.has_oxygen && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">অক্সিজেন</span>}
            {app.has_stretcher && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">স্ট্রেচার</span>}
            {app.has_ac && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">এসি</span>}
            {app.has_icu_equipment && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">ICU সরঞ্জাম</span>}
            {app.has_freezing && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">ফ্রিজিং</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {app.experience_years > 0 && <div><span className="text-gray-500 text-sm">অভিজ্ঞতা:</span><p className="font-medium">{app.experience_years} বছর</p></div>}
          {app.fare_per_km && <div><span className="text-gray-500 text-sm">প্রতি কিমি ভাড়া:</span><p className="font-medium">৳{app.fare_per_km}</p></div>}
          {app.base_fare && <div><span className="text-gray-500 text-sm">বেস ভাড়া:</span><p className="font-medium">{app.base_fare}</p></div>}
          <div><span className="text-gray-500 text-sm">২৪ ঘণ্টা সেবা:</span><p className="font-medium">{app.available_24_hours ? 'হ্যাঁ' : 'না'}</p></div>
          {app.available_days && <div><span className="text-gray-500 text-sm">সেবার সময়:</span><p className="font-medium">{app.available_days}</p></div>}
        </div>

        {app.additional_info && <div><span className="text-gray-500 text-sm">অতিরিক্ত তথ্য:</span><p className="font-medium whitespace-pre-line">{app.additional_info}</p></div>}
        
        {(app.driving_license_url || app.vehicle_registration_url) && (
          <div className="grid grid-cols-2 gap-4">
            {app.driving_license_url && (
              <div>
                <span className="text-gray-500 text-sm block mb-2">ড্রাইভিং লাইসেন্স:</span>
                <img src={app.driving_license_url} alt="Driving License" className="max-w-full h-auto rounded-lg border" />
              </div>
            )}
            {app.vehicle_registration_url && (
              <div>
                <span className="text-gray-500 text-sm block mb-2">গাড়ির রেজিস্ট্রেশন:</span>
                <img src={app.vehicle_registration_url} alt="Vehicle Registration" className="max-w-full h-auto rounded-lg border" />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => updateStatus('ambulance_applications', app.id, 'approved')}
            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            অনুমোদন করুন
          </button>
          <button
            onClick={() => updateStatus('ambulance_applications', app.id, 'rejected')}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            বাতিল করুন
          </button>
          <button
            onClick={() => deleteApplication('ambulance_applications', app.id)}
            className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            মুছুন
          </button>
        </div>
      </div>
    )
  }

  const getAdDurationLabel = (duration) => {
    const labels = {
      '1_week': '১ সপ্তাহ',
      '2_weeks': '২ সপ্তাহ',
      '1_month': '১ মাস',
      '3_months': '৩ মাস',
      '6_months': '৬ মাস',
      '1_year': '১ বছর'
    }
    return labels[duration] || duration
  }

  const getBudgetLabel = (budget) => {
    const labels = {
      'under_1000': '১,০০০ টাকার নিচে',
      '1000_5000': '১,০০০ - ৫,০০০ টাকা',
      '5000_10000': '৫,০০০ - ১০,০০০ টাকা',
      '10000_25000': '১০,০০০ - ২৫,০০০ টাকা',
      '25000_plus': '২৫,০০০ টাকার উপরে',
      'negotiable': 'আলোচনা সাপেক্ষে'
    }
    return labels[budget] || budget
  }

  const getProviderTypeLabel = (type) => {
    const labels = {
      doctor: 'ডাক্তার',
      hospital: 'হাসপাতাল',
      diagnostic_center: 'ডায়াগনস্টিক সেন্টার',
      ambulance: 'অ্যাম্বুলেন্স সার্ভিস'
    }
    return labels[type] || type
  }

  const getRequestTypeLabel = (type) => {
    const labels = {
      edit: 'তথ্য সংশোধন',
      delete: 'তথ্য মুছে ফেলা'
    }
    return labels[type] || type
  }

  const renderDataEditRequests = () => (
    <div className="space-y-3">
      {dataEditRequests.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <span className="text-3xl mb-2 block">✏️</span>
          <p className="text-gray-500 text-sm">কোনো তথ্য সম্পাদনার অনুরোধ পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">নাম</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">ধরন</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">অনুরোধ</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">মোবাইল</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">তারিখ</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">স্ট্যাটাস</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dataEditRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-bold flex-shrink-0">
                        {req.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{req.name}</p>
                        <p className="text-xs text-gray-500 truncate">{req.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {getProviderTypeLabel(req.provider_type)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      req.request_type === 'delete' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {getRequestTypeLabel(req.request_type)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{req.mobile}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString('bn-BD')}</td>
                  <td className="px-3 py-2">{getStatusBadge(req.status)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => { setSelectedApplication({ ...req, type: 'data_edit' }); setShowModal(true); }}
                      className="text-orange-600 hover:text-orange-800 font-medium text-xs"
                    >
                      দেখুন
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderDataEditModal = () => {
    const req = selectedApplication
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-2xl font-bold">
            {req.name?.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{req.name}</h3>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {getProviderTypeLabel(req.provider_type)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                req.request_type === 'delete' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {getRequestTypeLabel(req.request_type)}
              </span>
            </div>
            <div className="mt-2">{getStatusBadge(req.status)}</div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-orange-800 mb-3">যোগাযোগ তথ্য</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500 text-sm">নাম:</span><p className="font-medium">{req.name}</p></div>
            <div><span className="text-gray-500 text-sm">মোবাইল:</span><p className="font-medium">{req.mobile}</p></div>
            <div className="col-span-2"><span className="text-gray-500 text-sm">ইমেইল:</span><p className="font-medium">{req.email}</p></div>
            {req.registration_number && <div className="col-span-2"><span className="text-gray-500 text-sm">রেজিস্ট্রেশন/রেফারেন্স নম্বর:</span><p className="font-medium">{req.registration_number}</p></div>}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">বর্তমান তথ্য</h4>
          <p className="text-gray-700 whitespace-pre-line">{req.current_info}</p>
        </div>

        {req.request_type === 'edit' && req.updated_info && (
          <div className="bg-green-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">সংশোধিত/নতুন তথ্য</h4>
            <p className="text-gray-700 whitespace-pre-line">{req.updated_info}</p>
          </div>
        )}

        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">কারণ</h4>
          <p className="text-gray-700 whitespace-pre-line">{req.reason}</p>
        </div>

        {req.document_url && (
          <div>
            <span className="text-gray-500 text-sm block mb-2">সহায়ক ডকুমেন্ট:</span>
            <img src={req.document_url} alt="Document" className="max-w-full h-auto rounded-lg border" />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => updateStatus('data_edit_requests', req.id, 'in_progress')}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            প্রক্রিয়াধীন
          </button>
          <button
            onClick={() => updateStatus('data_edit_requests', req.id, 'completed')}
            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            সম্পন্ন
          </button>
          <button
            onClick={() => updateStatus('data_edit_requests', req.id, 'rejected')}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            বাতিল
          </button>
          <button
            onClick={() => deleteApplication('data_edit_requests', req.id)}
            className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            মুছুন
          </button>
        </div>
      </div>
    )
  }

  const renderAdModal = () => {
    const app = selectedApplication
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4 pb-4 border-b">
          <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">{app.name}</h3>
            <p className="text-purple-600">{getApplicantTypeLabel(app.applicant_type)}</p>
            <div className="mt-2">{getStatusBadge(app.status)}</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-purple-800 mb-3">যোগাযোগ তথ্য</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500 text-sm">নাম:</span><p className="font-medium">{app.name}</p></div>
            <div><span className="text-gray-500 text-sm">মোবাইল:</span><p className="font-medium">{app.phone}</p></div>
            {app.email && <div><span className="text-gray-500 text-sm">ইমেইল:</span><p className="font-medium">{app.email}</p></div>}
            {app.business_name && <div className="col-span-2"><span className="text-gray-500 text-sm">প্রতিষ্ঠান/বিশেষত্ব:</span><p className="font-medium">{app.business_name}</p></div>}
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">বিজ্ঞাপন তথ্য</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500 text-sm">বিজ্ঞাপনের ধরণ:</span><p className="font-medium">{getAdTypeLabel(app.ad_type)}</p></div>
            {app.ad_duration && <div><span className="text-gray-500 text-sm">সময়কাল:</span><p className="font-medium">{getAdDurationLabel(app.ad_duration)}</p></div>}
            {app.budget_range && <div><span className="text-gray-500 text-sm">বাজেট:</span><p className="font-medium">{getBudgetLabel(app.budget_range)}</p></div>}
          </div>
        </div>

        {app.subject && (
          <div>
            <span className="text-gray-500 text-sm">বিষয়:</span>
            <p className="font-medium">{app.subject}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">বার্তা</h4>
          <p className="text-gray-700 whitespace-pre-line">{app.message}</p>
        </div>

        {app.additional_requirements && (
          <div>
            <span className="text-gray-500 text-sm">অতিরিক্ত প্রয়োজনীয়তা:</span>
            <p className="font-medium whitespace-pre-line">{app.additional_requirements}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => updateStatus('advertisement_applications', app.id, 'contacted')}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            যোগাযোগ হয়েছে
          </button>
          <button
            onClick={() => updateStatus('advertisement_applications', app.id, 'approved')}
            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            অনুমোদিত
          </button>
          <button
            onClick={() => updateStatus('advertisement_applications', app.id, 'rejected')}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            বাতিল
          </button>
          <button
            onClick={() => deleteApplication('advertisement_applications', app.id)}
            className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            মুছুন
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-4 lg:p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-800">স্বাস্থ্যসেবা প্রদানকারী</h1>
          <p className="text-gray-500 text-sm">সকল আবেদন পরিচালনা করুন</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'doctors' && renderDoctorApplications()}
                {activeTab === 'hospitals' && renderHospitalApplications()}
                {activeTab === 'ambulances' && renderAmbulanceApplications()}
                {activeTab === 'ads' && renderAdApplications()}
                {activeTab === 'data_edits' && renderDataEditRequests()}
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">আবেদনের বিস্তারিত</h2>
                <button
                  onClick={() => { setShowModal(false); setSelectedApplication(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedApplication.type === 'doctor' ? renderDoctorModal() : 
               selectedApplication.appType === 'hospital' ? renderHospitalModal() : 
               selectedApplication.type === 'ambulance' ? renderAmbulanceModal() : 
               selectedApplication.type === 'data_edit' ? renderDataEditModal() : renderAdModal()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminHealthcareProviders
