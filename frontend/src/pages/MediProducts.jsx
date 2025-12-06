import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

function MediProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showMobileCategories, setShowMobileCategories] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const categoriesWithProducts = [...new Set(products.filter(p => p.category).map(p => p.category))]

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.short_description && product.short_description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              ১০০% অরিজিনাল পণ্য
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">মেডি পণ্য</h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              মেডিক্যাল ইকুইপমেন্ট ও স্বাস্থ্য পরিমাপক যন্ত্রের সেরা সংগ্রহ। সরাসরি আপনার দোরগোড়ায়।
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-8">
          <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              placeholder="পণ্য খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {categoriesWithProducts.length > 0 && (
            <>
              <button
                onClick={() => setShowMobileCategories(!showMobileCategories)}
                className="lg:hidden flex items-center justify-between w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span className="font-medium text-gray-700">
                    {selectedCategory ? selectedCategory : 'সব ক্যাটাগরি'}
                  </span>
                </div>
                <svg className={`w-5 h-5 text-gray-500 transition-transform ${showMobileCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className={`lg:block ${showMobileCategories ? 'block' : 'hidden'} lg:w-64 flex-shrink-0`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      ক্যাটাগরি সমূহ
                    </h3>
                  </div>
                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCategory(null)
                        setShowMobileCategories(false)
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                        !selectedCategory
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        সব পণ্য
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {products.length}
                      </span>
                    </button>
                    
                    {categoriesWithProducts.map((category) => {
                      const productCount = products.filter(p => p.category === category).length
                      return (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category)
                            setShowMobileCategories(false)
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                            selectedCategory === category
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            selectedCategory === category
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {productCount}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex-1 min-w-0">
            {selectedCategory && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedCategory} <span className="text-gray-500 font-normal">({filteredProducts.length}টি পণ্য)</span>
                </h2>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  ফিল্টার সরান
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-48"></div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} size="large" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">কোনো পণ্য পাওয়া যায়নি</h3>
                <p className="text-gray-500">অন্য ক্যাটাগরি বা সার্চ টার্ম ব্যবহার করুন</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 md:p-12 text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">ডেলিভারি তথ্য</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-8">
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2">রংপুর শহর</h4>
              <p className="text-white/80 mb-2">ফ্রি হোম ডেলিভারি</p>
              <span className="inline-block bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                ৳০ ডেলিভারি চার্জ
              </span>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2">রংপুর বিভাগ ও সারাদেশ</h4>
              <p className="text-white/80 mb-2">কুরিয়ার ডেলিভারি</p>
              <span className="inline-block bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                ৳১৫০ ডেলিভারি চার্জ
              </span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default MediProducts
