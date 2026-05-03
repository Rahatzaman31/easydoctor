import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminBkashSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    mode: 'sandbox',
    sandbox_base_url: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    sandbox_username: 'sandboxTokenizedUser02',
    sandbox_password: 'sandboxTokenizedUser02@12345',
    sandbox_app_key: '4f6o0cjiki2rfm34kfdadl1eqq',
    sandbox_app_secret: '2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b',
    production_base_url: 'https://tokenized.pay.bka.sh/v1.2.0-beta',
    production_username: '',
    production_password: '',
    production_app_key: '',
    production_app_secret: ''
  })

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('bkash_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings({
          mode: data.mode || 'sandbox',
          sandbox_base_url: data.sandbox_base_url || settings.sandbox_base_url,
          sandbox_username: data.sandbox_username || settings.sandbox_username,
          sandbox_password: data.sandbox_password || settings.sandbox_password,
          sandbox_app_key: data.sandbox_app_key || settings.sandbox_app_key,
          sandbox_app_secret: data.sandbox_app_secret || settings.sandbox_app_secret,
          production_base_url: data.production_base_url || settings.production_base_url,
          production_username: data.production_username || '',
          production_password: data.production_password || '',
          production_app_key: data.production_app_key || '',
          production_app_secret: data.production_app_secret || ''
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      const { data: existing } = await supabase
        .from('bkash_settings')
        .select('id')
        .single()

      if (existing) {
        const { error } = await supabase
          .from('bkash_settings')
          .update(settings)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('bkash_settings')
          .insert([settings])
        
        if (error) throw error
      }

      alert('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">বিকাশ সেটিংস</h1>
            <p className="text-gray-600">বিকাশ পেমেন্ট গেটওয়ে কনফিগারেশন</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">পেমেন্ট মোড</h2>
            <div className="flex gap-4">
              <label className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                settings.mode === 'sandbox' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="sandbox"
                  checked={settings.mode === 'sandbox'}
                  onChange={handleChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    settings.mode === 'sandbox' 
                      ? 'border-orange-500 bg-orange-500' 
                      : 'border-gray-300'
                  }`}>
                    {settings.mode === 'sandbox' && (
                      <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Sandbox (টেস্ট মোড)</p>
                    <p className="text-sm text-gray-500">টেস্টিং এর জন্য - কোনো আসল টাকা কাটবে না</p>
                  </div>
                </div>
              </label>

              <label className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                settings.mode === 'production' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="production"
                  checked={settings.mode === 'production'}
                  onChange={handleChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    settings.mode === 'production' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {settings.mode === 'production' && (
                      <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Production (লাইভ মোড)</p>
                    <p className="text-sm text-gray-500">আসল পেমেন্ট প্রসেস হবে</p>
                  </div>
                </div>
              </label>
            </div>

            {settings.mode === 'production' && !settings.production_app_key && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <span className="font-medium">সতর্কতা:</span> Production credentials সেট করা নেই। প্রথমে নিচে Production সেটিংস পূরণ করুন।
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-800">Sandbox সেটিংস</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                <input
                  type="text"
                  name="sandbox_base_url"
                  value={settings.sandbox_base_url}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  name="sandbox_username"
                  value={settings.sandbox_username}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="sandbox_password"
                  value={settings.sandbox_password}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Key</label>
                <input
                  type="text"
                  name="sandbox_app_key"
                  value={settings.sandbox_app_key}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">App Secret</label>
                <input
                  type="password"
                  name="sandbox_app_secret"
                  value={settings.sandbox_app_secret}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <span className="font-medium">Sandbox টেস্ট তথ্য:</span><br />
                Wallet Number: 01770618575<br />
                OTP: 123456<br />
                PIN: 12121
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-800">Production সেটিংস</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                <input
                  type="text"
                  name="production_base_url"
                  value={settings.production_base_url}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  name="production_username"
                  value={settings.production_username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="bKash থেকে প্রাপ্ত username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="production_password"
                  value={settings.production_password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="bKash থেকে প্রাপ্ত password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Key</label>
                <input
                  type="text"
                  name="production_app_key"
                  value={settings.production_app_key}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="bKash থেকে প্রাপ্ত app key"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">App Secret</label>
                <input
                  type="password"
                  name="production_app_secret"
                  value={settings.production_app_secret}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="bKash থেকে প্রাপ্ত app secret"
                />
              </div>
            </div>

            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                <span className="font-medium">Production credentials পেতে:</span> bKash Merchant Account এ আবেদন করুন এবং অনুমোদন পাওয়ার পর credentials পাবেন।
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  সেটিংস সংরক্ষণ করুন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminBkashSettings
