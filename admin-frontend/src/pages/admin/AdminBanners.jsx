import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

const defaultBanner = {
  title: 'রংপুর বিভাগের সেরা ডাক্তারদের কাছে',
  subtitle: 'সহজেই অনলাইনে অ্যাপয়েন্টমেন্ট নিন। আপনার স্বাস্থ্য আমাদের অগ্রাধিকার।',
  badge_text: 'সর্বোচ্চ মানের চিকিৎসা সেবা',
  show_badge: true,
  primary_button_text: 'বিশেষজ্ঞ ডাক্তার',
  primary_button_link: '/rangpur-specialist-doctors-list-online-serial',
  show_primary_button: true,
  secondary_button_text: 'যোগাযোগ করুন',
  secondary_button_link: '/contact',
  show_secondary_button: true,
  overlay_color: '#1e40af',
  overlay_opacity: 0.75,
  feature_1_text: 'যাচাইকৃত ডাক্তার',
  feature_1_icon: 'verified',
  show_feature_1: true,
  feature_2_text: 'দ্রুত অ্যাপয়েন্টমেন্ট',
  feature_2_icon: 'clock',
  show_feature_2: true,
  feature_3_text: 'বিশ্বস্ত সেবা',
  feature_3_icon: 'heart',
  show_feature_3: true,
  is_active: true
}

const iconOptions = [
  { id: 'verified', name: 'যাচাইকৃত' },
  { id: 'clock', name: 'ঘড়ি' },
  { id: 'heart', name: 'হৃদয়' },
  { id: 'star', name: 'তারা' },
  { id: 'check', name: 'টিক' },
]

function AdminBanners() {
  const navigate = useNavigate()
  const [banner, setBanner] = useState(defaultBanner)
  const [bannerId, setBannerId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchBanner()
  }, [navigate])

  async function fetchBanner() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setBannerId(null)
        } else {
          console.error('Error:', error)
        }
      } else if (data) {
        setBanner({ ...defaultBanner, ...data })
        setBannerId(data.id)
      }
    } catch (error) {
      console.error('Error fetching banner:', error)
    } finally {
      setLoading(false)
    }
  }


  async function handleSave() {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      if (!supabase || !isConfigured) {
        setMessage({ type: 'error', text: 'ডাটাবেস সংযোগ নেই' })
        return
      }

      const bannerData = {
        ...banner,
        updated_at: new Date().toISOString()
      }

      if (bannerId) {
        const { error } = await supabase
          .from('home_banners')
          .update(bannerData)
          .eq('id', bannerId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('home_banners')
          .insert([bannerData])
          .select()
          .single()

        if (error) throw error
        setBannerId(data.id)
      }

      setMessage({ type: 'success', text: 'ব্যানার সফলভাবে সংরক্ষণ হয়েছে' })
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'ব্যানার সংরক্ষণে সমস্যা হয়েছে' })
    } finally {
      setSaving(false)
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
          <h1 className="text-2xl font-bold text-gray-800">হোম ব্যানার সেটিংস</h1>
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

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .267" />
                </svg>
                ব্যাকগ্রাউন্ড সেটিংস
              </h2>
              
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4 border border-gray-200" style={{
                backgroundColor: banner.overlay_color,
                opacity: banner.overlay_opacity
              }}>
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                  প্রিভিউ
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ওভারলে কালার</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={banner.overlay_color}
                      onChange={(e) => setBanner(prev => ({ ...prev, overlay_color: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={banner.overlay_color}
                      onChange={(e) => setBanner(prev => ({ ...prev, overlay_color: e.target.value }))}
                      className="flex-1 input-field"
                      placeholder="#1e40af"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ওভারলে স্বচ্ছতা</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={banner.overlay_opacity}
                    onChange={(e) => setBanner(prev => ({ ...prev, overlay_opacity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">মান: {banner.overlay_opacity}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                টেক্সট কন্টেন্ট
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={banner.show_badge}
                    onChange={(e) => setBanner(prev => ({ ...prev, show_badge: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary-600"
                  />
                  <label className="text-sm font-medium text-gray-700">ব্যাজ দেখান</label>
                </div>

                {banner.show_badge && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ব্যাজ টেক্সট</label>
                    <input
                      type="text"
                      value={banner.badge_text}
                      onChange={(e) => setBanner(prev => ({ ...prev, badge_text: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম</label>
                  <input
                    type="text"
                    value={banner.title}
                    onChange={(e) => setBanner(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">উপশিরোনাম</label>
                  <textarea
                    value={banner.subtitle}
                    onChange={(e) => setBanner(prev => ({ ...prev, subtitle: e.target.value }))}
                    rows={3}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                বাটন সেটিংস
              </h2>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={banner.show_primary_button}
                      onChange={(e) => setBanner(prev => ({ ...prev, show_primary_button: e.target.checked }))}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <label className="text-sm font-semibold text-gray-700">প্রাইমারি বাটন</label>
                  </div>

                  {banner.show_primary_button && (
                    <div className="space-y-3 ml-8">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">বাটন টেক্সট</label>
                        <input
                          type="text"
                          value={banner.primary_button_text}
                          onChange={(e) => setBanner(prev => ({ ...prev, primary_button_text: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">বাটন লিংক</label>
                        <input
                          type="text"
                          value={banner.primary_button_link}
                          onChange={(e) => setBanner(prev => ({ ...prev, primary_button_link: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={banner.show_secondary_button}
                      onChange={(e) => setBanner(prev => ({ ...prev, show_secondary_button: e.target.checked }))}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <label className="text-sm font-semibold text-gray-700">সেকেন্ডারি বাটন</label>
                  </div>

                  {banner.show_secondary_button && (
                    <div className="space-y-3 ml-8">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">বাটন টেক্সট</label>
                        <input
                          type="text"
                          value={banner.secondary_button_text}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondary_button_text: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">বাটন লিংক</label>
                        <input
                          type="text"
                          value={banner.secondary_button_link}
                          onChange={(e) => setBanner(prev => ({ ...prev, secondary_button_link: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                ফিচার পয়েন্ট
              </h2>

              <div className="space-y-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={banner[`show_feature_${num}`]}
                        onChange={(e) => setBanner(prev => ({ ...prev, [`show_feature_${num}`]: e.target.checked }))}
                        className="w-5 h-5 rounded text-primary-600"
                      />
                      <label className="text-sm font-semibold text-gray-700">ফিচার {num}</label>
                    </div>

                    {banner[`show_feature_${num}`] && (
                      <div className="space-y-3 ml-8">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">টেক্সট</label>
                          <input
                            type="text"
                            value={banner[`feature_${num}_text`]}
                            onChange={(e) => setBanner(prev => ({ ...prev, [`feature_${num}_text`]: e.target.value }))}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">আইকন</label>
                          <select
                            value={banner[`feature_${num}_icon`]}
                            onChange={(e) => setBanner(prev => ({ ...prev, [`feature_${num}_icon`]: e.target.value }))}
                            className="input-field"
                          >
                            {iconOptions.map(icon => (
                              <option key={icon.id} value={icon.id}>{icon.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">ব্যানার স্ট্যাটাস</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={banner.is_active}
                    onChange={(e) => setBanner(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {banner.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminBanners
