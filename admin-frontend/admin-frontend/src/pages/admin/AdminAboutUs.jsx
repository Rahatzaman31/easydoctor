import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { supabase, isConfigured } from '../../lib/supabase'

const defaultData = {
  hero_title: 'ইজি ডক্টর রংপুর',
  hero_subtitle: 'আপনার স্বাস্থ্যসেবার বিশ্বস্ত সঙ্গী',
  hero_description: 'রংপুর বিভাগের সবচেয়ে বড় অনলাইন ডাক্তার অ্যাপয়েন্টমেন্ট প্ল্যাটফর্ম',
  hero_image_url: '',
  who_we_are_title: 'আমরা কারা',
  who_we_are_content: 'ইজি ডক্টর রংপুর হলো একটি ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম যা রংপুর বিভাগের রোগী ও চিকিৎসকদের মধ্যে সেতুবন্ধন তৈরি করে। আমরা বিশ্বাস করি যে প্রতিটি মানুষের সহজে ও সাশ্রয়ী মূল্যে মানসম্পন্ন স্বাস্থ্যসেবা পাওয়ার অধিকার আছে।',
  mission_title: 'আমাদের লক্ষ্য',
  mission_content: 'রংপুর বিভাগের স্বাস্থ্যসেবা খাতকে ডিজিটালাইজ করে সকলের জন্য সহজলভ্য করা। আমরা চাই প্রতিটি রোগী সঠিক সময়ে সঠিক ডাক্তারের কাছে পৌঁছাতে পারেন।',
  mission_points: ['সহজে অনলাইন অ্যাপয়েন্টমেন্ট', 'বিশ্বস্ত ও অভিজ্ঞ ডাক্তার', 'সাশ্রয়ী মূল্যে সেবা', '২৪/৭ সাপোর্ট'],
  vision_title: 'আমাদের দৃষ্টিভঙ্গি',
  vision_content: 'এমন একটি সমাজ গড়ে তোলা যেখানে প্রতিটি মানুষ সহজে মানসম্পন্ন স্বাস্থ্যসেবা পেতে পারে এবং স্বাস্থ্য সচেতন জীবনযাপন করতে পারে।',
  services_title: 'আমাদের সেবাসমূহ',
  services: [
    { title: 'অনলাইন অ্যাপয়েন্টমেন্ট', description: 'ঘরে বসে সহজেই ডাক্তারের অ্যাপয়েন্টমেন্ট নিন', icon: 'calendar' },
    { title: 'বিশেষজ্ঞ ডাক্তার', description: '২৪+ বিশেষজ্ঞ বিভাগে অভিজ্ঞ ডাক্তার', icon: 'user-md' },
    { title: 'হাসপাতাল ও ডায়াগনস্টিক', description: 'নির্ভরযোগ্য হাসপাতাল ও ডায়াগনস্টিক সেন্টারের তালিকা', icon: 'hospital' },
    { title: 'অ্যাম্বুলেন্স সেবা', description: 'জরুরি অ্যাম্বুলেন্স সেবা তথ্য', icon: 'ambulance' },
    { title: 'স্বাস্থ্য ব্লগ', description: 'স্বাস্থ্য সচেতনতামূলক তথ্য ও পরামর্শ', icon: 'blog' },
    { title: 'পেইড সিরিয়াল', description: 'অগ্রাধিকার ভিত্তিক প্রিমিয়াম সেবা', icon: 'star' }
  ],
  stats: [
    { label: 'নিবন্ধিত ডাক্তার', value: '৫০০+', icon: 'doctors' },
    { label: 'সন্তুষ্ট রোগী', value: '১০,০০০+', icon: 'patients' },
    { label: 'হাসপাতাল', value: '১০০+', icon: 'hospitals' },
    { label: 'জেলা কভারেজ', value: '৮টি', icon: 'districts' }
  ],
  team_title: 'আমাদের টিম',
  team_description: 'আমাদের নিবেদিত টিম সদস্যরা আপনার সেবায় সর্বদা প্রস্তুত',
  team_members: [
    { name: 'ডা. মোঃ আব্দুল্লাহ', position: 'প্রধান উপদেষ্টা', image_url: '', description: '২০+ বছরের অভিজ্ঞতা সম্পন্ন চিকিৎসা পেশাজীবী' },
    { name: 'মোঃ রাকিবুল ইসলাম', position: 'প্রতিষ্ঠাতা ও সিইও', image_url: '', description: 'প্রযুক্তি ও স্বাস্থ্যসেবা খাতে অভিজ্ঞ' },
    { name: 'ফাতেমা খাতুন', position: 'অপারেশনস ম্যানেজার', image_url: '', description: 'রোগীদের সেবা প্রদানে নিবেদিত' },
    { name: 'মোঃ সাইফুল ইসলাম', position: 'টেকনিক্যাল লিড', image_url: '', description: 'সফটওয়্যার ডেভেলপমেন্টে বিশেষজ্ঞ' }
  ],
  why_choose_title: 'কেন আমাদের বেছে নেবেন',
  why_choose_points: [
    { title: 'বিশ্বস্ততা', description: 'আমরা রংপুর বিভাগের সবচেয়ে বিশ্বস্ত স্বাস্থ্যসেবা প্ল্যাটফর্ম' },
    { title: 'সহজ প্রক্রিয়া', description: 'মাত্র কয়েক ক্লিকে অ্যাপয়েন্টমেন্ট নিন' },
    { title: '২৪/৭ সাপোর্ট', description: 'যেকোনো সমস্যায় আমরা সবসময় আপনার পাশে' },
    { title: 'নিরাপদ পেমেন্ট', description: 'বিকাশের মাধ্যমে নিরাপদ অনলাইন পেমেন্ট' }
  ],
  contact_title: 'যোগাযোগ করুন',
  contact_email: 'info@rangpurdoctor.com',
  contact_phone: '+880 1700-000000',
  contact_address: 'স্টেশন রোড, রংপুর সদর, রংপুর',
  contact_whatsapp: '+8801700000000',
  social_facebook: 'https://facebook.com/rangpurdoctor',
  social_youtube: '',
  social_linkedin: '',
  social_twitter: '',
  footer_message: 'ইজি ডক্টর রংপুর - আপনার স্বাস্থ্যসেবার বিশ্বস্ত সঙ্গী। আমাদের সাথে যুক্ত থাকুন এবং সুস্থ থাকুন।',
  is_active: true
}

const serviceIconOptions = ['calendar', 'user-md', 'hospital', 'ambulance', 'blog', 'star']
const statIconOptions = ['doctors', 'patients', 'hospitals', 'districts']

function AdminAboutUs() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(defaultData)
  const [dataId, setDataId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('hero')

  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn')
    if (!loggedIn) {
      navigate('/admin/login')
      return
    }
    fetchData()
  }, [navigate])

  async function fetchData() {
    if (!supabase || !isConfigured) {
      setLoading(false)
      return
    }

    try {
      const { data: aboutData, error } = await supabase
        .from('about_us')
        .select('*')
        .limit(1)
        .single()

      if (!error && aboutData) {
        setData({
          ...defaultData,
          ...aboutData,
          mission_points: aboutData.mission_points || defaultData.mission_points,
          services: aboutData.services || defaultData.services,
          stats: aboutData.stats || defaultData.stats,
          team_members: aboutData.team_members || defaultData.team_members,
          why_choose_points: aboutData.why_choose_points || defaultData.why_choose_points
        })
        setDataId(aboutData.id)
      }
    } catch (err) {
      console.log('Using default about us data')
    } finally {
      setLoading(false)
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
      const updateData = { ...data }
      delete updateData.id
      delete updateData.created_at
      updateData.updated_at = new Date().toISOString()

      if (dataId) {
        const { error } = await supabase
          .from('about_us')
          .update(updateData)
          .eq('id', dataId)

        if (error) throw error
      } else {
        const { data: newData, error } = await supabase
          .from('about_us')
          .insert([updateData])
          .select()
          .single()

        if (error) throw error
        if (newData) setDataId(newData.id)
      }

      setMessage({ type: 'success', text: 'সফলভাবে সংরক্ষণ করা হয়েছে!' })
    } catch (err) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' })
    } finally {
      setSaving(false)
    }
  }

  function updateMissionPoint(index, value) {
    const newPoints = [...data.mission_points]
    newPoints[index] = value
    setData({ ...data, mission_points: newPoints })
  }

  function addMissionPoint() {
    setData({ ...data, mission_points: [...data.mission_points, ''] })
  }

  function removeMissionPoint(index) {
    const newPoints = data.mission_points.filter((_, i) => i !== index)
    setData({ ...data, mission_points: newPoints })
  }

  function updateService(index, field, value) {
    const newServices = [...data.services]
    newServices[index] = { ...newServices[index], [field]: value }
    setData({ ...data, services: newServices })
  }

  function addService() {
    setData({ ...data, services: [...data.services, { title: '', description: '', icon: 'star' }] })
  }

  function removeService(index) {
    const newServices = data.services.filter((_, i) => i !== index)
    setData({ ...data, services: newServices })
  }

  function updateStat(index, field, value) {
    const newStats = [...data.stats]
    newStats[index] = { ...newStats[index], [field]: value }
    setData({ ...data, stats: newStats })
  }

  function addStat() {
    setData({ ...data, stats: [...data.stats, { label: '', value: '', icon: 'doctors' }] })
  }

  function removeStat(index) {
    const newStats = data.stats.filter((_, i) => i !== index)
    setData({ ...data, stats: newStats })
  }

  function updateTeamMember(index, field, value) {
    const newMembers = [...data.team_members]
    newMembers[index] = { ...newMembers[index], [field]: value }
    setData({ ...data, team_members: newMembers })
  }

  function addTeamMember() {
    setData({ ...data, team_members: [...data.team_members, { name: '', position: '', image_url: '', description: '' }] })
  }

  function removeTeamMember(index) {
    const newMembers = data.team_members.filter((_, i) => i !== index)
    setData({ ...data, team_members: newMembers })
  }

  function updateWhyChoose(index, field, value) {
    const newPoints = [...data.why_choose_points]
    newPoints[index] = { ...newPoints[index], [field]: value }
    setData({ ...data, why_choose_points: newPoints })
  }

  function addWhyChoose() {
    setData({ ...data, why_choose_points: [...data.why_choose_points, { title: '', description: '' }] })
  }

  function removeWhyChoose(index) {
    const newPoints = data.why_choose_points.filter((_, i) => i !== index)
    setData({ ...data, why_choose_points: newPoints })
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

  const tabs = [
    { id: 'hero', label: 'হিরো সেকশন' },
    { id: 'about', label: 'আমাদের সম্পর্কে' },
    { id: 'mission', label: 'লক্ষ্য ও দৃষ্টিভঙ্গি' },
    { id: 'services', label: 'সেবাসমূহ' },
    { id: 'stats', label: 'পরিসংখ্যান' },
    { id: 'team', label: 'টিম' },
    { id: 'why', label: 'কেন আমরা' },
    { id: 'contact', label: 'যোগাযোগ' }
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">আমাদের সম্পর্কে সেটিংস</h1>
              <p className="text-gray-600 mt-1">About Us পেজের সব তথ্য এডিট করুন</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
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

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="flex overflow-x-auto border-b">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === 'hero' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">হিরো সেকশন</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম</label>
                    <input
                      type="text"
                      value={data.hero_title}
                      onChange={(e) => setData({ ...data, hero_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">উপশিরোনাম</label>
                    <input
                      type="text"
                      value={data.hero_subtitle}
                      onChange={(e) => setData({ ...data, hero_subtitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
                    <textarea
                      value={data.hero_description}
                      onChange={(e) => setData({ ...data, hero_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">হিরো ইমেজ URL (ঐচ্ছিক)</label>
                    <input
                      type="url"
                      value={data.hero_image_url || ''}
                      onChange={(e) => setData({ ...data, hero_image_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">আমরা কারা</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম</label>
                    <input
                      type="text"
                      value={data.who_we_are_title}
                      onChange={(e) => setData({ ...data, who_we_are_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত</label>
                    <textarea
                      value={data.who_we_are_content}
                      onChange={(e) => setData({ ...data, who_we_are_content: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ইমেজ URL (ঐচ্ছিক)</label>
                    <input
                      type="url"
                      value={data.who_we_are_image_url || ''}
                      onChange={(e) => setData({ ...data, who_we_are_image_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mission' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">আমাদের লক্ষ্য</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম</label>
                      <input
                        type="text"
                        value={data.mission_title}
                        onChange={(e) => setData({ ...data, mission_title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত</label>
                      <textarea
                        value={data.mission_content}
                        onChange={(e) => setData({ ...data, mission_content: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">লক্ষ্য পয়েন্টসমূহ</label>
                      {data.mission_points.map((point, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => updateMissionPoint(index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            onClick={() => removeMissionPoint(index)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addMissionPoint}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        নতুন পয়েন্ট যোগ করুন
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">আমাদের দৃষ্টিভঙ্গি</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম</label>
                      <input
                        type="text"
                        value={data.vision_title}
                        onChange={(e) => setData({ ...data, vision_title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত</label>
                      <textarea
                        value={data.vision_content}
                        onChange={(e) => setData({ ...data, vision_content: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">সেবাসমূহ</h2>
                  <button
                    onClick={addService}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    নতুন সেবা যোগ করুন
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সেকশন শিরোনাম</label>
                  <input
                    type="text"
                    value={data.services_title}
                    onChange={(e) => setData({ ...data, services_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-4"
                  />
                </div>
                <div className="space-y-4">
                  {data.services.map((service, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">সেবা #{index + 1}</span>
                        <button
                          onClick={() => removeService(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">শিরোনাম</label>
                          <input
                            type="text"
                            value={service.title}
                            onChange={(e) => updateService(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">বিবরণ</label>
                          <input
                            type="text"
                            value={service.description}
                            onChange={(e) => updateService(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">আইকন</label>
                          <select
                            value={service.icon}
                            onChange={(e) => updateService(index, 'icon', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            {serviceIconOptions.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">পরিসংখ্যান</h2>
                  <button
                    onClick={addStat}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    নতুন পরিসংখ্যান যোগ করুন
                  </button>
                </div>
                <div className="space-y-4">
                  {data.stats.map((stat, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">পরিসংখ্যান #{index + 1}</span>
                        <button
                          onClick={() => removeStat(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">লেবেল</label>
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => updateStat(index, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">মান</label>
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => updateStat(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">আইকন</label>
                          <select
                            value={stat.icon}
                            onChange={(e) => updateStat(index, 'icon', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            {statIconOptions.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">টিম সদস্য</h2>
                  <button
                    onClick={addTeamMember}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    নতুন সদস্য যোগ করুন
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">সেকশন শিরোনাম</label>
                    <input
                      type="text"
                      value={data.team_title}
                      onChange={(e) => setData({ ...data, team_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">সেকশন বিবরণ</label>
                    <input
                      type="text"
                      value={data.team_description}
                      onChange={(e) => setData({ ...data, team_description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {data.team_members.map((member, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">সদস্য #{index + 1}</span>
                        <button
                          onClick={() => removeTeamMember(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">নাম</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">পদবী</label>
                          <input
                            type="text"
                            value={member.position}
                            onChange={(e) => updateTeamMember(index, 'position', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">ছবি URL</label>
                          <input
                            type="url"
                            value={member.image_url}
                            onChange={(e) => updateTeamMember(index, 'image_url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">সংক্ষিপ্ত বিবরণ</label>
                          <input
                            type="text"
                            value={member.description}
                            onChange={(e) => updateTeamMember(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'why' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">কেন আমাদের বেছে নেবেন</h2>
                  <button
                    onClick={addWhyChoose}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    নতুন পয়েন্ট যোগ করুন
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সেকশন শিরোনাম</label>
                  <input
                    type="text"
                    value={data.why_choose_title}
                    onChange={(e) => setData({ ...data, why_choose_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-4"
                  />
                </div>
                <div className="space-y-4">
                  {data.why_choose_points.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">পয়েন্ট #{index + 1}</span>
                        <button
                          onClick={() => removeWhyChoose(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">শিরোনাম</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateWhyChoose(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">বিবরণ</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateWhyChoose(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">যোগাযোগ তথ্য</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">সেকশন শিরোনাম</label>
                      <input
                        type="text"
                        value={data.contact_title}
                        onChange={(e) => setData({ ...data, contact_title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ফোন</label>
                      <input
                        type="text"
                        value={data.contact_phone}
                        onChange={(e) => setData({ ...data, contact_phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
                      <input
                        type="email"
                        value={data.contact_email}
                        onChange={(e) => setData({ ...data, contact_email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">হোয়াটসঅ্যাপ</label>
                      <input
                        type="text"
                        value={data.contact_whatsapp || ''}
                        onChange={(e) => setData({ ...data, contact_whatsapp: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="+8801XXXXXXXXX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা</label>
                      <input
                        type="text"
                        value={data.contact_address}
                        onChange={(e) => setData({ ...data, contact_address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">সামাজিক মাধ্যম</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ফেসবুক</label>
                      <input
                        type="url"
                        value={data.social_facebook || ''}
                        onChange={(e) => setData({ ...data, social_facebook: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ইউটিউব</label>
                      <input
                        type="url"
                        value={data.social_youtube || ''}
                        onChange={(e) => setData({ ...data, social_youtube: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">লিংকডইন</label>
                      <input
                        type="url"
                        value={data.social_linkedin || ''}
                        onChange={(e) => setData({ ...data, social_linkedin: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">টুইটার</label>
                      <input
                        type="url"
                        value={data.social_twitter || ''}
                        onChange={(e) => setData({ ...data, social_twitter: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">ফুটার বার্তা</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বার্তা</label>
                    <textarea
                      value={data.footer_message}
                      onChange={(e) => setData({ ...data, footer_message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAboutUs
