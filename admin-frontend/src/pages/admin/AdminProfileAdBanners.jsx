import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminProfileAdBanners() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState([])
  const [doctors, setDoctors] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categoryDoctors, setCategoryDoctors] = useState([])
  const [selectedDoctorIds, setSelectedDoctorIds] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchData()
  }, [navigate])

  useEffect(() => {
    if (selectedCategory) {
      const filtered = doctors.filter(d => d.category === selectedCategory)
      setCategoryDoctors(filtered)
    } else {
      setCategoryDoctors([])
    }
  }, [selectedCategory, doctors])

  async function fetchData() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const [bannersRes, doctorsRes, categoriesRes] = await Promise.all([
        supabase.from('profile_ad_banners').select('*').order('sort_order', { ascending: true }),
        supabase.from('doctors').select('id, name, category, category_name').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').order('name')
      ])

      if (bannersRes.data) {
        const bannersWithDoctors = await Promise.all(
          bannersRes.data.map(async (banner) => {
            const { data: bannerDoctors } = await supabase
              .from('profile_ad_banner_doctors')
              .select('doctor_id')
              .eq('banner_id', banner.id)
            return {
              ...banner,
              doctor_ids: bannerDoctors?.map(d => d.doctor_id) || []
            }
          })
        )
        setBanners(bannersWithDoctors)
      }
      
      setDoctors(doctorsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(banner = null) {
    if (banner) {
      setEditingBanner({
        id: banner.id,
        title: banner.title,
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        is_active: banner.is_active,
        sort_order: banner.sort_order
      })
      setSelectedDoctorIds(banner.doctor_ids || [])
      if (banner.doctor_ids?.length > 0) {
        const firstDoctor = doctors.find(d => d.id === banner.doctor_ids[0])
        setSelectedCategory(firstDoctor?.category || '')
      }
    } else {
      setEditingBanner({
        title: '',
        image_url: '',
        link_url: '',
        is_active: true,
        sort_order: banners.length
      })
      setSelectedDoctorIds([])
      setSelectedCategory('')
    }
    setShowModal(true)
  }

  function toggleDoctor(doctorId) {
    setSelectedDoctorIds(prev => {
      if (prev.includes(doctorId)) {
        return prev.filter(id => id !== doctorId)
      }
      return [...prev, doctorId]
    })
  }

  function selectAllCategoryDoctors() {
    const categoryDoctorIds = categoryDoctors.map(d => d.id)
    setSelectedDoctorIds(prev => {
      const otherIds = prev.filter(id => !categoryDoctorIds.includes(id))
      return [...otherIds, ...categoryDoctorIds]
    })
  }

  function deselectAllCategoryDoctors() {
    const categoryDoctorIds = categoryDoctors.map(d => d.id)
    setSelectedDoctorIds(prev => prev.filter(id => !categoryDoctorIds.includes(id)))
  }

  async function handleSave() {
    if (!editingBanner.title || !editingBanner.image_url) {
      setMessage({ type: 'error', text: 'শিরোনাম এবং ইমেজ URL আবশ্যক' })
      return
    }

    if (selectedDoctorIds.length === 0) {
      setMessage({ type: 'error', text: 'অন্তত একজন ডাক্তার সিলেক্ট করুন' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      if (!supabase || !isConfigured) {
        setMessage({ type: 'error', text: 'ডাটাবেস সংযোগ নেই' })
        return
      }

      let bannerId = editingBanner.id

      if (editingBanner.id) {
        const { error } = await supabase
          .from('profile_ad_banners')
          .update({
            title: editingBanner.title,
            image_url: editingBanner.image_url,
            link_url: editingBanner.link_url || null,
            is_active: editingBanner.is_active,
            sort_order: editingBanner.sort_order
          })
          .eq('id', editingBanner.id)
        if (error) throw error

        await supabase
          .from('profile_ad_banner_doctors')
          .delete()
          .eq('banner_id', editingBanner.id)
      } else {
        const { data, error } = await supabase
          .from('profile_ad_banners')
          .insert([{
            title: editingBanner.title,
            image_url: editingBanner.image_url,
            link_url: editingBanner.link_url || null,
            is_active: editingBanner.is_active,
            sort_order: editingBanner.sort_order
          }])
          .select()
          .single()
        if (error) throw error
        bannerId = data.id
      }

      if (selectedDoctorIds.length > 0) {
        const doctorInserts = selectedDoctorIds.map(doctorId => ({
          banner_id: bannerId,
          doctor_id: doctorId
        }))
        const { error: doctorError } = await supabase
          .from('profile_ad_banner_doctors')
          .insert(doctorInserts)
        if (doctorError) throw doctorError
      }

      setMessage({ type: 'success', text: 'সফলভাবে সংরক্ষণ করা হয়েছে' })
      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(banner) {
    if (!confirm(`"${banner.title}" ব্যানারটি মুছে ফেলতে চান?`)) return

    try {
      if (!supabase || !isConfigured) return

      const { error } = await supabase
        .from('profile_ad_banners')
        .delete()
        .eq('id', banner.id)
      
      if (error) throw error
      setMessage({ type: 'success', text: 'ব্যানার মুছে ফেলা হয়েছে' })
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: 'মুছে ফেলতে সমস্যা হয়েছে' })
    }
  }

  async function toggleActive(banner) {
    try {
      if (!supabase || !isConfigured) return

      const { error } = await supabase
        .from('profile_ad_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id)
      
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">বিজ্ঞাপন ব্যানার</h1>
              <p className="text-gray-600 mt-1">ডাক্তার প্রোফাইলে প্রদর্শিত বিজ্ঞাপন ব্যানার পরিচালনা করুন</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              নতুন ব্যানার
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">ব্যানার সাইজ সুপারিশ:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• সাইজ: <strong>728 x 90 px</strong> (স্ট্যান্ডার্ড লিডারবোর্ড)</li>
              <li>• বা: <strong>970 x 90 px</strong> (বড় লিডারবোর্ড)</li>
              <li>• ফরম্যাট: JPG, PNG, WebP</li>
              <li>• ফাইল সাইজ: সর্বোচ্চ 150KB</li>
            </ul>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {banners.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg">কোনো বিজ্ঞাপন ব্যানার নেই</p>
              <p className="text-gray-400 text-sm mt-1">নতুন ব্যানার যোগ করুন</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map(banner => (
                <div key={banner.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border ${banner.is_active ? 'border-green-200' : 'border-gray-200'}`}>
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-80 h-24 bg-gray-100 flex-shrink-0">
                      <img 
                        src={banner.image_url} 
                        alt={banner.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{banner.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {banner.doctor_ids?.length || 0} জন ডাক্তারের প্রোফাইলে দেখাবে
                          </p>
                          {banner.link_url && (
                            <p className="text-xs text-primary-600 mt-1 truncate max-w-md">{banner.link_url}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(banner)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              banner.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {banner.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openModal(banner)}
                          className="px-3 py-1.5 text-sm border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                        >
                          সম্পাদনা
                        </button>
                        <button
                          onClick={() => handleDelete(banner)}
                          className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          মুছুন
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && editingBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-8">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editingBanner.id ? 'ব্যানার সম্পাদনা' : 'নতুন ব্যানার'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
                <input
                  type="text"
                  value={editingBanner.title}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="ব্যানারের শিরোনাম"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ইমেজ URL *</label>
                <input
                  type="url"
                  value={editingBanner.image_url}
                  onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/banner.jpg"
                />
                {editingBanner.image_url && (
                  <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                    <img 
                      src={editingBanner.image_url} 
                      alt="Preview"
                      className="max-h-24 object-contain mx-auto"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">লিংক URL (ঐচ্ছিক)</label>
                <input
                  type="url"
                  value={editingBanner.link_url}
                  onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/landing-page"
                />
                <p className="text-xs text-gray-500 mt-1">ব্যানারে ক্লিক করলে এই পেজে যাবে</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ক্রম</label>
                  <input
                    type="number"
                    value={editingBanner.sort_order}
                    onChange={(e) => setEditingBanner({ ...editingBanner, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBanner.is_active}
                      onChange={(e) => setEditingBanner({ ...editingBanner, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-gray-700">সক্রিয়</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">ডাক্তার সিলেক্ট করুন *</label>
                
                <div className="mb-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- ক্যাটেগরি সিলেক্ট করুন --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {selectedCategory && categoryDoctors.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-600">{categoryDoctors.length} জন ডাক্তার</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllCategoryDoctors}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          সব সিলেক্ট
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={deselectAllCategoryDoctors}
                          className="text-xs text-red-600 hover:underline"
                        >
                          সব বাতিল
                        </button>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {categoryDoctors.map(doctor => (
                        <label key={doctor.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                          <input
                            type="checkbox"
                            checked={selectedDoctorIds.includes(doctor.id)}
                            onChange={() => toggleDoctor(doctor.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                          />
                          <span className="text-gray-700 text-sm">{doctor.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDoctorIds.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>{selectedDoctorIds.length}</strong> জন ডাক্তার সিলেক্ট করা হয়েছে
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProfileAdBanners
