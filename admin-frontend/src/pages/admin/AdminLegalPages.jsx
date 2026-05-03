import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { supabase, isConfigured } from '../../lib/supabase'

const defaultPages = [
  { slug: 'editorial-policy', title: 'Editorial Policy', title_bn: 'সম্পাদকীয় নীতি', icon_type: 'document' },
  { slug: 'advertisement-policy', title: 'Advertisement Policy', title_bn: 'বিজ্ঞাপন নীতি', icon_type: 'megaphone' },
  { slug: 'correction-policy', title: 'Correction Policy', title_bn: 'সংশোধন নীতি', icon_type: 'edit' },
  { slug: 'terms-of-use', title: 'Terms of Use', title_bn: 'ব্যবহারের শর্তাবলী', icon_type: 'clipboard' },
  { slug: 'doctors-terms', title: "Doctor's Terms and Conditions", title_bn: 'ডক্টর্স টার্মস এ্যান্ড কন্ডিশন', icon_type: 'shield' }
]

const iconOptions = [
  { value: 'document', label: 'ডকুমেন্ট' },
  { value: 'megaphone', label: 'মেগাফোন' },
  { value: 'edit', label: 'সম্পাদনা' },
  { value: 'clipboard', label: 'ক্লিপবোর্ড' },
  { value: 'shield', label: 'শিল্ড' }
]

function AdminLegalPages() {
  const navigate = useNavigate()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPage, setEditingPage] = useState(null)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef(null)
  
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    title_bn: '',
    content: '',
    meta_title: '',
    meta_description: '',
    icon_type: 'document',
    is_active: true,
    display_order: 0
  })

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchPages()
  }, [])

  useEffect(() => {
    if (showModal && editorRef.current) {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = formData.content || ''
        }
      }, 0)
    }
  }, [showModal, editingPage])

  async function fetchPages() {
    try {
      if (!supabase || !isConfigured) {
        setPages(defaultPages.map((p, i) => ({ ...p, id: i + 1, is_active: true, display_order: i + 1 })))
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error('Error:', error)
      setPages(defaultPages.map((p, i) => ({ ...p, id: i + 1, is_active: true, display_order: i + 1 })))
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(page) {
    setEditingPage(page)
    setFormData({
      slug: page.slug || '',
      title: page.title || '',
      title_bn: page.title_bn || '',
      content: page.content || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      icon_type: page.icon_type || 'document',
      is_active: page.is_active !== false,
      display_order: page.display_order || 0
    })
    setShowModal(true)
  }

  function openAddModal() {
    setEditingPage(null)
    setFormData({
      slug: '',
      title: '',
      title_bn: '',
      content: '',
      meta_title: '',
      meta_description: '',
      icon_type: 'document',
      is_active: true,
      display_order: pages.length + 1
    })
    setShowModal(true)
  }

  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  function execCommand(command, value = null) {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  function insertHeading(level) {
    document.execCommand('formatBlock', false, `h${level}`)
    editorRef.current?.focus()
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

      const content = editorRef.current?.innerHTML || ''
      
      const pageData = {
        slug: formData.slug || generateSlug(formData.title),
        title: formData.title,
        title_bn: formData.title_bn,
        content: content,
        meta_title: formData.meta_title || formData.title_bn,
        meta_description: formData.meta_description,
        icon_type: formData.icon_type,
        is_active: formData.is_active,
        display_order: formData.display_order,
        last_updated: new Date().toISOString()
      }

      if (editingPage) {
        const { error } = await supabase
          .from('legal_pages')
          .update(pageData)
          .eq('id', editingPage.id)
        
        if (error) throw error
        alert('সফলভাবে আপডেট হয়েছে!')
      } else {
        const { error } = await supabase
          .from('legal_pages')
          .insert([pageData])
        
        if (error) throw error
        alert('সফলভাবে যোগ করা হয়েছে!')
      }

      setShowModal(false)
      fetchPages()
    } catch (error) {
      console.error('Error:', error)
      alert('সংরক্ষণ করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id, currentStatus) {
    try {
      if (!supabase || !isConfigured) return
      
      const { error } = await supabase
        .from('legal_pages')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      fetchPages()
    } catch (error) {
      console.error('Error:', error)
      alert('আপডেট করতে সমস্যা হয়েছে')
    }
  }

  const iconMap = {
    document: '📄',
    megaphone: '📢',
    edit: '✏️',
    clipboard: '📋',
    shield: '🛡️'
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">আইনগত পেজ ম্যানেজমেন্ট</h1>
            <p className="text-gray-500 mt-1">সম্পাদকীয় নীতি, বিজ্ঞাপন নীতি, শর্তাবলী ইত্যাদি পরিচালনা করুন</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            নতুন পেজ
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো পেজ নেই</h3>
            <p className="text-gray-500">নতুন আইনগত পেজ যোগ করতে উপরের বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pages.map((page) => (
              <div 
                key={page.id} 
                className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl">
                    {iconMap[page.icon_type] || '📄'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{page.title_bn}</h3>
                    <p className="text-gray-500 text-sm">{page.title} • /{page.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={page.is_active}
                      onChange={() => toggleActive(page.id, page.is_active)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    <span className="ml-2 text-sm text-gray-600">{page.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                  </label>

                  <button
                    onClick={() => openEditModal(page)}
                    className="bg-teal-50 text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    সম্পাদনা
                  </button>

                  <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    দেখুন
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl">
              <div className="p-6 border-b bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">
                  {editingPage ? 'পেজ সম্পাদনা করুন' : 'নতুন পেজ যোগ করুন'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">পেজ শিরোনাম (বাংলা) *</label>
                    <input
                      type="text"
                      value={formData.title_bn}
                      onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="যেমন: সম্পাদকীয় নীতি"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">পেজ শিরোনাম (English) *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., Editorial Policy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">স্লাগ (URL)</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="editorial-policy"
                    />
                    <p className="text-xs text-gray-500 mt-1">খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">আইকন</label>
                    <select
                      value={formData.icon_type}
                      onChange={(e) => setFormData({ ...formData, icon_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {iconOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {iconMap[opt.value]} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">কন্টেন্ট *</label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex flex-wrap gap-1">
                      <button type="button" onClick={() => execCommand('bold')} className="px-3 py-1 hover:bg-gray-200 rounded font-bold">B</button>
                      <button type="button" onClick={() => execCommand('italic')} className="px-3 py-1 hover:bg-gray-200 rounded italic">I</button>
                      <button type="button" onClick={() => execCommand('underline')} className="px-3 py-1 hover:bg-gray-200 rounded underline">U</button>
                      <span className="border-l mx-2"></span>
                      <button type="button" onClick={() => insertHeading(2)} className="px-3 py-1 hover:bg-gray-200 rounded text-sm font-bold">H2</button>
                      <button type="button" onClick={() => insertHeading(3)} className="px-3 py-1 hover:bg-gray-200 rounded text-sm font-bold">H3</button>
                      <button type="button" onClick={() => insertHeading(4)} className="px-3 py-1 hover:bg-gray-200 rounded text-sm font-bold">H4</button>
                      <span className="border-l mx-2"></span>
                      <button type="button" onClick={() => execCommand('insertUnorderedList')} className="px-3 py-1 hover:bg-gray-200 rounded">• List</button>
                      <button type="button" onClick={() => execCommand('insertOrderedList')} className="px-3 py-1 hover:bg-gray-200 rounded">1. List</button>
                      <span className="border-l mx-2"></span>
                      <button type="button" onClick={() => {
                        const url = prompt('লিংক URL দিন:')
                        if (url) execCommand('createLink', url)
                      }} className="px-3 py-1 hover:bg-gray-200 rounded">🔗</button>
                    </div>
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[300px] p-4 focus:outline-none prose max-w-none"
                      onInput={(e) => setFormData({ ...formData, content: e.currentTarget.innerHTML })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">মেটা শিরোনাম (SEO)</label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="সার্চ ইঞ্জিনে দেখানো হবে"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">ডিসপ্লে অর্ডার</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">মেটা বিবরণ (SEO)</label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={2}
                    placeholder="সার্চ ইঞ্জিনে দেখানো হবে"
                  />
                </div>

                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    <span className="ml-3 text-gray-700 font-medium">পেজ সক্রিয় রাখুন</span>
                  </label>
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

export default AdminLegalPages
