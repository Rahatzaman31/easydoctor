import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { supabase, isConfigured } from '../../lib/supabase'

const defaultPages = [
  { page_identifier: 'home', page_name: 'হোম পেজ', priority: 1.0, change_frequency: 'daily' },
  { page_identifier: 'specialist-doctors', page_name: 'বিশেষজ্ঞ ডাক্তার', priority: 0.9, change_frequency: 'daily' },
  { page_identifier: 'hospitals-diagnostics', page_name: 'হাসপাতাল ও ডায়াগনস্টিক', priority: 0.8, change_frequency: 'weekly' },
  { page_identifier: 'ambulance', page_name: 'অ্যাম্বুলেন্স সেবা', priority: 0.8, change_frequency: 'weekly' },
  { page_identifier: 'medi-products', page_name: 'মেডি পণ্য', priority: 0.8, change_frequency: 'weekly' },
  { page_identifier: 'blog', page_name: 'ব্লগ', priority: 0.7, change_frequency: 'daily' },
  { page_identifier: 'contact', page_name: 'যোগাযোগ', priority: 0.5, change_frequency: 'monthly' },
  { page_identifier: 'about-us', page_name: 'আমাদের সম্পর্কে', priority: 0.5, change_frequency: 'monthly' },
  { page_identifier: 'download', page_name: 'অ্যাপ ডাউনলোড', priority: 0.6, change_frequency: 'monthly' }
]

const frequencyOptions = [
  { value: 'always', label: 'সর্বদা' },
  { value: 'hourly', label: 'প্রতি ঘণ্টায়' },
  { value: 'daily', label: 'প্রতিদিন' },
  { value: 'weekly', label: 'প্রতি সপ্তাহে' },
  { value: 'monthly', label: 'প্রতি মাসে' },
  { value: 'yearly', label: 'প্রতি বছরে' },
  { value: 'never', label: 'কখনোই না' }
]

function AdminSEO() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pages')
  const [pages, setPages] = useState([])
  const [globalSettings, setGlobalSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPage, setEditingPage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    page_identifier: '',
    page_name: '',
    title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    canonical_url: '',
    no_index: false,
    no_follow: false,
    priority: 0.5,
    change_frequency: 'weekly',
    is_active: true,
    structured_data: ''
  })

  const [globalFormData, setGlobalFormData] = useState({
    site_name: 'ইজি ডক্টর রংপুর',
    site_tagline: 'রংপুরের সেরা ডাক্তার অ্যাপয়েন্টমেন্ট বুকিং সেবা',
    default_meta_description: '',
    default_og_image: '/og-image.png',
    google_analytics_id: '',
    google_search_console_verification: '',
    bing_verification: '',
    facebook_app_id: '',
    twitter_handle: '',
    site_url: '',
    enable_structured_data: true,
    enable_sitemap: true
  })

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    await Promise.all([fetchPages(), fetchGlobalSettings()])
    setLoading(false)
  }

  async function fetchPages() {
    try {
      if (!supabase || !isConfigured) {
        setPages(defaultPages.map((p, i) => ({ ...p, id: i + 1, is_active: true })))
        return
      }
      
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .order('priority', { ascending: false })
      
      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error('Error fetching SEO pages:', error)
      setPages(defaultPages.map((p, i) => ({ ...p, id: i + 1, is_active: true })))
    }
  }

  async function fetchGlobalSettings() {
    try {
      if (!supabase || !isConfigured) {
        return
      }
      
      const { data, error } = await supabase
        .from('global_seo_settings')
        .select('*')
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setGlobalSettings(data)
        setGlobalFormData({
          site_name: data.site_name || 'ইজি ডক্টর রংপুর',
          site_tagline: data.site_tagline || '',
          default_meta_description: data.default_meta_description || '',
          default_og_image: data.default_og_image || '/og-image.png',
          google_analytics_id: data.google_analytics_id || '',
          google_search_console_verification: data.google_search_console_verification || '',
          bing_verification: data.bing_verification || '',
          facebook_app_id: data.facebook_app_id || '',
          twitter_handle: data.twitter_handle || '',
          site_url: data.site_url || '',
          enable_structured_data: data.enable_structured_data !== false,
          enable_sitemap: data.enable_sitemap !== false
        })
      }
    } catch (error) {
      console.error('Error fetching global settings:', error)
    }
  }

  function openEditModal(page) {
    setEditingPage(page)
    let structuredDataStr = ''
    if (page.structured_data) {
      try {
        structuredDataStr = typeof page.structured_data === 'string' 
          ? page.structured_data 
          : JSON.stringify(page.structured_data, null, 2)
      } catch (e) {
        structuredDataStr = ''
      }
    }
    setFormData({
      page_identifier: page.page_identifier || '',
      page_name: page.page_name || '',
      title: page.title || '',
      meta_description: page.meta_description || '',
      meta_keywords: page.meta_keywords || '',
      og_title: page.og_title || '',
      og_description: page.og_description || '',
      og_image: page.og_image || '',
      twitter_title: page.twitter_title || '',
      twitter_description: page.twitter_description || '',
      twitter_image: page.twitter_image || '',
      canonical_url: page.canonical_url || '',
      no_index: page.no_index || false,
      no_follow: page.no_follow || false,
      priority: page.priority || 0.5,
      change_frequency: page.change_frequency || 'weekly',
      is_active: page.is_active !== false,
      structured_data: structuredDataStr
    })
    setShowModal(true)
  }

  function openAddModal() {
    setEditingPage(null)
    setFormData({
      page_identifier: '',
      page_name: '',
      title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
      twitter_title: '',
      twitter_description: '',
      twitter_image: '',
      canonical_url: '',
      no_index: false,
      no_follow: false,
      priority: 0.5,
      change_frequency: 'weekly',
      is_active: true,
      structured_data: ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস কনফিগার করা হয়নি')
        setSaving(false)
        return
      }

      let structuredDataJson = null
      if (formData.structured_data && formData.structured_data.trim()) {
        try {
          structuredDataJson = JSON.parse(formData.structured_data)
        } catch (e) {
          alert('Structured Data JSON ফরম্যাট সঠিক নয়')
          setSaving(false)
          return
        }
      }

      const pageData = {
        page_identifier: formData.page_identifier,
        page_name: formData.page_name,
        title: formData.title,
        meta_description: formData.meta_description,
        meta_keywords: formData.meta_keywords,
        og_title: formData.og_title || formData.title,
        og_description: formData.og_description || formData.meta_description,
        og_image: formData.og_image,
        twitter_title: formData.twitter_title || formData.og_title || formData.title,
        twitter_description: formData.twitter_description || formData.og_description || formData.meta_description,
        twitter_image: formData.twitter_image || formData.og_image,
        canonical_url: formData.canonical_url,
        no_index: formData.no_index,
        no_follow: formData.no_follow,
        priority: parseFloat(formData.priority) || 0.5,
        change_frequency: formData.change_frequency,
        is_active: formData.is_active,
        structured_data: structuredDataJson
      }

      if (editingPage) {
        const { error } = await supabase
          .from('seo_settings')
          .update(pageData)
          .eq('id', editingPage.id)
        
        if (error) throw error
        alert('সফলভাবে আপডেট হয়েছে!')
      } else {
        const { error } = await supabase
          .from('seo_settings')
          .insert([pageData])
        
        if (error) throw error
        alert('সফলভাবে যোগ করা হয়েছে!')
      }

      setShowModal(false)
      fetchPages()
    } catch (error) {
      console.error('Error:', error)
      alert('সংরক্ষণ করতে সমস্যা হয়েছে: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleGlobalSubmit(e) {
    e.preventDefault()
    setSaving(true)

    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস কনফিগার করা হয়নি')
        setSaving(false)
        return
      }

      const settingsData = {
        site_name: globalFormData.site_name,
        site_tagline: globalFormData.site_tagline,
        default_meta_description: globalFormData.default_meta_description,
        default_og_image: globalFormData.default_og_image,
        google_analytics_id: globalFormData.google_analytics_id,
        google_search_console_verification: globalFormData.google_search_console_verification,
        bing_verification: globalFormData.bing_verification,
        facebook_app_id: globalFormData.facebook_app_id,
        twitter_handle: globalFormData.twitter_handle,
        site_url: globalFormData.site_url,
        enable_structured_data: globalFormData.enable_structured_data,
        enable_sitemap: globalFormData.enable_sitemap
      }

      if (globalSettings) {
        const { error } = await supabase
          .from('global_seo_settings')
          .update(settingsData)
          .eq('id', globalSettings.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('global_seo_settings')
          .insert([settingsData])
        
        if (error) throw error
      }

      alert('গ্লোবাল সেটিংস সফলভাবে সংরক্ষণ হয়েছে!')
      fetchGlobalSettings()
    } catch (error) {
      console.error('Error:', error)
      alert('সংরক্ষণ করতে সমস্যা হয়েছে: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id, currentStatus) {
    try {
      if (!supabase || !isConfigured) return
      
      const { error } = await supabase
        .from('seo_settings')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      fetchPages()
    } catch (error) {
      console.error('Error:', error)
      alert('আপডেট করতে সমস্যা হয়েছে')
    }
  }

  async function deletePage(id) {
    if (!confirm('আপনি কি নিশ্চিত এই পেজের SEO সেটিংস মুছে ফেলতে চান?')) return

    try {
      if (!supabase || !isConfigured) return
      
      const { error } = await supabase
        .from('seo_settings')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      alert('সফলভাবে মুছে ফেলা হয়েছে!')
      fetchPages()
    } catch (error) {
      console.error('Error:', error)
      alert('মুছে ফেলতে সমস্যা হয়েছে')
    }
  }

  const filteredPages = pages.filter(page => 
    page.page_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.page_identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPriorityColor = (priority) => {
    if (priority >= 0.8) return 'bg-green-100 text-green-700'
    if (priority >= 0.5) return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-4 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">এসইও ম্যানেজমেন্ট</h1>
          <p className="text-gray-500 mt-1">সার্চ ইঞ্জিন অপ্টিমাইজেশন সেটিংস পরিচালনা করুন</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-medium transition-all ${
              activeTab === 'pages' 
                ? 'bg-teal-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📄 পেজ সেটিংস
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-medium transition-all ${
              activeTab === 'global' 
                ? 'bg-teal-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🌐 গ্লোবাল সেটিংস
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : activeTab === 'pages' ? (
          <>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div className="relative w-full lg:w-80">
                <input
                  type="text"
                  placeholder="পেজ খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={openAddModal}
                className="w-full lg:w-auto bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                নতুন পেজ SEO
              </button>
            </div>

            {filteredPages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-10 text-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো পেজ পাওয়া যায়নি</h3>
                <p className="text-gray-500">নতুন পেজের SEO সেটিংস যোগ করুন</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPages.map((page) => (
                  <div 
                    key={page.id} 
                    className="bg-white rounded-xl shadow-md p-4 lg:p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-800 text-lg">{page.page_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(page.priority)}`}>
                            {page.priority?.toFixed(1)}
                          </span>
                          {page.no_index && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              noindex
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mb-1">/{page.page_identifier}</p>
                        {page.title && (
                          <p className="text-gray-600 text-sm truncate max-w-xl">{page.title}</p>
                        )}
                        {page.meta_description && (
                          <p className="text-gray-400 text-xs mt-1 truncate max-w-xl">{page.meta_description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={page.is_active}
                            onChange={() => toggleActive(page.id, page.is_active)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>

                        <button
                          onClick={() => openEditModal(page)}
                          className="bg-teal-50 text-teal-600 px-3 lg:px-4 py-2 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          সম্পাদনা
                        </button>

                        <button
                          onClick={() => deletePage(page.id)}
                          className="bg-red-50 text-red-600 px-3 lg:px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          মুছুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-4 lg:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              গ্লোবাল SEO সেটিংস
            </h2>

            <form onSubmit={handleGlobalSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">সাইটের নাম</label>
                  <input
                    type="text"
                    value={globalFormData.site_name}
                    onChange={(e) => setGlobalFormData({ ...globalFormData, site_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="ইজি ডক্টর রংপুর"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">ট্যাগলাইন</label>
                  <input
                    type="text"
                    value={globalFormData.site_tagline}
                    onChange={(e) => setGlobalFormData({ ...globalFormData, site_tagline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="সাইটের ট্যাগলাইন"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">সাইট URL</label>
                  <input
                    type="url"
                    value={globalFormData.site_url}
                    onChange={(e) => setGlobalFormData({ ...globalFormData, site_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">ডিফল্ট OG ইমেজ</label>
                  <input
                    type="text"
                    value={globalFormData.default_og_image}
                    onChange={(e) => setGlobalFormData({ ...globalFormData, default_og_image: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="/og-image.png"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">ডিফল্ট মেটা বিবরণ</label>
                <textarea
                  value={globalFormData.default_meta_description}
                  onChange={(e) => setGlobalFormData({ ...globalFormData, default_meta_description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                  placeholder="সাইটের ডিফল্ট মেটা বিবরণ"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-4">📊 অ্যানালিটিক্স ও ভেরিফিকেশন</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Google Analytics ID</label>
                    <input
                      type="text"
                      value={globalFormData.google_analytics_id}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, google_analytics_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Google Search Console</label>
                    <input
                      type="text"
                      value={globalFormData.google_search_console_verification}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, google_search_console_verification: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Verification code"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Bing Verification</label>
                    <input
                      type="text"
                      value={globalFormData.bing_verification}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, bing_verification: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Bing verification code"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-4">📱 সোশ্যাল মিডিয়া</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Facebook App ID</label>
                    <input
                      type="text"
                      value={globalFormData.facebook_app_id}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, facebook_app_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Facebook App ID"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Twitter Handle</label>
                    <input
                      type="text"
                      value={globalFormData.twitter_handle}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, twitter_handle: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-4">⚙️ সেটিংস</h3>
                <div className="flex flex-wrap gap-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalFormData.enable_structured_data}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, enable_structured_data: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    <span className="ml-3 text-gray-700 font-medium">Structured Data সক্রিয়</span>
                  </label>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalFormData.enable_sitemap}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, enable_sitemap: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    <span className="ml-3 text-gray-700 font-medium">Sitemap সক্রিয়</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
            </form>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl">
              <div className="p-6 border-b bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">
                  {editingPage ? 'পেজ SEO সম্পাদনা করুন' : 'নতুন পেজ SEO যোগ করুন'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">পেজ আইডেন্টিফায়ার *</label>
                    <input
                      type="text"
                      value={formData.page_identifier}
                      onChange={(e) => setFormData({ ...formData, page_identifier: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="home, specialist-doctors"
                      required
                      disabled={!!editingPage}
                    />
                    <p className="text-xs text-gray-500 mt-1">URL path identifier</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">পেজের নাম *</label>
                    <input
                      type="text"
                      value={formData.page_name}
                      onChange={(e) => setFormData({ ...formData, page_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="হোম পেজ"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">টাইটেল ট্যাগ</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="পেজের টাইটেল | ইজি ডক্টর রংপুর"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.title?.length || 0}/60 অক্ষর (আদর্শ: ৫০-৬০)</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">মেটা বিবরণ</label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={3}
                    placeholder="পেজের সংক্ষিপ্ত বিবরণ"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.meta_description?.length || 0}/160 অক্ষর (আদর্শ: ১২০-১৫৫)</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">মেটা কীওয়ার্ড</label>
                  <input
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="কীওয়ার্ড১, কীওয়ার্ড২, কীওয়ার্ড৩"
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 mb-4">📱 Open Graph (Facebook/LinkedIn)</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">OG টাইটেল</label>
                      <input
                        type="text"
                        value={formData.og_title}
                        onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="শেয়ার করার সময় টাইটেল"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">OG ইমেজ URL</label>
                      <input
                        type="text"
                        value={formData.og_image}
                        onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="/images/og-image.png"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-gray-700 font-medium mb-2">OG বিবরণ</label>
                    <textarea
                      value={formData.og_description}
                      onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows={2}
                      placeholder="শেয়ার করার সময় বিবরণ"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 mb-4">🐦 Twitter Card</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Twitter টাইটেল</label>
                      <input
                        type="text"
                        value={formData.twitter_title}
                        onChange={(e) => setFormData({ ...formData, twitter_title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Twitter এ শেয়ার করার সময় টাইটেল"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Twitter ইমেজ URL</label>
                      <input
                        type="text"
                        value={formData.twitter_image}
                        onChange={(e) => setFormData({ ...formData, twitter_image: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="/images/twitter-image.png"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-gray-700 font-medium mb-2">Twitter বিবরণ</label>
                    <textarea
                      value={formData.twitter_description}
                      onChange={(e) => setFormData({ ...formData, twitter_description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows={2}
                      placeholder="Twitter এ শেয়ার করার সময় বিবরণ"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 mb-4">📊 Structured Data (JSON-LD)</h3>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Structured Data JSON</label>
                    <textarea
                      value={formData.structured_data}
                      onChange={(e) => setFormData({ ...formData, structured_data: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                      rows={6}
                      placeholder='{"@context": "https://schema.org", "@type": "WebPage", ...}'
                    />
                    <p className="text-xs text-gray-500 mt-1">JSON-LD ফরম্যাটে স্ট্রাকচার্ড ডেটা যোগ করুন (ঐচ্ছিক)</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 mb-4">🔧 উন্নত সেটিংস</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Canonical URL</label>
                      <input
                        type="text"
                        value={formData.canonical_url}
                        onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="https://example.com/page"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Change Frequency</label>
                      <select
                        value={formData.change_frequency}
                        onChange={(e) => setFormData({ ...formData, change_frequency: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        {frequencyOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Priority (0.0 - 1.0)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseFloat(e.target.value) || 0.5 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 mt-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.no_index}
                        onChange={(e) => setFormData({ ...formData, no_index: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-gray-700 font-medium">No Index (সার্চ থেকে বাদ)</span>
                    </label>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.no_follow}
                        onChange={(e) => setFormData({ ...formData, no_follow: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-gray-700 font-medium">No Follow (লিংক ফলো নয়)</span>
                    </label>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      <span className="ml-3 text-gray-700 font-medium">সক্রিয়</span>
                    </label>
                  </div>
                </div>
              </form>

              <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSEO
