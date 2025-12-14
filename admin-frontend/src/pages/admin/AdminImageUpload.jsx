import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { supabase, isConfigured } from '../../lib/supabase'

function AdminImageUpload() {
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedUrl, setCopiedUrl] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('general')
  const [searchTerm, setSearchTerm] = useState('')

  const folders = [
    { id: 'general', name: 'সাধারণ' },
    { id: 'doctors', name: 'ডাক্তার' },
    { id: 'hospitals', name: 'হাসপাতাল' },
    { id: 'products', name: 'পণ্য' },
    { id: 'banners', name: 'ব্যানার' },
    { id: 'blogs', name: 'ব্লগ' },
    { id: 'others', name: 'অন্যান্য' }
  ]

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminLoggedIn')
    if (!isAdmin) {
      navigate('/admin/login')
      return
    }
    
    if (isConfigured) {
      fetchImages()
    } else {
      setLoading(false)
      setError('Supabase সংযোগ কনফিগার করা হয়নি')
    }
  }, [navigate, selectedFolder])

  async function fetchImages() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .storage
        .from('images')
        .list(selectedFolder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      const imageList = data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('images')
            .getPublicUrl(`${selectedFolder}/${file.name}`)
          
          return {
            ...file,
            publicUrl,
            fullPath: `${selectedFolder}/${file.name}`
          }
        })

      setImages(imageList)
    } catch (err) {
      console.error('Error fetching images:', err)
      setError('ছবি লোড করতে সমস্যা হয়েছে: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(event) {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const fileName = `${timestamp}-${randomStr}.${fileExt}`
        const filePath = `${selectedFolder}/${fileName}`

        const { data, error } = await supabase.storage
          .from('images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error
        return data
      })

      await Promise.all(uploadPromises)
      setSuccess(`${files.length}টি ছবি সফলভাবে আপলোড হয়েছে!`)
      fetchImages()
    } catch (err) {
      console.error('Upload error:', err)
      setError('ছবি আপলোড করতে সমস্যা হয়েছে: ' + err.message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleDelete(fullPath, fileName) {
    if (!confirm(`আপনি কি "${fileName}" মুছে ফেলতে চান?`)) return

    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([fullPath])

      if (error) throw error

      setSuccess('ছবি সফলভাবে মুছে ফেলা হয়েছে!')
      fetchImages()
    } catch (err) {
      console.error('Delete error:', err)
      setError('ছবি মুছতে সমস্যা হয়েছে: ' + err.message)
    }
  }

  function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(''), 2000)
    })
  }

  function formatFileSize(bytes) {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ছবি আপলোড</h1>
            <p className="text-gray-600 mt-1">Supabase Storage এ ছবি আপলোড করুন এবং লিংক কপি করুন</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ফোল্ডার নির্বাচন করুন
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ছবি আপলোড করুন
              </label>
              <label className={`flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>আপলোড হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>ছবি নির্বাচন করুন</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF, WebP সাপোর্টেড। একসাথে একাধিক ছবি আপলোড করা যাবে।</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="ছবি খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchImages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                রিফ্রেশ
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">ছবি লোড হচ্ছে...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">এই ফোল্ডারে কোনো ছবি নেই</p>
              <p className="text-gray-400 text-sm mt-1">উপরে ছবি আপলোড করুন</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {filteredImages.map((image) => (
                <div key={image.id || image.name} className="bg-gray-50 rounded-lg overflow-hidden border hover:shadow-md transition-shadow">
                  <div className="aspect-square relative">
                    <img
                      src={image.publicUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-800 truncate" title={image.name}>
                      {image.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(image.metadata?.size)}</span>
                      <span>{formatDate(image.created_at)}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => copyToClipboard(image.publicUrl)}
                        className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          copiedUrl === image.publicUrl
                            ? 'bg-green-100 text-green-700'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }`}
                      >
                        {copiedUrl === image.publicUrl ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            কপি হয়েছে
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            লিংক কপি
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(image.fullPath, image.name)}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">💡 ব্যবহার নির্দেশিকা</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ছবি আপলোড করার পর "লিংক কপি" বাটনে ক্লিক করুন</li>
            <li>• কপি করা লিংক সরাসরি ওয়েবসাইটে ব্যবহার করতে পারবেন</li>
            <li>• ছবি বিভিন্ন ফোল্ডারে সংগঠিত রাখুন</li>
            <li>• সমর্থিত ফরম্যাট: PNG, JPG, GIF, WebP</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminImageUpload
