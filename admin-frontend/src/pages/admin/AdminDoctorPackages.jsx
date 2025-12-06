import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

function AdminDoctorPackages() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingPackage, setEditingPackage] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const colorOptions = [
    { value: 'gray', from: 'gray-500', to: 'gray-600', border: 'border-gray-300' },
    { value: 'blue', from: 'blue-500', to: 'blue-600', border: 'border-blue-300' },
    { value: 'purple', from: 'purple-500', to: 'purple-600', border: 'border-purple-300' },
    { value: 'teal', from: 'teal-500', to: 'teal-600', border: 'border-teal-300' },
    { value: 'green', from: 'green-500', to: 'green-600', border: 'border-green-300' },
    { value: 'orange', from: 'orange-500', to: 'orange-600', border: 'border-orange-300' },
    { value: 'red', from: 'red-500', to: 'red-600', border: 'border-red-300' },
    { value: 'pink', from: 'pink-500', to: 'pink-600', border: 'border-pink-300' },
  ]

  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn')
    if (!loggedIn) {
      navigate('/admin/login')
      return
    }
    fetchPackages()
  }, [navigate])

  async function fetchPackages() {
    try {
      const response = await fetch('/api/doctor-packages')
      const result = await response.json()

      if (result.success) {
        setPackages(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching packages:', err)
      setMessage({ type: 'error', text: 'প্যাকেজ লোড করতে সমস্যা হয়েছে' })
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(pkg = null) {
    if (pkg) {
      setEditingPackage({
        ...pkg,
        features: pkg.features || []
      })
    } else {
      setEditingPackage({
        package_id: '',
        name: '',
        price_display: '',
        price_value: 0,
        is_default: false,
        duration: '',
        color_from: 'gray-500',
        color_to: 'gray-600',
        border_color: 'border-gray-300',
        badge: '',
        sort_order: packages.length + 1,
        is_active: true,
        features: []
      })
    }
    setShowModal(true)
  }

  function handleColorChange(colorValue) {
    const color = colorOptions.find(c => c.value === colorValue)
    if (color) {
      setEditingPackage({
        ...editingPackage,
        color_from: color.from,
        color_to: color.to,
        border_color: color.border
      })
    }
  }

  function getColorValue() {
    const color = colorOptions.find(c => c.from === editingPackage?.color_from)
    return color?.value || 'gray'
  }

  function addFeature() {
    setEditingPackage({
      ...editingPackage,
      features: [...editingPackage.features, { label: '', value: '', sort_order: editingPackage.features.length + 1 }]
    })
  }

  function updateFeature(index, field, value) {
    const updated = [...editingPackage.features]
    updated[index][field] = value
    setEditingPackage({ ...editingPackage, features: updated })
  }

  function removeFeature(index) {
    const updated = editingPackage.features.filter((_, i) => i !== index)
    setEditingPackage({ ...editingPackage, features: updated })
  }

  async function handleSave() {
    if (!editingPackage.package_id || !editingPackage.name || !editingPackage.price_display) {
      setMessage({ type: 'error', text: 'প্যাকেজ আইডি, নাম এবং মূল্য আবশ্যক' })
      return
    }

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

      const response = await fetch('/api/doctor-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingPackage,
          adminAuth
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setShowModal(false)
        fetchPackages()
      } else {
        setMessage({ type: 'error', text: result.message || 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }
    } catch (err) {
      console.error('Error saving package:', err)
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(pkg) {
    if (!confirm(`"${pkg.name}" প্যাকেজটি মুছে ফেলতে চান?`)) return

    try {
      const adminAuthStr = sessionStorage.getItem('adminAuth')
      if (!adminAuthStr) {
        setMessage({ type: 'error', text: 'সেশন মেয়াদ শেষ। পুনরায় লগইন করুন।' })
        navigate('/admin/login')
        return
      }

      const adminAuth = JSON.parse(adminAuthStr)

      const response = await fetch(`/api/doctor-packages/${pkg.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminAuth })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'প্যাকেজ মুছে ফেলা হয়েছে' })
        fetchPackages()
      } else {
        setMessage({ type: 'error', text: result.message || 'মুছে ফেলতে সমস্যা হয়েছে' })
      }
    } catch (err) {
      console.error('Error deleting package:', err)
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">ডাক্তার প্যাকেজ</h1>
              <p className="text-gray-600 mt-1">ডাক্তারদের জন্য প্যাকেজ সেটিংস পরিচালনা করুন</p>
            </div>
            <button
              onClick={() => openEditModal()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              নতুন প্যাকেজ
            </button>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${pkg.border_color} ${!pkg.is_active ? 'opacity-60' : ''}`}
              >
                <div className={`bg-gradient-to-r from-${pkg.color_from} to-${pkg.color_to} p-6 text-white relative`}>
                  {pkg.badge && (
                    <span className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                      {pkg.badge}
                    </span>
                  )}
                  {!pkg.is_active && (
                    <span className="absolute top-4 left-4 bg-red-500 px-2 py-1 rounded-full text-xs font-medium">
                      নিষ্ক্রিয়
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{pkg.name}</h3>
                  <p className="text-3xl font-bold mt-2">{pkg.price_display}</p>
                  {pkg.duration && <p className="text-white/80 text-sm">{pkg.duration}</p>}
                </div>
                
                <div className="p-6">
                  <p className="text-xs text-gray-500 mb-3">ID: {pkg.package_id}</p>
                  <ul className="space-y-3 mb-4">
                    {(pkg.features || []).map((feature, idx) => (
                      <li key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{feature.label}</span>
                        <span className="font-semibold text-gray-800">{feature.value}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
                    >
                      সম্পাদনা
                    </button>
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="py-2 px-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {packages.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">কোনো প্যাকেজ নেই। নতুন প্যাকেজ যোগ করুন।</p>
            </div>
          )}
        </div>
      </div>

      {showModal && editingPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPackage.id ? 'প্যাকেজ সম্পাদনা' : 'নতুন প্যাকেজ'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">প্যাকেজ আইডি *</label>
                  <input
                    type="text"
                    value={editingPackage.package_id}
                    onChange={(e) => setEditingPackage({ ...editingPackage, package_id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="standard"
                    disabled={!!editingPackage.id}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                  <input
                    type="text"
                    value={editingPackage.name}
                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="স্ট্যান্ডার্ড প্যাকেজ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">প্রদর্শিত মূল্য *</label>
                  <input
                    type="text"
                    value={editingPackage.price_display}
                    onChange={(e) => setEditingPackage({ ...editingPackage, price_display: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="৫০০ টাকা"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">মূল্য (সংখ্যা)</label>
                  <input
                    type="number"
                    value={editingPackage.price_value}
                    onChange={(e) => setEditingPackage({ ...editingPackage, price_value: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সময়কাল</label>
                  <input
                    type="text"
                    value={editingPackage.duration || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="মাসিক"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ব্যাজ</label>
                  <input
                    type="text"
                    value={editingPackage.badge || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, badge: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="জনপ্রিয়"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রঙ</label>
                  <select
                    value={getColorValue()}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {colorOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ক্রম</label>
                  <input
                    type="number"
                    value={editingPackage.sort_order}
                    onChange={(e) => setEditingPackage({ ...editingPackage, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPackage.is_default}
                    onChange={(e) => setEditingPackage({ ...editingPackage, is_default: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-gray-700">ডিফল্ট প্যাকেজ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPackage.is_active}
                    onChange={(e) => setEditingPackage({ ...editingPackage, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-gray-700">সক্রিয়</span>
                </label>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">ফিচারসমূহ</label>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ফিচার যোগ করুন
                  </button>
                </div>
                <div className="space-y-2">
                  {editingPackage.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature.label}
                        onChange={(e) => updateFeature(index, 'label', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="লেবেল (যেমন: রেটিং)"
                      />
                      <input
                        type="text"
                        value={feature.value}
                        onChange={(e) => updateFeature(index, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="মান (যেমন: 4.8)"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
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

export default AdminDoctorPackages
