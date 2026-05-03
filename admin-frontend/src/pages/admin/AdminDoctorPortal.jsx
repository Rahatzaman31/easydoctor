import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

const packages = {
  standard: 'স্ট্যান্ডার্ড',
  professional: 'প্রোফেশনাল',
  premium: 'প্রিমিয়াম'
}

const blogStatusFilters = [
  { id: 'all', label: 'সব', icon: '📋' },
  { id: 'pending_review', label: 'দেখা হয়নি', icon: '🆕' },
  { id: 'seen', label: 'দেখা হয়েছে', icon: '👁️' },
  { id: 'published', label: 'পাবলিশ হয়েছে', icon: '✅' },
  { id: 'rejected', label: 'বাতিল', icon: '❌' }
]

function AdminDoctorPortal() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('package_requests')
  const [loading, setLoading] = useState(true)
  const [packageRequests, setPackageRequests] = useState([])
  const [blogDrafts, setBlogDrafts] = useState([])
  const [adRequests, setAdRequests] = useState([])
  const [blogFilter, setBlogFilter] = useState('all')
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [showBlogModal, setShowBlogModal] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchData()
  }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      if (activeTab === 'package_requests') {
        const { data, error } = await supabase
          .from('package_requests')
          .select('*')
          .order('created_at', { ascending: false })
        if (!error) setPackageRequests(data || [])
      } else if (activeTab === 'blog_drafts') {
        const { data, error } = await supabase
          .from('doctor_blog_drafts')
          .select('*')
          .order('created_at', { ascending: false })
        if (!error) setBlogDrafts(data || [])
      } else if (activeTab === 'ad_requests') {
        const { data, error } = await supabase
          .from('advertisement_requests')
          .select('*')
          .order('created_at', { ascending: false })
        if (!error) setAdRequests(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePackageRequest(id, status, doctorId, requestedPackage) {
    try {
      const { error: updateError } = await supabase
        .from('package_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      if (status === 'approved') {
        const packageLimits = {
          standard: { daily: 2, paid: 1, rating: 4.8 },
          professional: { daily: 5, paid: 3, rating: 4.9 },
          premium: { daily: 100, paid: 50, rating: 5.0 }
        }
        const limits = packageLimits[requestedPackage]

        const { error: doctorError } = await supabase
          .from('doctors')
          .update({
            package_type: requestedPackage,
            daily_appointment_limit: limits.daily,
            paid_appointment_limit: limits.paid,
            rating: limits.rating
          })
          .eq('id', doctorId)

        if (doctorError) throw doctorError
      }

      alert(`প্যাকেজ রিকোয়েস্ট ${status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে!`)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('সমস্যা হয়েছে')
    }
  }

  async function updateBlogDraft(id, status) {
    try {
      const updateData = { status, updated_at: new Date().toISOString() }

      const { error } = await supabase
        .from('doctor_blog_drafts')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      if (status === 'published') {
        const draft = blogDrafts.find(d => d.id === id)
        if (draft) {
          const { error: publishError } = await supabase
            .from('blog_posts')
            .insert([{
              title: draft.title,
              slug: draft.slug,
              excerpt: draft.excerpt,
              content: draft.content,
              featured_image_url: draft.featured_image_url,
              categories: draft.categories,
              tags: draft.tags,
              author: draft.doctor_name,
              status: 'published',
              published_at: new Date().toISOString()
            }])

          if (publishError) throw publishError
        }
      }

      const statusMessages = {
        seen: 'দেখা হয়েছে হিসেবে চিহ্নিত',
        published: 'পাবলিশ হয়েছে',
        rejected: 'বাতিল করা হয়েছে'
      }
      alert(`ব্লগ পোস্ট ${statusMessages[status] || 'আপডেট'} হয়েছে!`)
      setShowBlogModal(false)
      setSelectedBlog(null)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('সমস্যা হয়েছে')
    }
  }

  function openBlogDetail(blog) {
    setSelectedBlog(blog)
    setShowBlogModal(true)
    if (blog.status === 'pending_review') {
      updateBlogDraft(blog.id, 'seen')
    }
  }

  function getFilteredBlogs() {
    if (blogFilter === 'all') return blogDrafts
    return blogDrafts.filter(blog => blog.status === blogFilter)
  }

  function getBlogStatusBadge(status) {
    const badges = {
      draft: { text: 'ড্রাফট', class: 'bg-gray-100 text-gray-700' },
      pending_review: { text: 'দেখা হয়নি', class: 'bg-orange-100 text-orange-700' },
      seen: { text: 'দেখা হয়েছে', class: 'bg-blue-100 text-blue-700' },
      published: { text: 'পাবলিশ হয়েছে', class: 'bg-green-100 text-green-700' },
      rejected: { text: 'বাতিল', class: 'bg-red-100 text-red-700' }
    }
    return badges[status] || badges.draft
  }

  async function updateAdRequest(id, status) {
    try {
      const { error } = await supabase
        .from('advertisement_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      alert(`বিজ্ঞাপন রিকোয়েস্ট ${status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে!`)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('সমস্যা হয়েছে')
    }
  }

  async function updateAdPayment(id, paymentStatus) {
    try {
      const updateData = { 
        payment_status: paymentStatus,
        status: paymentStatus === 'paid' ? 'active' : 'approved'
      }

      const { error } = await supabase
        .from('advertisement_requests')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      alert('পেমেন্ট স্ট্যাটাস আপডেট হয়েছে!')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('সমস্যা হয়েছে')
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const tabs = [
    { id: 'package_requests', label: 'প্যাকেজ রিকোয়েস্ট', icon: '📦', count: packageRequests.filter(r => r.status === 'pending').length },
    { id: 'blog_drafts', label: 'ব্লগ ড্রাফট', icon: '📝', count: blogDrafts.filter(d => d.status === 'pending_review').length },
    { id: 'ad_requests', label: 'বিজ্ঞাপন রিকোয়েস্ট', icon: '📣', count: adRequests.filter(a => a.status === 'pending').length }
  ]

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex-1 p-4 pt-16 lg:pt-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">ডাক্তার পোর্টাল পরিচালনা</h1>
          <p className="text-gray-500 mt-1">ডাক্তারদের প্যাকেজ, ব্লগ এবং বিজ্ঞাপন রিকোয়েস্ট পরিচালনা করুন</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-red-500 text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {activeTab === 'package_requests' && (
              <>
                {packageRequests.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="text-5xl mb-4 block">📦</span>
                    <p className="text-gray-500">কোনো প্যাকেজ রিকোয়েস্ট নেই</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600">
                          <th className="px-6 py-4 text-sm font-semibold">তারিখ</th>
                          <th className="px-6 py-4 text-sm font-semibold">ডাক্তার</th>
                          <th className="px-6 py-4 text-sm font-semibold">বর্তমান প্যাকেজ</th>
                          <th className="px-6 py-4 text-sm font-semibold">আবেদিত প্যাকেজ</th>
                          <th className="px-6 py-4 text-sm font-semibold">স্ট্যাটাস</th>
                          <th className="px-6 py-4 text-sm font-semibold">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {packageRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-600">{formatDate(req.created_at)}</td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-800">{req.doctor_name || 'অজানা'}</p>
                              <p className="text-xs text-gray-500">ID: {req.doctor_id}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{packages[req.current_package]}</td>
                            <td className="px-6 py-4 font-medium text-teal-600">{packages[req.requested_package]}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {req.status === 'approved' ? 'অনুমোদিত' : req.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমান'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {req.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => updatePackageRequest(req.id, 'approved', req.doctor_id, req.requested_package)}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                                  >
                                    অনুমোদন
                                  </button>
                                  <button
                                    onClick={() => updatePackageRequest(req.id, 'rejected', req.doctor_id, req.requested_package)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                                  >
                                    প্রত্যাখ্যান
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'blog_drafts' && (
              <>
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {blogStatusFilters.map(filter => {
                      const count = filter.id === 'all' 
                        ? blogDrafts.length 
                        : blogDrafts.filter(b => b.status === filter.id).length
                      return (
                        <button
                          key={filter.id}
                          onClick={() => setBlogFilter(filter.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            blogFilter === filter.id
                              ? 'bg-teal-600 text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border'
                          }`}
                        >
                          <span>{filter.icon}</span>
                          <span>{filter.label}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                            blogFilter === filter.id ? 'bg-white/20' : 'bg-gray-200'
                          }`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {getFilteredBlogs().length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="text-5xl mb-4 block">📝</span>
                    <p className="text-gray-500">কোনো ব্লগ ড্রাফট নেই</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600">
                          <th className="px-6 py-4 text-sm font-semibold">শিরোনাম</th>
                          <th className="px-6 py-4 text-sm font-semibold">লেখক</th>
                          <th className="px-6 py-4 text-sm font-semibold">তারিখ</th>
                          <th className="px-6 py-4 text-sm font-semibold">স্ট্যাটাস</th>
                          <th className="px-6 py-4 text-sm font-semibold">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {getFilteredBlogs().map((draft) => {
                          const badge = getBlogStatusBadge(draft.status)
                          return (
                            <tr key={draft.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-800 line-clamp-1">{draft.title}</p>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{draft.doctor_name || 'অজানা'}</td>
                              <td className="px-6 py-4 text-gray-600">{formatDate(draft.created_at)}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                                  {badge.text}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => openBlogDetail(draft)}
                                  className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-200"
                                >
                                  বিস্তারিত
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'ad_requests' && (
              <>
                {adRequests.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="text-5xl mb-4 block">📣</span>
                    <p className="text-gray-500">কোনো বিজ্ঞাপন রিকোয়েস্ট নেই</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600">
                          <th className="px-6 py-4 text-sm font-semibold">তারিখ</th>
                          <th className="px-6 py-4 text-sm font-semibold">ডাক্তার</th>
                          <th className="px-6 py-4 text-sm font-semibold">বিজ্ঞাপনের ধরন</th>
                          <th className="px-6 py-4 text-sm font-semibold">সময়কাল</th>
                          <th className="px-6 py-4 text-sm font-semibold">মূল্য</th>
                          <th className="px-6 py-4 text-sm font-semibold">স্ট্যাটাস</th>
                          <th className="px-6 py-4 text-sm font-semibold">পেমেন্ট</th>
                          <th className="px-6 py-4 text-sm font-semibold">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {adRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-600">{formatDate(req.created_at)}</td>
                            <td className="px-6 py-4 font-medium text-gray-800">{req.doctor_name}</td>
                            <td className="px-6 py-4">
                              <p className="text-gray-800">{req.ad_type}</p>
                              {req.ad_category && (
                                <p className="text-xs text-gray-500">{req.ad_category}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{req.duration_days} দিন</td>
                            <td className="px-6 py-4 font-medium text-teal-600">৳{req.price}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                req.status === 'active' ? 'bg-green-100 text-green-700' :
                                req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                req.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {req.status === 'active' ? 'সক্রিয়' :
                                 req.status === 'approved' ? 'অনুমোদিত' :
                                 req.status === 'rejected' ? 'প্রত্যাখ্যাত' :
                                 req.status === 'expired' ? 'মেয়াদ শেষ' : 'অপেক্ষমান'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {req.status === 'approved' || req.status === 'active' ? (
                                <button
                                  onClick={() => updateAdPayment(req.id, req.payment_status === 'paid' ? 'unpaid' : 'paid')}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    req.payment_status === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {req.payment_status === 'paid' ? 'পেইড ✓' : 'বাকি'}
                                </button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {req.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => updateAdRequest(req.id, 'approved')}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                                  >
                                    অনুমোদন
                                  </button>
                                  <button
                                    onClick={() => updateAdRequest(req.id, 'rejected')}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                                  >
                                    প্রত্যাখ্যান
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showBlogModal && selectedBlog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">ব্লগ পোস্ট বিস্তারিত</h2>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getBlogStatusBadge(selectedBlog.status).class}`}>
                  {getBlogStatusBadge(selectedBlog.status).text}
                </span>
              </div>
              <button
                onClick={() => { setShowBlogModal(false); setSelectedBlog(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedBlog.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span>👨‍⚕️</span>
                    <span>{selectedBlog.doctor_name || 'অজানা'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{formatDate(selectedBlog.created_at)}</span>
                  </span>
                </div>
              </div>

              {selectedBlog.featured_image_url && (
                <div className="mb-6">
                  <img
                    src={selectedBlog.featured_image_url}
                    alt={selectedBlog.title}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
              )}

              {selectedBlog.excerpt && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-600 mb-1">সংক্ষিপ্ত বিবরণ:</p>
                  <p className="text-gray-700">{selectedBlog.excerpt}</p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-2">বিস্তারিত:</p>
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content || '<p>কোনো কন্টেন্ট নেই</p>' }}
                />
              </div>

              {selectedBlog.categories?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">বিভাগ:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBlog.categories.map((cat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedBlog.tags?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">ট্যাগ:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBlog.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => { setShowBlogModal(false); setSelectedBlog(null); }}
                className="px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
              >
                বন্ধ করুন
              </button>
              {(selectedBlog.status === 'pending_review' || selectedBlog.status === 'seen') && (
                <>
                  <button
                    onClick={() => updateBlogDraft(selectedBlog.id, 'rejected')}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    onClick={() => updateBlogDraft(selectedBlog.id, 'published')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                  >
                    পাবলিশ করুন
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDoctorPortal
