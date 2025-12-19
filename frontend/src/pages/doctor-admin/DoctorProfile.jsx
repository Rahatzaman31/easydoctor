import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { supabase, isConfigured } from '../../lib/supabase'
import DoctorAdminSidebar from '../../components/DoctorAdminSidebar'
import RichTextEditor from '../../components/RichTextEditor'

const categories = [
  { id: 'medicine', name: 'মেডিসিন বিশেষজ্ঞ' },
  { id: 'cardiology', name: 'হৃদরোগ বিশেষজ্ঞ' },
  { id: 'neurology', name: 'স্নায়ুরোগ বিশেষজ্ঞ' },
  { id: 'orthopedics', name: 'অর্থোপেডিক বিশেষজ্ঞ' },
  { id: 'gynecology', name: 'স্ত্রী ও প্রসূতি রোগ বিশেষজ্ঞ' },
  { id: 'pediatrics', name: 'শিশু রোগ বিশেষজ্ঞ' },
  { id: 'dermatology', name: 'চর্ম ও যৌন রোগ বিশেষজ্ঞ' },
  { id: 'ent', name: 'নাক-কান-গলা বিশেষজ্ঞ' },
  { id: 'gastroenterology', name: 'পরিপাকতন্ত্র বিশেষজ্ঞ' },
  { id: 'urology', name: 'মূত্ররোগ বিশেষজ্ঞ' },
  { id: 'psychiatry', name: 'মানসিক রোগ বিশেষজ্ঞ' },
  { id: 'ophthalmology', name: 'চক্ষু রোগ বিশেষজ্ঞ' },
  { id: 'dental', name: 'দন্ত বিশেষজ্ঞ' },
  { id: 'surgery', name: 'সার্জারি বিশেষজ্ঞ' }
]

const weekDays = [
  { id: 'saturday', name: 'শনিবার' },
  { id: 'sunday', name: 'রবিবার' },
  { id: 'monday', name: 'সোমবার' },
  { id: 'tuesday', name: 'মঙ্গলবার' },
  { id: 'wednesday', name: 'বুধবার' },
  { id: 'thursday', name: 'বৃহস্পতিবার' },
  { id: 'friday', name: 'শুক্রবার' }
]

function DoctorProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [formData, setFormData] = useState({})
  const doctorId = localStorage.getItem('doctorId')

  useEffect(() => {
    if (!localStorage.getItem('doctorLoggedIn')) {
      navigate('/doctor.admin/login')
      return
    }
    fetchDoctorProfile()
  }, [])

  async function fetchDoctorProfile() {
    try {
      if (!supabase || !isConfigured || !doctorId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single()

      if (error) throw error
      setDoctor(data)
      setFormData({
        name: data.name || '',
        degrees: data.degrees || '',
        workplace_line1: data.workplace_line1 || '',
        workplace_line2: data.workplace_line2 || '',
        category: data.category || '',
        category_name: data.category_name || '',
        district: data.district || '',
        chamber_address: data.chamber_address || '',
        consultation_fee: data.consultation_fee || '',
        schedule_days: data.schedule_days ? JSON.parse(data.schedule_days) : [],
        schedule_time: data.schedule_time || '',
        about: data.about || '',
        image_url: data.image_url || '',
        notice: data.notice || '',
        visiting_card_url: data.visiting_card_url || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      const updateData = {
        name: formData.name,
        degrees: formData.degrees,
        workplace_line1: formData.workplace_line1,
        workplace_line2: formData.workplace_line2,
        category: formData.category,
        category_name: formData.category_name,
        district: formData.district,
        chamber_address: formData.chamber_address,
        consultation_fee: formData.consultation_fee,
        schedule_days: JSON.stringify(formData.schedule_days),
        schedule_time: formData.schedule_time,
        about: formData.about,
        image_url: formData.image_url,
        notice: formData.notice,
        visiting_card_url: formData.visiting_card_url
      }

      const { error } = await supabase
        .from('doctors')
        .update(updateData)
        .eq('id', doctorId)

      if (error) throw error

      localStorage.setItem('doctorName', formData.name)
      alert('প্রোফাইল সফলভাবে আপডেট হয়েছে!')
      setEditing(false)
      fetchDoctorProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('আপডেট করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  function handleCategoryChange(categoryId) {
    const cat = categories.find(c => c.id === categoryId)
    setFormData({
      ...formData,
      category: categoryId,
      category_name: cat?.name || categoryId
    })
  }

  function toggleScheduleDay(dayId) {
    const newDays = formData.schedule_days.includes(dayId)
      ? formData.schedule_days.filter(d => d !== dayId)
      : [...formData.schedule_days, dayId]
    setFormData({ ...formData, schedule_days: newDays })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DoctorAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorAdminSidebar />

      <div className="flex-1 p-4 pt-16 lg:pt-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">আমার প্রোফাইল</h1>
            <p className="text-gray-500 mt-1">আপনার প্রোফাইল তথ্য দেখুন ও সম্পাদনা করুন</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              প্রোফাইল সম্পাদনা
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="relative">
                {doctor?.image_url ? (
                  <img
                    src={doctor.image_url}
                    alt={doctor.name}
                    className="w-32 h-32 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-teal-100 flex items-center justify-center">
                    <span className="text-5xl">👨‍⚕️</span>
                  </div>
                )}
              </div>
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold text-gray-800">{doctor?.name}</h2>
                <p className="text-teal-600 font-medium">{doctor?.category_name}</p>
                <p className="text-gray-500 mt-1">{doctor?.degrees}</p>
                <div className="flex items-center gap-4 mt-3 justify-center lg:justify-start">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold">{doctor?.rating || '0'}</span>
                  </div>
                  <div className="text-gray-500">
                    {doctor?.reviews_count || 0} রিভিউ
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 space-y-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">নাম</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ডিগ্রী</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.degrees}
                    onChange={(e) => setFormData({ ...formData, degrees: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.degrees}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">বিভাগ</label>
                {editing ? (
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.category_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">জেলা</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.district}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">কর্মস্থল (লাইন ১)</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.workplace_line1}
                    onChange={(e) => setFormData({ ...formData, workplace_line1: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.workplace_line1 || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">কর্মস্থল (লাইন ২)</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.workplace_line2}
                    onChange={(e) => setFormData({ ...formData, workplace_line2: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.workplace_line2 || '-'}</p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">চেম্বারের ঠিকানা</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.chamber_address}
                    onChange={(e) => setFormData({ ...formData, chamber_address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.chamber_address || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">পরামর্শ ফি</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.consultation_fee || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">সময়সূচী</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                    placeholder="সন্ধ্যা ৫টা - রাত ৯টা"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.schedule_time || '-'}</p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">সাপ্তাহিক ছুটি</label>
                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleScheduleDay(day.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.schedule_days.includes(day.id)
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {doctor?.schedule_days ? JSON.parse(doctor.schedule_days).map(dayId => {
                      const day = weekDays.find(d => d.id === dayId)
                      return day ? (
                        <span key={dayId} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm">
                          {day.name}
                        </span>
                      ) : null
                    }) : <span className="text-gray-500">-</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ছবির URL</label>
                {editing ? (
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl truncate">{doctor?.image_url || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ভিজিটিং কার্ড URL</label>
                {editing ? (
                  <input
                    type="url"
                    value={formData.visiting_card_url}
                    onChange={(e) => setFormData({ ...formData, visiting_card_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl truncate">{doctor?.visiting_card_url || '-'}</p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">নোটিশ</label>
                {editing ? (
                  <textarea
                    value={formData.notice}
                    onChange={(e) => setFormData({ ...formData, notice: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">{doctor?.notice || '-'}</p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">সম্পর্কে</label>
                {editing ? (
                  <RichTextEditor
                    key={`about-${doctor?.id || 'new'}`}
                    value={formData.about}
                    onChange={(value) => setFormData({ ...formData, about: value })}
                    placeholder="আপনার সম্পর্কে লিখুন..."
                  />
                ) : (
                  doctor?.about ? (
                    <div 
                      className="prose prose-sm max-w-none text-gray-800 bg-gray-50 px-4 py-3 rounded-xl"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doctor.about) }}
                    />
                  ) : (
                    <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-xl">-</p>
                  )
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">অপরিবর্তনীয় তথ্য</h3>
              <p className="text-sm text-gray-500 mb-4">নিচের তথ্যগুলো শুধুমাত্র এডমিন পরিবর্তন করতে পারবে</p>
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ফোন নম্বর</label>
                  <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-xl">{doctor?.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">অ্যাক্সেস কোড</label>
                  <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-xl font-mono">{doctor?.access_code || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">সাধারণ সিরিয়াল লিমিট</label>
                  <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-xl">{doctor?.daily_appointment_limit || '0'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">পেইড সিরিয়াল লিমিট</label>
                  <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-xl">{doctor?.paid_appointment_limit || '0'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">রেটিং</label>
                  <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-xl flex items-center gap-2">
                    <span className="text-yellow-500">⭐</span> {doctor?.rating || '0'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">রিভিউ সংখ্যা</label>
                  <p className="text-gray-800 bg-gray-100 px-4 py-3 rounded-xl">{doctor?.reviews_count || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorProfile
