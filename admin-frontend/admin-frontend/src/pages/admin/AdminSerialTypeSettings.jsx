import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminSerialTypeSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    show_serial_options: true,
    terms_popup_title: 'সিরিয়াল দিতে যা মেনে চলতে হবে',
    terms_popup_subtitle: 'সাধারন সিরিয়াল নিতে হলে নিচের নিয়মগুলো মেনে চলতে হবে',
    terms_popup_checkbox_text: 'আমি উপরের সকল শর্তাবলী পড়েছি এবং মেনে চলতে সম্মত আছি',
    terms_popup_button_text: 'পরবর্তী ধাপে যান',
    terms_points: [
      { icon: '1', title: 'সময়মতো উপস্থিত থাকুন', description: 'আপনার সিরিয়াল নম্বর অনুযায়ী নির্ধারিত সময়ে চেম্বারে উপস্থিত থাকুন।' },
      { icon: '2', title: 'প্রয়োজনীয় কাগজপত্র আনুন', description: 'পূর্বের প্রেসক্রিপশন, টেস্ট রিপোর্ট এবং অন্যান্য মেডিকেল ডকুমেন্ট সাথে আনুন।' },
      { icon: '3', title: 'ফি নগদে প্রদান করুন', description: 'ডাক্তারের চেম্বারে নির্ধারিত ফি নগদে পরিশোধ করতে হবে।' },
      { icon: '4', title: 'ধৈর্য ধরুন', description: 'সাধারন সিরিয়ালে অপেক্ষার সময় বেশি হতে পারে, তাই ধৈর্য ধরুন।' },
      { icon: '5', title: 'সিরিয়াল বাতিল নীতি', description: 'যদি আসতে না পারেন, অন্তত ২ ঘন্টা আগে সিরিয়াল বাতিল করুন।' }
    ]
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
        .from('serial_type_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings({
          show_serial_options: data.show_serial_options ?? true,
          terms_popup_title: data.terms_popup_title || settings.terms_popup_title,
          terms_popup_subtitle: data.terms_popup_subtitle || settings.terms_popup_subtitle,
          terms_popup_checkbox_text: data.terms_popup_checkbox_text || settings.terms_popup_checkbox_text,
          terms_popup_button_text: data.terms_popup_button_text || settings.terms_popup_button_text,
          terms_points: data.terms_points || settings.terms_points
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
        .from('serial_type_settings')
        .select('id')
        .single()

      if (existing) {
        const { error } = await supabase
          .from('serial_type_settings')
          .update(settings)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('serial_type_settings')
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

  function handleToggleChange(e) {
    setSettings(prev => ({ ...prev, show_serial_options: e.target.checked }))
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  function handlePointChange(index, field, value) {
    const updatedPoints = [...settings.terms_points]
    updatedPoints[index] = { ...updatedPoints[index], [field]: value }
    setSettings(prev => ({ ...prev, terms_points: updatedPoints }))
  }

  function addPoint() {
    const newPoint = {
      icon: String(settings.terms_points.length + 1),
      title: '',
      description: ''
    }
    setSettings(prev => ({ ...prev, terms_points: [...prev.terms_points, newPoint] }))
  }

  function removePoint(index) {
    if (settings.terms_points.length <= 1) {
      alert('অন্তত একটি পয়েন্ট থাকতে হবে')
      return
    }
    const updatedPoints = settings.terms_points.filter((_, i) => i !== index)
    updatedPoints.forEach((point, i) => {
      point.icon = String(i + 1)
    })
    setSettings(prev => ({ ...prev, terms_points: updatedPoints }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
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
      
      <div className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-800">সিরিয়ালের ধরন</h1>
            <p className="text-sm lg:text-base text-gray-600">সিরিয়াল বুকিং অপশন সেটিংস</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 lg:space-y-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                সিরিয়াল অপশন নিয়ন্ত্রণ
              </h2>
            </div>
            <div className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 lg:p-6 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border-2 border-purple-100">
                <div className="flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-1">পেইড ও সাধারন সিরিয়াল অপশন দেখান</h3>
                  <p className="text-xs lg:text-sm text-gray-600">
                    {settings.show_serial_options 
                      ? '✅ চালু: ব্যবহারকারীরা পেইড এবং সাধারন দুই ধরনের সিরিয়াল থেকে বাছাই করতে পারবে'
                      : '⚠️ বন্ধ: ব্যবহারকারীরা শুধু সাধারন সিরিয়াল নিতে পারবে এবং শর্তাবলী পপআপ দেখবে'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.show_serial_options}
                    onChange={handleToggleChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 lg:w-16 lg:h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 lg:after:h-7 lg:after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500 shadow-inner"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">
                    {settings.show_serial_options ? 'চালু' : 'বন্ধ'}
                  </span>
                </label>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:p-6 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="flex items-center gap-3 p-3 lg:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 text-sm lg:text-base">চালু থাকলে</p>
                    <p className="text-xs lg:text-sm text-green-600">পেইড ও সাধারন সিরিয়াল অপশন দেখাবে</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 lg:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-orange-800 text-sm lg:text-base">বন্ধ থাকলে</p>
                    <p className="text-xs lg:text-sm text-orange-600">শর্তাবলী পপআপ দেখিয়ে সাধারন সিরিয়ালে যাবে</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${settings.show_serial_options ? 'opacity-50' : ''}`}>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                শর্তাবলী পপআপ সেটিংস
                {settings.show_serial_options && <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded">(টগোল বন্ধ থাকলে কার্যকর)</span>}
              </h2>
            </div>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">পপআপ শিরোনাম</label>
                  <input
                    type="text"
                    name="terms_popup_title"
                    value={settings.terms_popup_title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="পপআপ শিরোনাম লিখুন"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">পপআপ সাবটাইটেল</label>
                  <input
                    type="text"
                    name="terms_popup_subtitle"
                    value={settings.terms_popup_subtitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="পপআপ সাবটাইটেল লিখুন"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">চেকবক্স টেক্সট</label>
                  <input
                    type="text"
                    name="terms_popup_checkbox_text"
                    value={settings.terms_popup_checkbox_text}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="চেকবক্স টেক্সট লিখুন"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">বাটন টেক্সট</label>
                  <input
                    type="text"
                    name="terms_popup_button_text"
                    value={settings.terms_popup_button_text}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="বাটন টেক্সট লিখুন"
                  />
                </div>
              </div>

              <div className="border-t pt-4 lg:pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-2">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800">শর্তাবলী পয়েন্টসমূহ</h3>
                  <button
                    type="button"
                    onClick={addPoint}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    নতুন পয়েন্ট যোগ করুন
                  </button>
                </div>

                <div className="space-y-4">
                  {settings.terms_points.map((point, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4 border border-purple-100 relative group">
                      <div className="absolute -top-2 -left-2 w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePoint(index)}
                        className="absolute top-2 right-2 w-7 h-7 lg:w-8 lg:h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="ml-6 lg:ml-8 space-y-3">
                        <div>
                          <label className="block text-xs lg:text-sm font-medium text-gray-600 mb-1">শিরোনাম</label>
                          <input
                            type="text"
                            value={point.title}
                            onChange={(e) => handlePointChange(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                            placeholder="পয়েন্ট শিরোনাম"
                          />
                        </div>
                        <div>
                          <label className="block text-xs lg:text-sm font-medium text-gray-600 mb-1">বিবরণ</label>
                          <textarea
                            value={point.description}
                            onChange={(e) => handlePointChange(index, 'description', e.target.value)}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
                            placeholder="পয়েন্ট বিবরণ"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                পপআপ প্রিভিউ
              </h2>
            </div>
            <div className="p-4 lg:p-6">
              <div className="bg-gray-800 rounded-2xl p-4 max-w-sm mx-auto">
                <div className="bg-white rounded-xl p-4">
                  <h3 className="text-sm lg:text-base font-bold text-gray-800 mb-1">{settings.terms_popup_title || 'শিরোনাম'}</h3>
                  <p className="text-xs text-gray-500 mb-3">{settings.terms_popup_subtitle || 'সাবটাইটেল'}</p>
                  
                  <div className="space-y-1.5 mb-3">
                    {settings.terms_points.slice(0, 3).map((point, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-xs leading-tight">{point.title || 'শিরোনাম'}</p>
                          <p className="text-[10px] text-gray-500 leading-tight">{point.description || 'বিবরণ'}</p>
                        </div>
                      </div>
                    ))}
                    {settings.terms_points.length > 3 && (
                      <p className="text-center text-[10px] text-gray-400">+{settings.terms_points.length - 3} আরও</p>
                    )}
                  </div>

                  <label className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg mb-2">
                    <div className="w-3.5 h-3.5 border-2 border-purple-500 rounded bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-700 leading-tight">{settings.terms_popup_checkbox_text || 'চেকবক্স টেক্সট'}</span>
                  </label>

                  <button className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold text-xs">
                    {settings.terms_popup_button_text || 'বাটন টেক্সট'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 lg:px-8 py-2.5 lg:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm lg:text-base"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 lg:h-5 lg:w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default AdminSerialTypeSettings
