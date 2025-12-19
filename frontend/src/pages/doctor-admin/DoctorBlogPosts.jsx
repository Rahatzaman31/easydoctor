import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

const blogCategories = [
  'স্বাস্থ্য টিপস',
  'রোগ প্রতিরোধ',
  'পুষ্টি ও খাদ্য',
  'মানসিক স্বাস্থ্য',
  'শিশু স্বাস্থ্য',
  'নারী স্বাস্থ্য',
  'ডায়াবেটিস',
  'হৃদরোগ',
  'ক্যান্সার',
  'চর্মরোগ',
  'চোখের যত্ন',
  'দাঁতের যত্ন',
  'ব্যায়াম ও ফিটনেস'
]

function DoctorBlogPosts() {
  const navigate = useNavigate()
  const editorRef = useRef(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    categories: [],
    tags: ''
  })
  const doctorId = localStorage.getItem('doctorId')
  const doctorName = localStorage.getItem('doctorName')

  useEffect(() => {
    if (!localStorage.getItem('doctorLoggedIn')) {
      navigate('/doctor.admin/login')
      return
    }
    fetchPosts()
  }, [])

  useEffect(() => {
    if (showModal && editorRef.current) {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = formData.content || ''
          editorRef.current.focus()
        }
      }, 100)
    }
  }, [showModal])

  async function fetchPosts() {
    try {
      if (!supabase || !isConfigured || !doctorId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('doctor_blog_drafts')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  function openAddModal() {
    setEditingPost(null)
    const newFormData = {
      title: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      categories: [],
      tags: ''
    }
    setFormData(newFormData)
    if (editorRef.current) {
      editorRef.current.innerHTML = ''
    }
    setShowModal(true)
  }

  function openEditModal(post) {
    setEditingPost(post)
    const newFormData = {
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured_image_url: post.featured_image_url || '',
      categories: post.categories || [],
      tags: post.tags?.join(', ') || ''
    }
    setFormData(newFormData)
    if (editorRef.current) {
      editorRef.current.innerHTML = post.content || ''
    }
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      const postData = {
        doctor_id: doctorId,
        doctor_name: doctorName,
        title: formData.title,
        slug: generateSlug(formData.title),
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image_url: formData.featured_image_url,
        categories: formData.categories,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        status: 'draft'
      }

      if (editingPost) {
        const { error } = await supabase
          .from('doctor_blog_drafts')
          .update(postData)
          .eq('id', editingPost.id)

        if (error) throw error
        alert('পোস্ট সফলভাবে আপডেট হয়েছে!')
      } else {
        const { error } = await supabase
          .from('doctor_blog_drafts')
          .insert([postData])

        if (error) throw error
        alert('পোস্ট সফলভাবে সংরক্ষিত হয়েছে! এডমিন অনুমোদনের পর প্রকাশিত হবে।')
      }

      setShowModal(false)
      fetchPosts()
    } catch (error) {
      console.error('Blog Post Error:', error)
      alert('সমস্যা হয়েছে: ' + (error.message || JSON.stringify(error)))
    }
  }

  async function submitForReview(postId) {
    try {
      if (!supabase || !isConfigured) return

      const { error } = await supabase
        .from('doctor_blog_drafts')
        .update({ status: 'pending_review' })
        .eq('id', postId)

      if (error) throw error
      alert('পোস্ট রিভিউয়ের জন্য পাঠানো হয়েছে!')
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
      alert('সমস্যা হয়েছে')
    }
  }

  async function handleDelete(id) {
    if (!confirm('আপনি কি নিশ্চিত এই পোস্টটি মুছে ফেলতে চান?')) return

    try {
      if (!supabase || !isConfigured) return

      const { error } = await supabase
        .from('doctor_blog_drafts')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
      alert('মুছে ফেলতে সমস্যা হয়েছে')
    }
  }

  function execCommand(command, value = null) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    handleEditorChange()
  }

  function handleEditorChange() {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      setFormData(prev => ({ ...prev, content }))
    }
  }

  function toggleCategory(category) {
    const newCategories = formData.categories.includes(category)
      ? formData.categories.filter(c => c !== category)
      : [...formData.categories, category]
    setFormData({ ...formData, categories: newCategories })
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function getStatusBadge(status) {
    const badges = {
      draft: { text: 'ড্রাফট', class: 'bg-gray-100 text-gray-700' },
      pending_review: { text: 'রিভিউ অপেক্ষমান', class: 'bg-yellow-100 text-yellow-700' },
      approved: { text: 'অনুমোদিত', class: 'bg-green-100 text-green-700' },
      rejected: { text: 'প্রত্যাখ্যাত', class: 'bg-red-100 text-red-700' },
      published: { text: 'প্রকাশিত', class: 'bg-blue-100 text-blue-700' }
    }
    return badges[status] || badges.draft
  }

  return (
    <div className="p-4 pt-16 lg:pt-6 lg:p-8 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">আমার ব্লগ পোষ্ট</h1>
            <p className="text-gray-500 mt-1">স্বাস্থ্য বিষয়ক ব্লগ লিখুন</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            নতুন পোস্ট
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-blue-800 font-medium">পোস্ট পাবলিশ সম্পর্কে</p>
              <p className="text-blue-600 text-sm mt-1">
                আপনার পোস্ট সরাসরি প্রকাশিত হবে না। এডমিন রিভিউ করার পর অনুমোদন করলে প্রকাশিত হবে।
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <span className="text-5xl mb-4 block">📝</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো ব্লগ পোস্ট নেই</h3>
            <p className="text-gray-500">উপরের বাটনে ক্লিক করে নতুন পোস্ট লিখুন</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map(post => {
              const badge = getStatusBadge(post.status)
              return (
                <div key={post.id} className="bg-white rounded-xl shadow-md p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {post.featured_image_url && (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full lg:w-32 h-40 lg:h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800 line-clamp-2">{post.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badge.class}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-2">{post.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                        <span>{formatDate(post.created_at)}</span>
                        {post.categories?.length > 0 && (
                          <>
                            <span>•</span>
                            {post.categories.slice(0, 2).map((cat, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{cat}</span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex lg:flex-col gap-2">
                      {post.status === 'draft' && (
                        <button
                          onClick={() => submitForReview(post.id)}
                          className="flex-1 lg:flex-none px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                        >
                          রিভিউতে পাঠান
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(post)}
                        className="flex-1 lg:flex-none px-4 py-2 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-200"
                      >
                        সম্পাদনা
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="flex-1 lg:flex-none px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>
                  {post.admin_notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>এডমিন নোট:</strong> {post.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPost ? 'পোস্ট সম্পাদনা করুন' : 'নতুন পোস্ট লিখুন'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  placeholder="পোস্টের শিরোনাম"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ফিচার্ড ছবি URL</label>
                <input
                  type="url"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  placeholder="পোস্টের সংক্ষিপ্ত বিবরণ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">বিভাগ</label>
                <div className="flex flex-wrap gap-2">
                  {blogCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.categories.includes(cat)
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ট্যাগ (কমা দিয়ে আলাদা)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  placeholder="স্বাস্থ্য, ডায়েট, ফিটনেস"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">বিস্তারিত *</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
                    <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded font-bold">B</button>
                    <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded italic">I</button>
                    <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded underline">U</button>
                    <div className="w-px bg-gray-300 mx-1"></div>
                    <button type="button" onClick={() => execCommand('formatBlock', 'h2')} className="p-2 hover:bg-gray-200 rounded text-sm font-bold">H2</button>
                    <button type="button" onClick={() => execCommand('formatBlock', 'h3')} className="p-2 hover:bg-gray-200 rounded text-sm font-bold">H3</button>
                    <button type="button" onClick={() => execCommand('formatBlock', 'p')} className="p-2 hover:bg-gray-200 rounded text-sm">P</button>
                    <div className="w-px bg-gray-300 mx-1"></div>
                    <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded">• List</button>
                    <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded">1. List</button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable="true"
                    onInput={handleEditorChange}
                    onBlur={handleEditorChange}
                    className="min-h-[300px] p-4 focus:outline-none prose max-w-none"
                    style={{ whiteSpace: 'pre-wrap' }}
                    suppressContentEditableWarning={true}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700"
                >
                  ড্রাফট সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorBlogPosts
