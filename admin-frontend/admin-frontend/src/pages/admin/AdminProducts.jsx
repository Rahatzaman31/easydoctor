import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { supabase, isConfigured } from '../../lib/supabase'

const defaultCategories = [
  'থার্মোমিটার',
  'ব্লাড প্রেসার মনিটর',
  'গ্লুকোমিটার',
  'পালস অক্সিমিটার',
  'স্টেথোস্কোপ',
  'নেবুলাইজার',
  'অক্সিজেন কনসেন্ট্রেটর',
  'অক্সিজেন সিলিন্ডার',
  'হিয়ারিং এইড',
  'হুইলচেয়ার',
  'ওয়াকার',
  'ক্রাচ',
  'হট ওয়াটার ব্যাগ',
  'আইস ব্যাগ',
  'ইলেকট্রিক হিটিং প্যাড',
  'ওয়েট স্কেল',
  'বিপি কাফ',
  'ব্লাড গ্লুকোজ স্ট্রিপ',
  'ইনসুলিন সিরিঞ্জ',
  'সার্জিক্যাল গ্লাভস',
  'মাস্ক',
  'স্যানিটাইজার',
  'ফার্স্ট এইড কিট',
  'ব্যান্ডেজ ও ড্রেসিং',
  'ব্রেস ও সাপোর্ট',
  'কম্প্রেশন স্টকিংস',
  'সাকশন মেশিন',
  'ভেপোরাইজার',
  'মেডিক্যাল বেড',
  'পেশেন্ট মনিটর',
  'অন্যান্য'
]

function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    sale_price: '',
    image_url: '',
    category: '',
    stock_quantity: 0,
    is_active: true,
    is_featured: false,
    manufacturer: '',
    usage_instructions: '',
    warnings: '',
    ingredients: '',
    display_order: 0,
    average_rating: 0
  })

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      navigate('/admin/login')
      return
    }
    fetchProducts()
  }, [navigate])

  async function fetchProducts() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(product = null) {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price || '',
        sale_price: product.sale_price || '',
        image_url: product.image_url || '',
        category: product.category || '',
        stock_quantity: product.stock_quantity || 0,
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        manufacturer: product.manufacturer || '',
        usage_instructions: product.usage_instructions || '',
        warnings: product.warnings || '',
        ingredients: product.ingredients || '',
        display_order: product.display_order || 0,
        average_rating: product.average_rating || 0
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        short_description: '',
        price: '',
        sale_price: '',
        image_url: '',
        category: '',
        stock_quantity: 0,
        is_active: true,
        is_featured: false,
        manufacturer: '',
        usage_instructions: '',
        warnings: '',
        ingredients: '',
        display_order: 0,
        average_rating: 0
      })
    }
    setShowCustomInput(false)
    setCustomCategory('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: parseInt(formData.stock_quantity),
        display_order: parseInt(formData.display_order),
        average_rating: parseFloat(formData.average_rating) || 0
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error
      }

      setShowModal(false)
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('পণ্য সংরক্ষণ করতে সমস্যা হয়েছে।')
    }
  }

  async function handleDelete(id) {
    if (!confirm('আপনি কি নিশ্চিত যে এই পণ্যটি মুছে ফেলতে চান?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('পণ্য মুছতে সমস্যা হয়েছে।')
    }
  }

  async function toggleStatus(product, field) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ [field]: !product[field] })
        .eq('id', product.id)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">মেডি পণ্য</h1>
            <p className="text-gray-600">স্বাস্থ্য পণ্যসমূহ পরিচালনা করুন</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            নতুন পণ্য
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">লোড হচ্ছে...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">কোনো পণ্য নেই</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">পণ্য</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">মূল্য</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">স্টক</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url || 'https://via.placeholder.com/50'}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-800">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {product.sale_price ? (
                            <>
                              <span className="font-semibold text-primary-600">৳{product.sale_price}</span>
                              <span className="text-sm text-gray-400 line-through ml-2">৳{product.price}</span>
                            </>
                          ) : (
                            <span className="font-semibold">৳{product.price}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.stock_quantity}টি
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => toggleStatus(product, 'is_active')}
                            className={`text-xs px-2 py-1 rounded ${
                              product.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {product.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </button>
                          <button
                            onClick={() => toggleStatus(product, 'is_featured')}
                            className={`text-xs px-2 py-1 rounded ${
                              product.is_featured
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {product.is_featured ? 'ফিচার্ড' : 'সাধারণ'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(product)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingProduct ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য যোগ করুন'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">পণ্যের নাম *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি</label>
                    {!showCustomInput ? (
                      <div className="space-y-2">
                        <select
                          value={formData.category}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setShowCustomInput(true)
                              setFormData({...formData, category: ''})
                            } else {
                              setFormData({...formData, category: e.target.value})
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">নির্বাচন করুন</option>
                          {defaultCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__custom__">+ নতুন ক্যাটাগরি যোগ করুন</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="নতুন ক্যাটাগরি লিখুন"
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customCategory.trim()) {
                                setFormData({...formData, category: customCategory.trim()})
                                setShowCustomInput(false)
                                setCustomCategory('')
                              }
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomInput(false)
                              setCustomCategory('')
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">কাস্টম ক্যাটাগরি লিখে টিক বাটনে ক্লিক করুন</p>
                      </div>
                    )}
                    {formData.category && !showCustomInput && (
                      <p className="text-xs text-green-600 mt-1">নির্বাচিত: {formData.category}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সংক্ষিপ্ত বিবরণ</label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত বিবরণ</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ></textarea>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">মূল্য (৳) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিক্রয় মূল্য (৳)</label>
                    <input
                      type="number"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">স্টক পরিমাণ</label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ছবির URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">প্রস্তুতকারক</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ব্যবহার বিধি</label>
                  <textarea
                    value={formData.usage_instructions}
                    onChange={(e) => setFormData({...formData, usage_instructions: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">উপাদান</label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সতর্কতা</label>
                  <textarea
                    value={formData.warnings}
                    onChange={(e) => setFormData({...formData, warnings: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ></textarea>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ক্রম</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({...formData, display_order: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">রেটিং (০-৫)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.average_rating}
                        onChange={(e) => {
                          const value = Math.min(5, Math.max(0, parseFloat(e.target.value) || 0))
                          setFormData({...formData, average_rating: value})
                        }}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        min="0"
                        max="5"
                        step="0.1"
                      />
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${star <= Math.round(formData.average_rating || 0) ? 'text-amber-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">সক্রিয়</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">ফিচার্ড</label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {editingProduct ? 'আপডেট করুন' : 'যোগ করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminProducts
