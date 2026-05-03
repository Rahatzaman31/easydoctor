import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

const themeOptions = [
  { id: 'congratulation', name: 'অভিনন্দন', description: 'ডাক্তারের প্রমোশন বা ভালো খবর', icon: '🎉', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'mourning', name: 'শোক সংবাদ', description: 'গুরুত্বপূর্ণ ব্যক্তির মৃত্যু সংবাদ', icon: '🕯️', color: 'bg-gray-100 text-gray-800' },
  { id: 'new_chamber', name: 'নতুন চেম্বার', description: 'ডাক্তারের চেম্বার পরিবর্তন', icon: '🏥', color: 'bg-blue-100 text-blue-800' },
  { id: 'promotion', name: 'প্রোফাইল প্রমোশন', description: 'হাসপাতাল, ডায়াগনস্টিক প্রমোশন', icon: '📢', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'custom_banner', name: 'কাস্টম ব্যানার', description: 'নিজস্ব ডিজাইন করা ব্যানার ইমেজ', icon: '🖼️', color: 'bg-purple-100 text-purple-800' },
]

const entityTypeOptions = [
  { id: '', name: 'কোনোটি নয়' },
  { id: 'doctor', name: 'ডাক্তার' },
  { id: 'hospital', name: 'হাসপাতাল' },
  { id: 'diagnostic', name: 'ডায়াগনস্টিক সেন্টার' },
  { id: 'general', name: 'সাধারণ' },
]

const defaultBanner = {
  title: '',
  subtitle: '',
  image_url: '',
  theme_type: 'promotion',
  detailed_title: '',
  detailed_content: '',
  detailed_image_url: '',
  button_text: 'বিস্তারিত জানুন',
  enable_details_button: true,
  external_link: '',
  use_external_link: false,
  related_entity_type: '',
  related_entity_name: '',
  display_order: 0,
  is_active: true,
  start_date: '',
  end_date: '',
  custom_banner_desktop_url: '',
  custom_banner_mobile_url: '',
  is_custom_banner: false
}

function AdminPromotionalBanners() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState(defaultBanner)
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchBanners()
  }, [navigate])

  async function fetchBanners() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
      setMessage({ type: 'error', text: 'ব্যানার লোড করতে সমস্যা হয়েছে' })
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(banner) {
    setEditingBanner(banner)
    setFormData({
      ...defaultBanner,
      ...banner,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
    })
    setShowForm(true)
    setActiveTab('basic')
  }

  function handleNew() {
    setEditingBanner(null)
    setFormData(defaultBanner)
    setShowForm(true)
    setActiveTab('basic')
  }

  async function handleSave() {
    if (!formData.title) {
      setMessage({ type: 'error', text: 'শিরোনাম দিন' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const bannerData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        updated_at: new Date().toISOString()
      }

      if (editingBanner) {
        const { error } = await supabase
          .from('promotional_banners')
          .update(bannerData)
          .eq('id', editingBanner.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'ব্যানার আপডেট হয়েছে' })
      } else {
        const { error } = await supabase
          .from('promotional_banners')
          .insert([bannerData])

        if (error) throw error
        setMessage({ type: 'success', text: 'নতুন ব্যানার যোগ হয়েছে' })
      }

      setShowForm(false)
      fetchBanners()
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'সংরক্ষণে সমস্যা হয়েছে' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('আপনি কি নিশ্চিত এই ব্যানারটি মুছে ফেলতে চান?')) return

    try {
      const { error } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMessage({ type: 'success', text: 'ব্যানার মুছে ফেলা হয়েছে' })
      fetchBanners()
    } catch (error) {
      console.error('Delete error:', error)
      setMessage({ type: 'error', text: 'মুছতে সমস্যা হয়েছে' })
    }
  }

  async function toggleActive(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('promotional_banners')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      fetchBanners()
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">প্রোমোশনাল ব্যানার</h1>
            <p className="text-gray-600 mt-1">হোম পেজের প্রোমোশনাল ব্যানার ম্যানেজ করুন</p>
          </div>
          <button
            onClick={handleNew}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            নতুন ব্যানার
          </button>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingBanner ? 'ব্যানার সম্পাদনা' : 'নতুন ব্যানার তৈরি'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="border-b">
              <nav className="flex gap-1 px-6">
                {[
                  { id: 'basic', label: 'মৌলিক তথ্য' },
                  { id: 'details', label: 'বিস্তারিত কন্টেন্ট' },
                  { id: 'settings', label: 'সেটিংস' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">থিম নির্বাচন করুন</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {themeOptions.map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            theme_type: theme.id,
                            is_custom_banner: theme.id === 'custom_banner'
                          }))}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            formData.theme_type === theme.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl mb-2 block">{theme.icon}</span>
                          <span className="font-medium text-gray-800 block">{theme.name}</span>
                          <span className="text-xs text-gray-500">{theme.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="input-field"
                        placeholder="ব্যানারের শিরোনাম"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ছবির URL</label>
                      <input
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        className="input-field"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">সাবটাইটেল</label>
                    <textarea
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      rows={2}
                      className="input-field"
                      placeholder="সংক্ষিপ্ত বিবরণ"
                    />
                  </div>

                  {formData.image_url && formData.theme_type !== 'custom_banner' && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">ছবির প্রিভিউ:</p>
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className={`w-24 h-24 object-cover rounded-lg ${formData.theme_type === 'mourning' ? 'grayscale' : ''}`}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}

                  {formData.theme_type === 'custom_banner' && (
                    <div className="bg-purple-50 rounded-xl p-6 space-y-6 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xl text-white">🖼️</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-900 text-lg">কাস্টম ব্যানার ইমেজ সেটিংস</h3>
                          <p className="text-purple-700 text-sm mt-1">
                            আপনার গ্রাফিক ডিজাইনার কর্তৃক তৈরি করা ইমেজ URL দিন। ডেক্সটপ ও মোবাইলের জন্য আলাদা রেসপন্সিভ ইমেজ আপলোড করুন।
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-purple-800 mb-1">ডেক্সটপ ব্যানার ইমেজ URL *</label>
                          <input
                            type="text"
                            value={formData.custom_banner_desktop_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_banner_desktop_url: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="https://example.com/desktop-banner.jpg"
                          />
                          <p className="text-xs text-purple-600 mt-1">ডেক্সটপ/ল্যাপটপে দেখানো হবে</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-purple-800 mb-1">মোবাইল ব্যানার ইমেজ URL *</label>
                          <input
                            type="text"
                            value={formData.custom_banner_mobile_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_banner_mobile_url: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="https://example.com/mobile-banner.jpg"
                          />
                          <p className="text-xs text-purple-600 mt-1">মোবাইল/ট্যাবলেটে দেখানো হবে</p>
                        </div>
                      </div>

                      {(formData.custom_banner_desktop_url || formData.custom_banner_mobile_url) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-200">
                          {formData.custom_banner_desktop_url && (
                            <div>
                              <p className="text-sm font-medium text-purple-800 mb-2">ডেক্সটপ প্রিভিউ:</p>
                              <div className="relative aspect-[3/1] bg-purple-100 rounded-lg overflow-hidden">
                                <img 
                                  src={formData.custom_banner_desktop_url} 
                                  alt="Desktop Preview" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {e.target.style.display = 'none'}}
                                />
                              </div>
                            </div>
                          )}
                          {formData.custom_banner_mobile_url && (
                            <div>
                              <p className="text-sm font-medium text-purple-800 mb-2">মোবাইল প্রিভিউ:</p>
                              <div className="relative aspect-[16/9] bg-purple-100 rounded-lg overflow-hidden max-w-[200px]">
                                <img 
                                  src={formData.custom_banner_mobile_url} 
                                  alt="Mobile Preview" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {e.target.style.display = 'none'}}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          কাস্টম ব্যানার ইমেজ নির্দেশিকা
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                              <div>
                                <p className="font-medium text-gray-700">ডেক্সটপ ব্যানার সাইজ</p>
                                <p className="text-gray-500">প্রস্থ: <span className="font-mono bg-gray-100 px-1 rounded">1200px</span> x উচ্চতা: <span className="font-mono bg-gray-100 px-1 rounded">400px</span></p>
                                <p className="text-gray-400 text-xs">রেশিও: 3:1 (ল্যান্ডস্কেপ)</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                              <div>
                                <p className="font-medium text-gray-700">মোবাইল ব্যানার সাইজ</p>
                                <p className="text-gray-500">প্রস্থ: <span className="font-mono bg-gray-100 px-1 rounded">600px</span> x উচ্চতা: <span className="font-mono bg-gray-100 px-1 rounded">400px</span></p>
                                <p className="text-gray-400 text-xs">রেশিও: 3:2 (স্কয়ার-ইশ)</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                              <div>
                                <p className="font-medium text-gray-700">ফাইল ফরম্যাট</p>
                                <p className="text-gray-500">JPG, PNG, বা WebP</p>
                                <p className="text-gray-400 text-xs">সর্বোচ্চ ফাইল সাইজ: 2MB</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                              <div>
                                <p className="font-medium text-gray-700">গুরুত্বপূর্ণ টিপস</p>
                                <p className="text-gray-500">ইমেজে টেক্সট সেন্টারে রাখুন</p>
                                <p className="text-gray-400 text-xs">প্রান্তে ১০% মার্জিন রাখুন</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>নোট:</strong> কাস্টম ব্যানার পুরো স্থান জুড়ে দেখানো হবে। ইমেজে যা থাকবে সেটাই সরাসরি প্রদর্শিত হবে। তাই ইমেজ তৈরির সময় সব তথ্য (লোগো, নাম, বার্তা, যোগাযোগ) ইমেজের মধ্যেই রাখুন।
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত পেজের শিরোনাম</label>
                    <input
                      type="text"
                      value={formData.detailed_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, detailed_title: e.target.value }))}
                      className="input-field"
                      placeholder="বিস্তারিত পেজের জন্য আলাদা শিরোনাম (ঐচ্ছিক)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত কন্টেন্ট</label>
                    <textarea
                      value={formData.detailed_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, detailed_content: e.target.value }))}
                      rows={8}
                      className="input-field"
                      placeholder="বিস্তারিত তথ্য লিখুন..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত পেজের ছবির URL</label>
                    <input
                      type="text"
                      value={formData.detailed_image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, detailed_image_url: e.target.value }))}
                      className="input-field"
                      placeholder="https://example.com/detail-image.jpg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">সংশ্লিষ্ট ধরন</label>
                      <select
                        value={formData.related_entity_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, related_entity_type: e.target.value }))}
                        className="input-field"
                      >
                        {entityTypeOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">সংশ্লিষ্ট নাম</label>
                      <input
                        type="text"
                        value={formData.related_entity_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, related_entity_name: e.target.value }))}
                        className="input-field"
                        placeholder="যেমন: ডাঃ মোহাম্মদ রহিম"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">বাটন টেক্সট</label>
                      <input
                        type="text"
                        value={formData.button_text}
                        onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ডিসপ্লে অর্ডার</label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enable_details_button}
                        onChange={(e) => setFormData(prev => ({ ...prev, enable_details_button: e.target.checked }))}
                        className="w-5 h-5 rounded text-primary-600"
                      />
                      <span className="text-sm font-medium text-gray-700">"বিস্তারিত জানুন" বাটন দেখান</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_external_link}
                        onChange={(e) => setFormData(prev => ({ ...prev, use_external_link: e.target.checked }))}
                        className="w-5 h-5 rounded text-primary-600"
                      />
                      <span className="text-sm font-medium text-gray-700">বাহ্যিক লিংক ব্যবহার করুন</span>
                    </label>

                    {formData.use_external_link && (
                      <div className="ml-8">
                        <input
                          type="text"
                          value={formData.external_link}
                          onChange={(e) => setFormData(prev => ({ ...prev, external_link: e.target.value }))}
                          className="input-field"
                          placeholder="https://example.com/page"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">শুরুর তারিখ (ঐচ্ছিক)</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">শেষের তারিখ (ঐচ্ছিক)</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">ব্যানার সক্রিয়</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    সংরক্ষণ করুন
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ব্যানার</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">থিম</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      কোনো প্রোমোশনাল ব্যানার নেই
                    </td>
                  </tr>
                ) : (
                  banners.map(banner => {
                    const theme = themeOptions.find(t => t.id === banner.theme_type) || themeOptions[3]
                    return (
                      <tr key={banner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {banner.image_url ? (
                              <img 
                                src={banner.image_url} 
                                alt={banner.title}
                                className={`w-12 h-12 object-cover rounded-lg ${banner.theme_type === 'mourning' ? 'grayscale' : ''}`}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                {theme.icon}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{banner.title}</p>
                              {banner.subtitle && (
                                <p className="text-sm text-gray-500 line-clamp-1">{banner.subtitle}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${theme.color}`}>
                            <span>{theme.icon}</span>
                            {theme.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleActive(banner.id, banner.is_active)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                              banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${banner.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {banner.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(banner)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="সম্পাদনা"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(banner.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="মুছুন"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPromotionalBanners
