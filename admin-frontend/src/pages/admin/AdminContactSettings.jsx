import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { supabase, isConfigured } from '../../lib/supabase'

const defaultSettings = {
  phone_primary: '+880 1700-000000',
  phone_secondary: '+880 1800-000000',
  email_primary: 'info@rangpurdoctor.com',
  email_support: 'support@rangpurdoctor.com',
  whatsapp_number: '+8801700000000',
  facebook_url: 'https://facebook.com/rangpurdoctor',
  facebook_messenger_url: 'https://m.me/rangpurdoctor',
  twitter_url: '',
  youtube_url: '',
  linkedin_url: '',
  instagram_url: '',
  address_line1: 'স্টেশন রোড, রংপুর সদর',
  address_line2: 'রংপুর মেডিকেল কলেজের পাশে',
  city: 'রংপুর',
  district: 'রংপুর',
  office_hours_weekday: 'সকাল ৯:০০ - রাত ১০:০০',
  office_hours_weekend: 'সকাল ১০:০০ - রাত ৮:০০',
  live_chat_enabled: true,
  live_chat_whatsapp: true,
  live_chat_messenger: true
}

function AdminContactSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)
  const [settingsId, setSettingsId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('contact')
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn')
    if (!loggedIn) {
      navigate('/admin/login')
      return
    }
    fetchSettings()
    fetchMessages()
  }, [navigate])

  async function fetchSettings() {
    if (!supabase || !isConfigured) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .limit(1)
        .single()

      if (!error && data) {
        setSettings({ ...defaultSettings, ...data })
        setSettingsId(data.id)
      }
    } catch (err) {
      console.log('Using default settings')
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages() {
    if (!supabase || !isConfigured) return

    setMessagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setMessages(data)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }

  async function handleSave() {
    if (!supabase || !isConfigured) {
      setMessage({ type: 'error', text: 'ডাটাবেস সংযোগ নেই' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const updateData = {
        phone_primary: settings.phone_primary || null,
        phone_secondary: settings.phone_secondary || null,
        email_primary: settings.email_primary || null,
        email_support: settings.email_support || null,
        whatsapp_number: settings.whatsapp_number || null,
        facebook_url: settings.facebook_url || null,
        facebook_messenger_url: settings.facebook_messenger_url || null,
        twitter_url: settings.twitter_url || null,
        youtube_url: settings.youtube_url || null,
        linkedin_url: settings.linkedin_url || null,
        instagram_url: settings.instagram_url || null,
        address_line1: settings.address_line1 || null,
        address_line2: settings.address_line2 || null,
        city: settings.city || null,
        district: settings.district || null,
        office_hours_weekday: settings.office_hours_weekday || null,
        office_hours_weekend: settings.office_hours_weekend || null,
        live_chat_enabled: settings.live_chat_enabled ?? true,
        live_chat_whatsapp: settings.live_chat_whatsapp ?? true,
        live_chat_messenger: settings.live_chat_messenger ?? true,
        updated_at: new Date().toISOString()
      }
      
      console.log('Saving data:', updateData)

      if (settingsId) {
        const { error } = await supabase
          .from('contact_settings')
          .update(updateData)
          .eq('id', settingsId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('contact_settings')
          .insert([updateData])
          .select()
          .single()

        if (error) throw error
        if (data) setSettingsId(data.id)
      }

      setMessage({ type: 'success', text: 'সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!' })
    } catch (err) {
      console.error('Error saving settings:', err)
      const errorMessage = err?.message || err?.details || JSON.stringify(err)
      console.error('Error details:', errorMessage)
      setMessage({ type: 'error', text: `সংরক্ষণ করতে সমস্যা হয়েছে: ${errorMessage}` })
    } finally {
      setSaving(false)
    }
  }

  async function markAsRead(id) {
    if (!supabase || !isConfigured) return

    try {
      await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id)

      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m))
    } catch (err) {
      console.error('Error:', err)
    }
  }

  async function deleteMessage(id) {
    if (!confirm('এই বার্তা মুছে ফেলতে চান?')) return
    if (!supabase || !isConfigured) return

    try {
      await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id)

      setMessages(messages.filter(m => m.id !== id))
    } catch (err) {
      console.error('Error:', err)
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">যোগাযোগ সেটিংস</h1>
              <p className="text-gray-600 mt-1">যোগাযোগের তথ্য এবং বার্তা পরিচালনা করুন</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('contact')}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'contact'
                    ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                যোগাযোগের তথ্য
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'messages'
                    ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                বার্তাসমূহ
                {messages.filter(m => !m.is_read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {messages.filter(m => !m.is_read).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {activeTab === 'contact' && (
            <div className="space-y-6">
              {message.text && (
                <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📞</span> ফোন ও ইমেইল
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">প্রাথমিক ফোন নম্বর</label>
                    <input
                      type="text"
                      value={settings.phone_primary}
                      onChange={(e) => setSettings({ ...settings, phone_primary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">দ্বিতীয় ফোন নম্বর</label>
                    <input
                      type="text"
                      value={settings.phone_secondary || ''}
                      onChange={(e) => setSettings({ ...settings, phone_secondary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">প্রাথমিক ইমেইল</label>
                    <input
                      type="email"
                      value={settings.email_primary}
                      onChange={(e) => setSettings({ ...settings, email_primary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">সাপোর্ট ইমেইল</label>
                    <input
                      type="email"
                      value={settings.email_support || ''}
                      onChange={(e) => setSettings({ ...settings, email_support: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🌐</span> সামাজিক মাধ্যম
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">হোয়াটসঅ্যাপ নম্বর</label>
                    <input
                      type="text"
                      value={settings.whatsapp_number || ''}
                      onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+8801XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ফেসবুক পেজ URL</label>
                    <input
                      type="url"
                      value={settings.facebook_url || ''}
                      onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">মেসেঞ্জার URL</label>
                    <input
                      type="url"
                      value={settings.facebook_messenger_url || ''}
                      onChange={(e) => setSettings({ ...settings, facebook_messenger_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://m.me/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">টুইটার/এক্স URL</label>
                    <input
                      type="url"
                      value={settings.twitter_url || ''}
                      onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ইউটিউব চ্যানেল URL</label>
                    <input
                      type="url"
                      value={settings.youtube_url || ''}
                      onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">লিংকডইন URL</label>
                    <input
                      type="url"
                      value={settings.linkedin_url || ''}
                      onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ইনস্টাগ্রাম URL</label>
                    <input
                      type="url"
                      value={settings.instagram_url || ''}
                      onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📍</span> ঠিকানা
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা লাইন ১</label>
                    <input
                      type="text"
                      value={settings.address_line1 || ''}
                      onChange={(e) => setSettings({ ...settings, address_line1: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা লাইন ২</label>
                    <input
                      type="text"
                      value={settings.address_line2 || ''}
                      onChange={(e) => setSettings({ ...settings, address_line2: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">শহর</label>
                    <input
                      type="text"
                      value={settings.city || ''}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">জেলা</label>
                    <input
                      type="text"
                      value={settings.district || ''}
                      onChange={(e) => setSettings({ ...settings, district: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🕐</span> কার্যালয় সময়
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">শনি - বৃহস্পতি</label>
                    <input
                      type="text"
                      value={settings.office_hours_weekday || ''}
                      onChange={(e) => setSettings({ ...settings, office_hours_weekday: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">শুক্রবার</label>
                    <input
                      type="text"
                      value={settings.office_hours_weekend || ''}
                      onChange={(e) => setSettings({ ...settings, office_hours_weekend: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">💬</span> লাইভ চ্যাট সেটিংস
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.live_chat_enabled}
                      onChange={(e) => setSettings({ ...settings, live_chat_enabled: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-medium text-gray-700">লাইভ চ্যাট বাটন সক্রিয় করুন</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer ml-6">
                    <input
                      type="checkbox"
                      checked={settings.live_chat_whatsapp}
                      onChange={(e) => setSettings({ ...settings, live_chat_whatsapp: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">হোয়াটসঅ্যাপ চ্যাট দেখান</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer ml-6">
                    <input
                      type="checkbox"
                      checked={settings.live_chat_messenger}
                      onChange={(e) => setSettings({ ...settings, live_chat_messenger: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">মেসেঞ্জার চ্যাট দেখান</span>
                  </label>
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
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">প্রাপ্ত বার্তাসমূহ</h2>
                <button
                  onClick={fetchMessages}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  রিফ্রেশ করুন
                </button>
              </div>

              {messagesLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  কোনো বার্তা নেই
                </div>
              ) : (
                <div className="divide-y">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${!msg.is_read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">{msg.name}</span>
                            {!msg.is_read && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">নতুন</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {msg.phone} {msg.email && `• ${msg.email}`}
                          </p>
                          {msg.subject && (
                            <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
                          )}
                          <p className="text-gray-600">{msg.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(msg.created_at).toLocaleString('bn-BD')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!msg.is_read && (
                            <button
                              onClick={() => markAsRead(msg.id)}
                              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
                            >
                              পঠিত
                            </button>
                          )}
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-red-600"
                          >
                            মুছুন
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminContactSettings
