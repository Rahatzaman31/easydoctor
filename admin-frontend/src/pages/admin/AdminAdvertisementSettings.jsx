import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

const API_URL = import.meta.env.VITE_API_URL || '';

function AdminAdvertisementSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adTypes, setAdTypes] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editType, setEditType] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn')
    if (!loggedIn) {
      navigate('/admin/login')
      return
    }
    fetchAdSettings()
  }, [navigate])

  async function fetchAdSettings() {
    try {
      const response = await fetch(`${API_URL}/api/advertisement-settings`)
      const result = await response.json()

      if (result.success) {
        setAdTypes(result.data || [])
        if (result.data?.length > 0 && !activeTab) {
          setActiveTab(result.data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching ad settings:', err)
      setMessage({ type: 'error', text: 'সেটিংস লোড করতে সমস্যা হয়েছে' })
    } finally {
      setLoading(false)
    }
  }

  function getActiveAdType() {
    return adTypes.find(at => at.id === activeTab)
  }

  function openEditModal(type, item = null) {
    setEditType(type)
    if (item) {
      setEditingItem({ ...item })
    } else {
      const adType = getActiveAdType()
      if (type === 'pricing') {
        setEditingItem({
          ad_type_id: adType.id,
          days: '',
          price: '',
          label: '',
          sort_order: (adType.pricing?.length || 0) + 1,
          is_active: true
        })
      } else if (type === 'category') {
        setEditingItem({
          ad_type_id: adType.id,
          category_id: '',
          name: '',
          icon: '',
          sort_order: (adType.categories?.length || 0) + 1,
          is_active: true
        })
      } else if (type === 'facility') {
        setEditingItem({
          ad_type_id: adType.id,
          facility_text: '',
          sort_order: (adType.facilities?.length || 0) + 1
        })
      } else if (type === 'ad_type') {
        setEditingItem({
          type_id: '',
          name: '',
          description: '',
          icon: '',
          has_categories: false,
          sort_order: adTypes.length + 1,
          is_active: true
        })
      }
    }
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const adminAuthStr = sessionStorage.getItem('adminAuth')
      if (!adminAuthStr) {
        setMessage({ type: 'error', text: 'সেশন মেয়াদ শেষ। পুনরায় লগইন করুন।' })
        setSaving(false)
        navigate('/admin/login')
        return
      }

      const adminAuth = JSON.parse(adminAuthStr)

      const response = await fetch(`${API_URL}/api/advertisement-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editType,
          data: editingItem,
          adminAuth
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setShowModal(false)
        fetchAdSettings()
      } else {
        setMessage({ type: 'error', text: result.message || 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }
    } catch (err) {
      console.error('Error saving:', err)
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(type, item) {
    const confirmMsg = type === 'pricing' ? 'এই মূল্য অপশন' : 
                       type === 'category' ? 'এই ক্যাটেগরি' : 
                       type === 'facility' ? 'এই সুবিধা' : 'এই বিজ্ঞাপন টাইপ'
    
    if (!confirm(`${confirmMsg} মুছে ফেলতে চান?`)) return

    try {
      const adminAuthStr = sessionStorage.getItem('adminAuth')
      if (!adminAuthStr) {
        setMessage({ type: 'error', text: 'সেশন মেয়াদ শেষ। পুনরায় লগইন করুন।' })
        navigate('/admin/login')
        return
      }

      const adminAuth = JSON.parse(adminAuthStr)

      const response = await fetch(`${API_URL}/api/advertisement-settings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          id: item.id,
          adminAuth
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'মুছে ফেলা হয়েছে' })
        fetchAdSettings()
      } else {
        setMessage({ type: 'error', text: result.message || 'মুছে ফেলতে সমস্যা হয়েছে' })
      }
    } catch (err) {
      console.error('Error deleting:', err)
      setMessage({ type: 'error', text: 'মুছে ফেলতে সমস্যা হয়েছে' })
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

  const activeAdType = getActiveAdType()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">বিজ্ঞাপন সেটিংস</h1>
              <p className="text-gray-600 mt-1">ডাক্তারদের বিজ্ঞাপন মূল্য ও অপশন পরিচালনা করুন</p>
            </div>
            <button
              onClick={() => openEditModal('ad_type')}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              নতুন টাইপ
            </button>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {adTypes.map(at => (
              <button
                key={at.id}
                onClick={() => setActiveTab(at.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === at.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                <span className="mr-2">{at.icon}</span>
                {at.name}
              </button>
            ))}
          </div>

          {activeAdType && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span>{activeAdType.icon}</span>
                      {activeAdType.name}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{activeAdType.description}</p>
                  </div>
                  <button
                    onClick={() => openEditModal('ad_type', activeAdType)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    সম্পাদনা
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">মূল্য তালিকা</h3>
                  <button
                    onClick={() => openEditModal('pricing')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    যোগ করুন
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">লেবেল</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">দিন</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">মূল্য</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">স্ট্যাটাস</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(activeAdType.pricing || []).map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{p.label}</td>
                          <td className="px-4 py-3">{p.days} দিন</td>
                          <td className="px-4 py-3">{p.price} টাকা</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openEditModal('pricing', p)}
                              className="text-primary-600 hover:text-primary-700 mr-3"
                            >
                              সম্পাদনা
                            </button>
                            <button
                              onClick={() => handleDelete('pricing', p)}
                              className="text-red-600 hover:text-red-700"
                            >
                              মুছুন
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(!activeAdType.pricing || activeAdType.pricing.length === 0) && (
                  <p className="text-center text-gray-500 py-4">কোনো মূল্য যোগ করা হয়নি</p>
                )}
              </div>

              {activeAdType.has_categories && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">ক্যাটেগরি সমূহ</h3>
                    <button
                      onClick={() => openEditModal('category')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      যোগ করুন
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(activeAdType.categories || []).map(c => (
                      <div key={c.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{c.icon}</span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">ID: {c.category_id}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal('category', c)}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            সম্পাদনা
                          </button>
                          <button
                            onClick={() => handleDelete('category', c)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            মুছুন
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(!activeAdType.categories || activeAdType.categories.length === 0) && (
                    <p className="text-center text-gray-500 py-4">কোনো ক্যাটেগরি যোগ করা হয়নি</p>
                  )}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">সুবিধা সমূহ</h3>
                  <button
                    onClick={() => openEditModal('facility')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    যোগ করুন
                  </button>
                </div>
                <ul className="space-y-2">
                  {(activeAdType.facilities || []).map(f => (
                    <li key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f.facility_text}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal('facility', f)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          সম্পাদনা
                        </button>
                        <button
                          onClick={() => handleDelete('facility', f)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          মুছুন
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {(!activeAdType.facilities || activeAdType.facilities.length === 0) && (
                  <p className="text-center text-gray-500 py-4">কোনো সুবিধা যোগ করা হয়নি</p>
                )}
              </div>
            </div>
          )}

          {adTypes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">কোনো বিজ্ঞাপন টাইপ নেই। নতুন টাইপ যোগ করুন।</p>
            </div>
          )}
        </div>
      </div>

      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editType === 'ad_type' ? (editingItem.id ? 'বিজ্ঞাপন টাইপ সম্পাদনা' : 'নতুন বিজ্ঞাপন টাইপ') :
                 editType === 'pricing' ? (editingItem.id ? 'মূল্য সম্পাদনা' : 'নতুন মূল্য') :
                 editType === 'category' ? (editingItem.id ? 'ক্যাটেগরি সম্পাদনা' : 'নতুন ক্যাটেগরি') :
                 (editingItem.id ? 'সুবিধা সম্পাদনা' : 'নতুন সুবিধা')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editType === 'ad_type' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">টাইপ আইডি *</label>
                    <input
                      type="text"
                      value={editingItem.type_id}
                      onChange={(e) => setEditingItem({ ...editingItem, type_id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="promotional_banner"
                      disabled={!!editingItem.id}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="প্রোমোশনাল ব্যানার"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
                    <textarea
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">আইকন (ইমোজি)</label>
                    <input
                      type="text"
                      value={editingItem.icon || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="🎉"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingItem.has_categories}
                        onChange={(e) => setEditingItem({ ...editingItem, has_categories: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600"
                      />
                      <span className="text-gray-700">ক্যাটেগরি আছে</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingItem.is_active}
                        onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600"
                      />
                      <span className="text-gray-700">সক্রিয়</span>
                    </label>
                  </div>
                </>
              )}

              {editType === 'pricing' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">লেবেল *</label>
                    <input
                      type="text"
                      value={editingItem.label}
                      onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="৩ দিন"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">দিন *</label>
                      <input
                        type="number"
                        value={editingItem.days}
                        onChange={(e) => setEditingItem({ ...editingItem, days: parseInt(e.target.value) || '' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">মূল্য (টাকা) *</label>
                      <input
                        type="number"
                        value={editingItem.price}
                        onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || '' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="500"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.is_active}
                      onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-gray-700">সক্রিয়</span>
                  </label>
                </>
              )}

              {editType === 'category' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটেগরি আইডি *</label>
                    <input
                      type="text"
                      value={editingItem.category_id}
                      onChange={(e) => setEditingItem({ ...editingItem, category_id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="congratulations"
                      disabled={!!editingItem.id}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="অভিনন্দন"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">আইকন (ইমোজি)</label>
                    <input
                      type="text"
                      value={editingItem.icon || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="🎊"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.is_active}
                      onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-gray-700">সক্রিয়</span>
                  </label>
                </>
              )}

              {editType === 'facility' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সুবিধা *</label>
                  <input
                    type="text"
                    value={editingItem.facility_text}
                    onChange={(e) => setEditingItem({ ...editingItem, facility_text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="হোম পেজে ব্যানার প্রদর্শন"
                  />
                </div>
              )}
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

export default AdminAdvertisementSettings
