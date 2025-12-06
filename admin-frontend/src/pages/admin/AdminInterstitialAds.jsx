import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

const defaultSettings = {
  is_enabled: false,
  desktop_image_url: '',
  mobile_image_url: '',
  link_url: '',
  delay_seconds: 60,
  show_once_per_session: true,
  show_close_button: true,
  close_button_delay: 3
}

function AdminInterstitialAds() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)
  const [settingsId, setSettingsId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn')
    if (!loggedIn) {
      navigate('/admin/login')
      return
    }
    fetchSettings()
  }, [navigate])

  async function fetchSettings() {
    try {
      const response = await fetch('/api/interstitial-ads')
      const result = await response.json()

      if (result.success && result.data) {
        setSettings({ ...defaultSettings, ...result.data })
        setSettingsId(result.data.id)
      }
    } catch (err) {
      console.log('Using default settings')
    } finally {
      setLoading(false)
    }
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
      const delayVal = parseInt(settings.delay_seconds)
      const closeDelayVal = parseInt(settings.close_button_delay)
      
      const updateData = {
        is_enabled: settings.is_enabled ?? false,
        desktop_image_url: settings.desktop_image_url || null,
        mobile_image_url: settings.mobile_image_url || null,
        link_url: settings.link_url || null,
        delay_seconds: isNaN(delayVal) ? 60 : delayVal,
        show_once_per_session: settings.show_once_per_session ?? true,
        show_close_button: settings.show_close_button ?? true,
        close_button_delay: isNaN(closeDelayVal) ? 3 : closeDelayVal,
        updated_at: new Date().toISOString(),
        adminAuth
      }

      if (settingsId) {
        updateData.id = settingsId
      }

      const response = await fetch('/api/interstitial-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        if (result.data) {
          setSettingsId(result.data.id)
        }
        setMessage({ type: 'success', text: result.message })
      } else {
        setMessage({ type: 'error', text: result.message || 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
    } finally {
      setSaving(false)
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
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ইন্টারস্টিশিয়াল বিজ্ঞাপন</h1>
              <p className="text-gray-600 mt-1">পূর্ণ পর্দার পপআপ বিজ্ঞাপন সেটিংস</p>
            </div>
          </div>

          <div className="space-y-6">
            {message.text && (
              <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">⚙️</span> সাধারণ সেটিংস
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.is_enabled}
                    onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="font-medium text-gray-700">বিজ্ঞাপন সক্রিয় করুন</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিলম্ব (সেকেন্ড)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={settings.delay_seconds}
                      onChange={(e) => setSettings({ ...settings, delay_seconds: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="60"
                    />
                    <p className="text-xs text-gray-500 mt-1">ওয়েবসাইটে প্রবেশের কত সেকেন্ড পরে বিজ্ঞাপন দেখাবে</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ক্লোজ বাটন বিলম্ব (সেকেন্ড)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={settings.close_button_delay}
                      onChange={(e) => setSettings({ ...settings, close_button_delay: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-500 mt-1">ক্লোজ বাটন কত সেকেন্ড পরে দেখাবে</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_once_per_session}
                      onChange={(e) => setSettings({ ...settings, show_once_per_session: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">প্রতি সেশনে একবার দেখান</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_close_button}
                      onChange={(e) => setSettings({ ...settings, show_close_button: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">ক্লোজ বাটন দেখান</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🖼️</span> বিজ্ঞাপন ছবি
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ডেস্কটপ ছবি URL</label>
                  <input
                    type="url"
                    value={settings.desktop_image_url || ''}
                    onChange={(e) => setSettings({ ...settings, desktop_image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/desktop-ad.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">প্রস্তাবিত সাইজ: ১২০০x৮০০ পিক্সেল (ল্যান্ডস্কেপ)</p>
                  {settings.desktop_image_url && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">প্রিভিউ:</p>
                      <img 
                        src={settings.desktop_image_url} 
                        alt="Desktop Preview" 
                        className="max-h-40 rounded border object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">মোবাইল ছবি URL</label>
                  <input
                    type="url"
                    value={settings.mobile_image_url || ''}
                    onChange={(e) => setSettings({ ...settings, mobile_image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/mobile-ad.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">প্রস্তাবিত সাইজ: ৬০০x৮০০ পিক্সেল (পোর্ট্রেইট)</p>
                  {settings.mobile_image_url && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">প্রিভিউ:</p>
                      <img 
                        src={settings.mobile_image_url} 
                        alt="Mobile Preview" 
                        className="max-h-40 rounded border object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🔗</span> লিংক সেটিংস
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ক্লিক লিংক URL (ঐচ্ছিক)</label>
                <input
                  type="url"
                  value={settings.link_url || ''}
                  onChange={(e) => setSettings({ ...settings, link_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com/promo"
                />
                <p className="text-xs text-gray-500 mt-1">বিজ্ঞাপনে ক্লিক করলে এই লিংকে যাবে</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
        </div>
      </div>
    </div>
  )
}

export default AdminInterstitialAds
