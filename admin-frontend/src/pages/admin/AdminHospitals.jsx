import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

const districts = ['রংপুর', 'দিনাজপুর', 'কুড়িগ্রাম', 'লালমনিরহাট', 'নীলফামারী', 'গাইবান্ধা', 'ঠাকুরগাঁও', 'পঞ্চগড়']

const hospitalTypes = [
  { id: 'hospital', name: 'হাসপাতাল' },
  { id: 'diagnostic', name: 'ডায়াগনস্টিক সেন্টার' }
]

function AdminHospitals() {
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingHospital, setEditingHospital] = useState(null)
  const [doctorSearch, setDoctorSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [linkedDoctors, setLinkedDoctors] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'hospital',
    description: '',
    address: '',
    district: 'রংপুর',
    phone: '',
    email: '',
    website: '',
    image_url: '',
    map_image_url: '',
    services: '',
    facilities: '',
    opening_hours: '',
    is_active: true,
    is_featured_home: false,
    display_order: 0
  })

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchHospitals()
  }, [])

  async function fetchHospitals() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setHospitals(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingHospital(null)
    setFormData({
      name: '',
      type: 'hospital',
      description: '',
      address: '',
      district: 'রংপুর',
      phone: '',
      email: '',
      website: '',
      image_url: '',
      map_image_url: '',
      services: '',
      facilities: '',
      opening_hours: '',
      is_active: true,
      is_featured_home: false,
      display_order: 0
    })
    setLinkedDoctors([])
    setDoctorSearch('')
    setSearchResults([])
    setShowModal(true)
  }

  async function openEditModal(hospital) {
    setEditingHospital(hospital)
    setFormData({
      name: hospital.name || '',
      type: hospital.type || 'hospital',
      description: hospital.description || '',
      address: hospital.address || '',
      district: hospital.district || 'রংপুর',
      phone: hospital.phone || '',
      email: hospital.email || '',
      website: hospital.website || '',
      image_url: hospital.image_url || '',
      map_image_url: hospital.map_image_url || '',
      services: hospital.services ? hospital.services.join(', ') : '',
      facilities: hospital.facilities ? hospital.facilities.join(', ') : '',
      opening_hours: hospital.opening_hours || '',
      is_active: hospital.is_active ?? true,
      is_featured_home: hospital.is_featured_home ?? false,
      display_order: hospital.display_order || 0
    })
    setDoctorSearch('')
    setSearchResults([])
    
    const doctorIds = hospital.linked_doctor_ids || []
    if (doctorIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('id, name, degrees, category_name, image_url, is_active')
          .in('id', doctorIds)
        
        if (!error && data) {
          setLinkedDoctors(data)
        } else {
          setLinkedDoctors([])
        }
      } catch (error) {
        console.error('Error fetching linked doctors:', error)
        setLinkedDoctors([])
      }
    } else {
      setLinkedDoctors([])
    }
    
    setShowModal(true)
  }

  async function searchDoctors(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([])
      return
    }
    
    setSearchLoading(true)
    try {
      if (!supabase || !isConfigured) return
      
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, degrees, category_name, image_url')
        .ilike('name', `%${searchTerm}%`)
        .limit(10)
      
      if (error) throw error
      
      const linkedIds = linkedDoctors.map(d => d.id)
      const filteredResults = (data || []).filter(d => !linkedIds.includes(d.id))
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching doctors:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  function addLinkedDoctor(doctor) {
    if (!linkedDoctors.find(d => d.id === doctor.id)) {
      setLinkedDoctors([...linkedDoctors, doctor])
    }
    setDoctorSearch('')
    setSearchResults([])
  }

  function removeLinkedDoctor(doctorId) {
    setLinkedDoctors(linkedDoctors.filter(d => d.id !== doctorId))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস কনফিগার করা হয়নি')
        return
      }
      
      const hospitalData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        address: formData.address,
        district: formData.district,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        image_url: formData.image_url,
        map_image_url: formData.map_image_url,
        services: formData.services ? formData.services.split(',').map(s => s.trim()).filter(s => s) : [],
        facilities: formData.facilities ? formData.facilities.split(',').map(s => s.trim()).filter(s => s) : [],
        opening_hours: formData.opening_hours,
        is_active: formData.is_active,
        is_featured_home: formData.is_featured_home,
        display_order: parseInt(formData.display_order) || 0,
        linked_doctor_ids: linkedDoctors.map(d => d.id)
      }

      if (editingHospital) {
        const { error } = await supabase
          .from('hospitals')
          .update(hospitalData)
          .eq('id', editingHospital.id)
        
        if (error) throw error
        alert('সফলভাবে আপডেট হয়েছে!')
      } else {
        const { error } = await supabase
          .from('hospitals')
          .insert([hospitalData])
        
        if (error) throw error
        alert('সফলভাবে যোগ হয়েছে!')
      }

      setShowModal(false)
      fetchHospitals()
    } catch (error) {
      console.error('Error:', error)
      alert('একটি সমস্যা হয়েছে: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('আপনি কি নিশ্চিত?')) return
    
    try {
      if (!supabase || !isConfigured) return
      
      const { error } = await supabase
        .from('hospitals')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchHospitals()
    } catch (error) {
      console.error('Error:', error)
      alert('মুছে ফেলতে সমস্যা হয়েছে')
    }
  }

  async function toggleActive(hospital) {
    try {
      if (!supabase || !isConfigured) return
      
      const { error } = await supabase
        .from('hospitals')
        .update({ is_active: !hospital.is_active })
        .eq('id', hospital.id)
      
      if (error) throw error
      fetchHospitals()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function toggleFeatured(hospital) {
    try {
      if (!supabase || !isConfigured) return
      
      const { error } = await supabase
        .from('hospitals')
        .update({ is_featured_home: !hospital.is_featured_home })
        .eq('id', hospital.id)
      
      if (error) throw error
      fetchHospitals()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">হাসপাতাল ও ডায়াগনস্টিক সেন্টার</h1>
            <p className="text-gray-500 mt-1">সকল হাসপাতাল ও ডায়াগনস্টিক সেন্টার পরিচালনা করুন</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            নতুন যোগ করুন
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো হাসপাতাল বা ডায়াগনস্টিক সেন্টার নেই</h3>
            <p className="text-gray-500">নতুন যোগ করতে উপরের বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ছবি</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">নাম</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ধরণ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">জেলা</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ফোন</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">সক্রিয়</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">হোম ফিচার</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {hospitals.map(hospital => (
                    <tr key={hospital.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {hospital.image_url ? (
                          <img 
                            src={hospital.image_url} 
                            alt={hospital.name}
                            className="w-16 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{hospital.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          hospital.type === 'diagnostic' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {hospital.type === 'diagnostic' ? 'ডায়াগনস্টিক' : 'হাসপাতাল'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{hospital.district}</td>
                      <td className="px-6 py-4 text-gray-600">{hospital.phone || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActive(hospital)}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            hospital.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                            hospital.is_active ? 'translate-x-5' : 'translate-x-1'
                          }`}></div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleFeatured(hospital)}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            hospital.is_featured_home ? 'bg-purple-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                            hospital.is_featured_home ? 'translate-x-5' : 'translate-x-1'
                          }`}></div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(hospital)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="সম্পাদনা"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(hospital.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="মুছে ফেলুন"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editingHospital ? 'সম্পাদনা করুন' : 'নতুন যোগ করুন'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="হাসপাতাল/ডায়াগনস্টিক সেন্টারের নাম"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ধরণ *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {hospitalTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">জেলা *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ফোন</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="০১XXXXXXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ইমেইল</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="example@hospital.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ওয়েবসাইট</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ঠিকানা</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="সম্পূর্ণ ঠিকানা"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">বিবরণ</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  placeholder="হাসপাতাল/ডায়াগনস্টিক সেন্টার সম্পর্কে সংক্ষিপ্ত বিবরণ"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ছবির URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ম্যাপ ছবির URL</label>
                <input
                  type="url"
                  value={formData.map_image_url}
                  onChange={(e) => setFormData({...formData, map_image_url: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/map-image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">গুগল ম্যাপ থেকে স্ক্রিনশট বা লোকেশনের ছবি</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">সেবাসমূহ (কমা দিয়ে আলাদা)</label>
                  <input
                    type="text"
                    value={formData.services}
                    onChange={(e) => setFormData({...formData, services: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="সার্জারি, আইসিইউ, এক্স-রে"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">সুবিধাসমূহ (কমা দিয়ে আলাদা)</label>
                  <input
                    type="text"
                    value={formData.facilities}
                    onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="পার্কিং, ক্যান্টিন, ফার্মেসি"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">খোলার সময়</label>
                  <input
                    type="text"
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({...formData, opening_hours: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="সকাল ৮টা - রাত ১০টা"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">প্রদর্শন ক্রম</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  সংশ্লিষ্ট ডাক্তারগণ
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  এই হাসপাতাল/ডায়াগনস্টিক সেন্টারে যে ডাক্তারগণ নিয়মিত রোগী দেখেন তাদের সংযুক্ত করুন
                </p>
                
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => {
                      setDoctorSearch(e.target.value)
                      searchDoctors(e.target.value)
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ডাক্তারের নাম লিখুন..."
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    </div>
                  )}
                  
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map(doctor => (
                        <button
                          key={doctor.id}
                          type="button"
                          onClick={() => addLinkedDoctor(doctor)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left"
                        >
                          {doctor.image_url ? (
                            <img 
                              src={doctor.image_url} 
                              alt={doctor.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{doctor.name}</p>
                            <p className="text-xs text-gray-500">{doctor.category_name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {linkedDoctors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 mb-2">সংযুক্ত ডাক্তারগণ ({linkedDoctors.length})</p>
                    {linkedDoctors.map(doctor => (
                      <div 
                        key={doctor.id}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl ${doctor.is_active !== false ? 'bg-purple-50' : 'bg-gray-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          {doctor.image_url ? (
                            <img 
                              src={doctor.image_url} 
                              alt={doctor.name}
                              className={`w-10 h-10 rounded-full object-cover ${doctor.is_active === false ? 'opacity-50' : ''}`}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${doctor.is_active !== false ? 'bg-purple-200' : 'bg-gray-200'}`}>
                              <svg className={`w-5 h-5 ${doctor.is_active !== false ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${doctor.is_active !== false ? 'text-gray-800' : 'text-gray-500'}`}>{doctor.name}</p>
                              {doctor.is_active === false && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">নিষ্ক্রিয়</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{doctor.degrees || doctor.category_name}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLinkedDoctor(doctor.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="সরিয়ে ফেলুন"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">সক্রিয়</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured_home}
                    onChange={(e) => setFormData({...formData, is_featured_home: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">হোম পেজে দেখান</span>
                </label>
              </div>
              
              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                >
                  {editingHospital ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminHospitals
