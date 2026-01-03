import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

const defaultBlogCategories = [
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
  'ব্যায়াম ও ফিটনেস',
  'সম্পাদকীয়'
]

function AdminBlogs() {
  const navigate = useNavigate()
  const editorRef = useRef(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    categories: [],
    tags: '',
    author: '',
    status: 'draft'
  })
  const [showSeoSection, setShowSeoSection] = useState(false)
  const [selectedFontSize, setSelectedFontSize] = useState('16px')
  const [savedSelection, setSavedSelection] = useState(null)
  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [doctorUrls, setDoctorUrls] = useState('')
  const [doctorUrlsList, setDoctorUrlsList] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [doctorPreviews, setDoctorPreviews] = useState([])
  const [doctorModalTab, setDoctorModalTab] = useState('url')
  const [doctorCategories, setDoctorCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [categoryDoctors, setCategoryDoctors] = useState([])
  const [selectedDoctorIds, setSelectedDoctorIds] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingCategoryDoctors, setLoadingCategoryDoctors] = useState(false)
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const [customBlogCategories, setCustomBlogCategories] = useState([])
  const [showBlogCategoryForm, setShowBlogCategoryForm] = useState(false)
  const [newBlogCategoryName, setNewBlogCategoryName] = useState('')
  const [savingBlogCategory, setSavingBlogCategory] = useState(false)

  const allBlogCategories = [...new Set([
    ...defaultBlogCategories, 
    ...customBlogCategories.map(c => c.name),
    ...(formData.categories || [])
  ])]

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchPosts()
    fetchCustomBlogCategories()
  }, [])

  async function fetchCustomBlogCategories() {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('blog_categories table not found')
          setCustomBlogCategories([])
        } else {
          throw error
        }
      } else {
        setCustomBlogCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching blog categories:', error)
      setCustomBlogCategories([])
    }
  }

  async function createNewBlogCategory() {
    if (!newBlogCategoryName.trim()) {
      alert('বিভাগের নাম দিন')
      return
    }
    
    if (!supabase || !isConfigured) {
      alert('ডাটাবেস কনফিগার করা হয়নি')
      return
    }
    
    if (allBlogCategories.includes(newBlogCategoryName.trim())) {
      alert('এই নামে আগেই একটি বিভাগ আছে')
      return
    }
    
    setSavingBlogCategory(true)
    try {
      const maxOrder = customBlogCategories.length > 0 
        ? Math.max(...customBlogCategories.map(c => c.display_order || 0)) + 1 
        : 1
      
      const { data, error } = await supabase
        .from('blog_categories')
        .insert([{
          name: newBlogCategoryName.trim(),
          is_active: true,
          display_order: maxOrder
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setCustomBlogCategories([...customBlogCategories, data])
      setShowBlogCategoryForm(false)
      setNewBlogCategoryName('')
      setFormData({ ...formData, categories: [...formData.categories, data.name] })
      alert('নতুন বিভাগ সফলভাবে যোগ হয়েছে!')
    } catch (error) {
      console.error('Error creating blog category:', error)
      alert('বিভাগ তৈরিতে সমস্যা হয়েছে: ' + error.message)
    } finally {
      setSavingBlogCategory(false)
    }
  }

  useEffect(() => {
    if (showModal && editorRef.current) {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = formData.content || ''
          
          // Style existing doctor embeds for preview
          const placeholders = editorRef.current.querySelectorAll('.embedded-doctors')
          placeholders.forEach(async (placeholder) => {
            const slugs = placeholder.getAttribute('data-doctor-slugs') || ''
            placeholder.setAttribute('contenteditable', 'false')
            placeholder.style.margin = '1rem 0'
            placeholder.style.padding = '1rem'
            placeholder.style.background = '#f0fdfa'
            placeholder.style.border = '2px solid #0d9488'
            placeholder.style.borderRadius = '0.75rem'
            placeholder.style.cursor = 'pointer'
            placeholder.style.userSelect = 'none'
            placeholder.style.display = 'block'
            placeholder.style.position = 'relative'
            placeholder.style.zIndex = '10'
            
            // Try to get doctor names for better preview
            let displayNames = 'লোড হচ্ছে...'
            if (slugs) {
              const slugArray = slugs.split(',')
              const { data } = await supabase
                .from('doctors')
                .select('name')
                .in('slug', slugArray.filter(s => !s.match(/^[0-9a-f]{8}-/i)))
              const { data: dataId } = await supabase
                .from('doctors')
                .select('name')
                .in('id', slugArray.filter(s => s.match(/^[0-9a-f]{8}-/i)))
              
              const names = [...(data || []), ...(dataId || [])].map(d => d.name)
              displayNames = names.length > 0 ? names.join(', ') : slugs
            }

            placeholder.innerHTML = `
              <div style="display: flex; align-items: center; gap: 0.5rem; color: #0d9488; font-weight: 600; pointer-events: none;">
                <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                ডাক্তার কার্ড: ${displayNames}
              </div>
              <div class="edit-prompt" style="font-size: 0.75rem; color: #0f766e; margin-top: 0.25rem; pointer-events: none;">(এডিট করতে এখানে ক্লিক করুন)</div>
            `
          })
          
          handleEditorChange() // Initial listeners setup
        }
      }, 0)
    }
  }, [showModal, editingPost])

  async function fetchPosts() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
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
    // Clear editing placeholder before opening add modal
    window._editingPlaceholder = null;
    
    setEditingPost(null)
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      meta_title: '',
      meta_description: '',
      keywords: '',
      categories: [],
      tags: '',
      author: 'ইজি ডক্টর রংপুর টিম',
      status: 'draft'
    })
    setShowSeoSection(false)
    setShowModal(true)
  }

  function openEditModal(post) {
    // Clear editing placeholder before opening edit modal
    window._editingPlaceholder = null;
    
    setEditingPost(post)
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured_image_url: post.featured_image_url || '',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      keywords: post.keywords?.join(', ') || '',
      categories: post.categories || [],
      tags: post.tags?.join(', ') || '',
      author: post.author || 'ইজি ডক্টর রংপুর টিম',
      status: post.status || 'draft'
    })
    setShowSeoSection(false)
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস কনফিগার করা হয়নি')
        return
      }

      const postData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image_url: formData.featured_image_url,
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.excerpt,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        categories: formData.categories,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        author: formData.author,
        status: formData.status,
        published_at: formData.status === 'published' ? new Date().toISOString() : null
      }

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id)

        if (error) throw error
        alert('সফলভাবে আপডেট হয়েছে!')
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData])

        if (error) throw error
        alert('সফলভাবে যোগ হয়েছে!')
      }

      setShowModal(false)
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
      alert('একটি সমস্যা হয়েছে: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('আপনি কি নিশ্চিত এই পোস্টটি মুছে ফেলতে চান?')) return

    try {
      if (!supabase || !isConfigured) return

      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
      alert('মুছে ফেলতে সমস্যা হয়েছে')
    }
  }

  async function toggleStatus(post) {
    try {
      if (!supabase || !isConfigured) return

      const newStatus = post.status === 'published' ? 'draft' : 'published'
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        })
        .eq('id', post.id)

      if (error) throw error
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function saveSelection() {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange()
    }
    return null
  }

  function restoreSelection(range) {
    if (range) {
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  function execCommand(command, value = null) {
    editorRef.current?.focus()
    if (savedSelection) {
      restoreSelection(savedSelection)
    }
    document.execCommand(command, false, value)
    handleEditorChange()
  }

  function handleToolbarMouseDown(e) {
    e.preventDefault()
    const range = saveSelection()
    if (range) {
      setSavedSelection(range)
    }
  }

  function handleFontSizeMouseDown(e) {
    const range = saveSelection()
    if (range) {
      setSavedSelection(range)
    }
  }

  function insertImage() {
    const range = saveSelection()
    const url = prompt('ছবির URL দিন:')
    if (url) {
      editorRef.current?.focus()
      if (range) restoreSelection(range)
      document.execCommand('insertImage', false, url)
      handleEditorChange()
    }
  }

  function insertLink() {
    const range = saveSelection()
    const url = prompt('লিংকের URL দিন:')
    if (url) {
      editorRef.current?.focus()
      if (range) restoreSelection(range)
      document.execCommand('createLink', false, url)
      handleEditorChange()
    }
  }

  function changeFontSize(size) {
    setSelectedFontSize(size)
    
    if (!savedSelection || !editorRef.current) {
      return
    }
    
    editorRef.current.focus()
    restoreSelection(savedSelection)
    
    document.execCommand('fontSize', false, '7')
    
    setTimeout(() => {
      const fontElements = editorRef.current?.querySelectorAll('font[size="7"]')
      if (fontElements && fontElements.length > 0) {
        fontElements.forEach(el => {
          const span = document.createElement('span')
          span.style.fontSize = size
          span.innerHTML = el.innerHTML
          el.parentNode?.replaceChild(span, el)
        })
      }
      handleEditorChange()
    }, 0)
  }

  function handleEditorChange() {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      setFormData(prev => ({ ...prev, content }))
      
      // Setup click listeners for doctor cards
      const placeholders = editorRef.current.querySelectorAll('.embedded-doctors')
      placeholders.forEach(placeholder => {
        // Ensure visual style is applied even after content change
        if (placeholder.style.background !== 'rgb(240, 253, 250)') {
           placeholder.setAttribute('contenteditable', 'false')
           placeholder.style.margin = '1rem 0'
           placeholder.style.padding = '1rem'
           placeholder.style.background = '#f0fdfa'
           placeholder.style.border = '2px solid #0d9488'
           placeholder.style.borderRadius = '0.75rem'
           placeholder.style.cursor = 'pointer'
           placeholder.style.userSelect = 'none'
           placeholder.style.display = 'block'
           placeholder.style.position = 'relative'
           placeholder.style.zIndex = '10'
        }

        if (!placeholder.hasAttribute('data-listener')) {
          placeholder.setAttribute('data-listener', 'true')
          
          // Helper to open modal
          const handleDoctorModalOpen = (e) => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            
            // Re-find the latest version of the placeholder to be sure
            const currentPlaceholder = e?.currentTarget?.closest('.embedded-doctors') || e?.target?.closest('.embedded-doctors') || placeholder;
            const slugs = currentPlaceholder.getAttribute('data-doctor-slugs')
            const slugsList = slugs ? slugs.split(',') : []
            
            // Store reference to the placeholder being edited
            window._editingPlaceholder = currentPlaceholder
            
            openDoctorModal()
            setDoctorUrlsList(slugsList)
            fetchDoctorPreviews(slugsList)
          };

          // Attach to the main div with multiple event types
          placeholder.onmousedown = handleDoctorModalOpen;
          placeholder.onclick = handleDoctorModalOpen;
          placeholder.ontouchstart = handleDoctorModalOpen;

          // Also try to find the prompt and attach directly if it exists
          const prompt = placeholder.querySelector('.edit-prompt');
          if (prompt) {
            prompt.style.pointerEvents = 'auto'; // Make it clickable
            prompt.style.cursor = 'pointer';
            prompt.onmousedown = handleDoctorModalOpen;
            prompt.onclick = handleDoctorModalOpen;
            prompt.ontouchstart = handleDoctorModalOpen;
          }
        }
      })
    }
  }

  function handleEditorFocus() {
    const range = saveSelection()
    if (range) {
      setSavedSelection(range)
    }
  }

  function handleEditorSelect() {
    const range = saveSelection()
    if (range) {
      setSavedSelection(range)
    }
  }

  function toggleCategory(category) {
    const newCategories = formData.categories.includes(category)
      ? formData.categories.filter(c => c !== category)
      : [...formData.categories, category]
    setFormData({ ...formData, categories: newCategories })
  }

  function extractDoctorSlug(url) {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return null
    
    const match = trimmedUrl.match(/\/doctor\/([^\/\?#]+)/)
    if (match) {
      return match[1]
    }
    
    if (!trimmedUrl.includes('/')) {
      return trimmedUrl
    }
    
    return null
  }

  function addDoctorUrl() {
    const lines = doctorUrls.split('\n').filter(line => line.trim())
    const newSlugs = []
    
    for (const line of lines) {
      const slug = extractDoctorSlug(line)
      if (slug && !doctorUrlsList.includes(slug)) {
        newSlugs.push(slug)
      }
    }
    
    if (newSlugs.length > 0) {
      setDoctorUrlsList([...doctorUrlsList, ...newSlugs])
      setDoctorUrls('')
      fetchDoctorPreviews([...doctorUrlsList, ...newSlugs])
    }
  }

  function removeDoctorUrl(slug) {
    const newList = doctorUrlsList.filter(s => s !== slug)
    setDoctorUrlsList(newList)
    setDoctorPreviews(doctorPreviews.filter(d => (d.slug || d.id) !== slug))
  }

  async function fetchDoctorPreviews(slugs) {
    if (!supabase || !isConfigured || slugs.length === 0) return
    
    setLoadingDoctors(true)
    try {
      const previews = []
      
      for (const slug of slugs) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
        
        let query = supabase.from('doctors').select('id, name, slug, degrees, category_name, image_url')
        
        if (isUUID) {
          query = query.eq('id', slug)
        } else {
          query = query.eq('slug', slug)
        }
        
        const { data, error } = await query.single()
        
        if (!error && data) {
          previews.push(data)
        }
      }
      
      setDoctorPreviews(previews)
    } catch (error) {
      console.error('Error fetching doctor previews:', error)
    } finally {
      setLoadingDoctors(false)
    }
  }

  function openDoctorModal() {
    const range = saveSelection()
    if (range) {
      setSavedSelection(range)
    }
    
    // If we are editing an existing placeholder, initialize the list with its doctors
    let initialList = []
    if (window._editingPlaceholder) {
      const slugs = window._editingPlaceholder.getAttribute('data-doctor-slugs')
      initialList = slugs ? slugs.split(',') : []
    }

    setShowDoctorModal(true)
    setDoctorUrls('')
    setDoctorUrlsList(initialList)
    if (initialList.length > 0) {
      fetchDoctorPreviews(initialList)
    } else {
      setDoctorPreviews([])
    }
    
    setDoctorModalTab('url')
    setSelectedCategoryId('')
    setCategoryDoctors([])
    setSelectedDoctorIds([])
    setShowNewCategoryForm(false)
    setNewCategoryName('')
    setNewCategorySlug('')
    fetchDoctorCategories()
  }

  async function fetchDoctorCategories() {
    if (!supabase || !isConfigured) return
    
    setLoadingCategories(true)
    try {
      const { data, error } = await supabase
        .from('doctor_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('doctor_categories table not found. Please run the migration.')
          setDoctorCategories([])
        } else {
          throw error
        }
      } else {
        setDoctorCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setDoctorCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  async function fetchDoctorsByCategory(categorySlug) {
    if (!supabase || !isConfigured || !categorySlug) {
      setCategoryDoctors([])
      return
    }
    
    setLoadingCategoryDoctors(true)
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, slug, degrees, category_name, image_url')
        .eq('category', categorySlug)
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      setCategoryDoctors(data || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setCategoryDoctors([])
    } finally {
      setLoadingCategoryDoctors(false)
    }
  }

  function handleCategoryChange(categorySlug) {
    setSelectedCategoryId(categorySlug)
    setSelectedDoctorIds([])
    if (categorySlug && categorySlug !== 'new') {
      fetchDoctorsByCategory(categorySlug)
    } else {
      setCategoryDoctors([])
    }
    if (categorySlug === 'new') {
      setShowNewCategoryForm(true)
    } else {
      setShowNewCategoryForm(false)
    }
  }

  function toggleDoctorSelection(doctorId, doctorSlug) {
    const identifier = doctorSlug || doctorId
    if (selectedDoctorIds.includes(identifier)) {
      setSelectedDoctorIds(selectedDoctorIds.filter(id => id !== identifier))
    } else {
      setSelectedDoctorIds([...selectedDoctorIds, identifier])
    }
  }

  function selectAllCategoryDoctors() {
    const allIds = categoryDoctors.map(d => d.slug || d.id)
    setSelectedDoctorIds(allIds)
  }

  function deselectAllCategoryDoctors() {
    setSelectedDoctorIds([])
  }

  function addSelectedDoctorsToList() {
    if (selectedDoctorIds.length === 0) return
    
    const newSlugs = selectedDoctorIds.filter(id => !doctorUrlsList.includes(id))
    if (newSlugs.length > 0) {
      const updatedList = [...doctorUrlsList, ...newSlugs]
      setDoctorUrlsList(updatedList)
      fetchDoctorPreviews(updatedList)
    }
    setSelectedDoctorIds([])
  }

  function generateCategorySlug(name) {
    return name
      .toLowerCase()
      .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || `category-${Date.now()}`
  }

  async function createNewCategory() {
    if (!newCategoryName.trim()) {
      alert('বিভাগের নাম দিন')
      return
    }
    
    if (!supabase || !isConfigured) {
      alert('ডাটাবেস কনফিগার করা হয়নি')
      return
    }
    
    setSavingCategory(true)
    try {
      const slug = newCategorySlug.trim() || generateCategorySlug(newCategoryName)
      
      const { data: existingCat } = await supabase
        .from('doctor_categories')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (existingCat) {
        alert('এই স্লাগ দিয়ে আগেই একটি বিভাগ আছে')
        setSavingCategory(false)
        return
      }
      
      const maxOrder = doctorCategories.length > 0 
        ? Math.max(...doctorCategories.map(c => c.display_order || 0)) + 1 
        : 1
      
      const { data, error } = await supabase
        .from('doctor_categories')
        .insert([{
          name: newCategoryName.trim(),
          slug: slug,
          is_active: true,
          display_order: maxOrder
        }])
        .select()
        .single()
      
      if (error) throw error
      
      const updatedCategories = [...doctorCategories, data]
      setDoctorCategories(updatedCategories)
      setShowNewCategoryForm(false)
      setNewCategoryName('')
      setNewCategorySlug('')
      setSelectedCategoryId(data.slug)
      fetchDoctorsByCategory(data.slug)
      alert('নতুন বিভাগ সফলভাবে যোগ হয়েছে!')
    } catch (error) {
      console.error('Error creating category:', error)
      alert('বিভাগ তৈরিতে সমস্যা হয়েছে: ' + error.message)
    } finally {
      setSavingCategory(false)
    }
  }

  function insertDoctorCards() {
    if (doctorUrlsList.length === 0) {
      if (window._editingPlaceholder) {
        if (confirm('আপনি কি এই ডাক্তার কার্ডটি মুছে ফেলতে চান?')) {
          window._editingPlaceholder.remove()
          handleEditorChange()
          setShowDoctorModal(false)
          window._editingPlaceholder = null
        }
      } else {
        alert('অন্তত একটি ডাক্তার যোগ করুন')
      }
      return
    }
    
    const slugsData = doctorUrlsList.join(',')
    const doctorNames = doctorPreviews.map(d => d.name).join(', ') || 'ডাক্তার কার্ড'
    const doctorEmbedContent = `
      <div style="display: flex; align-items: center; gap: 0.5rem; color: #0d9488; font-weight: 600; pointer-events: none;">
        <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
        ডাক্তার কার্ড: ${doctorNames}
      </div>
      <div class="edit-prompt" style="font-size: 0.75rem; color: #0f766e; margin-top: 0.25rem; pointer-events: none;">(এডিট করতে এখানে ক্লিক করুন)</div>
    `

    if (window._editingPlaceholder && document.body.contains(window._editingPlaceholder)) {
      window._editingPlaceholder.setAttribute('data-doctor-slugs', slugsData)
      window._editingPlaceholder.innerHTML = doctorEmbedContent
      window._editingPlaceholder = null
    } else {
      const doctorEmbed = `<div class="embedded-doctors" data-doctor-slugs="${slugsData}" contenteditable="false" style="margin: 1rem 0; padding: 1rem; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 0.75rem; cursor: pointer; user-select: none;">${doctorEmbedContent}</div><p></p>`
      
      editorRef.current?.focus()
      if (savedSelection) {
        restoreSelection(savedSelection)
      }
      document.execCommand('insertHTML', false, doctorEmbed)
    }
    
    handleEditorChange()
    setShowDoctorModal(false)
    setDoctorUrls('')
    setDoctorUrlsList([])
    setDoctorPreviews([])
    setDoctorModalTab('url')
    setSelectedCategoryId('')
    setCategoryDoctors([])
    setSelectedDoctorIds([])
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ব্লগ পোস্ট</h1>
            <p className="text-gray-500 mt-1">সকল ব্লগ পোস্ট পরিচালনা করুন</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            নতুন পোস্ট
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো ব্লগ পোস্ট নেই</h3>
            <p className="text-gray-500">নতুন পোস্ট যোগ করতে উপরের বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ছবি</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">শিরোনাম</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">বিভাগ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">লেখক</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">তারিখ</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">ভিউ</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">স্ট্যাটাস</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {post.featured_image_url ? (
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-20 h-14 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-14 bg-teal-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 line-clamp-2">{post.title}</span>
                        <span className="block text-xs text-gray-400 mt-1">/{post.slug}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {post.categories?.slice(0, 2).map((cat, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{post.author}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(post.published_at || post.created_at)}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{post.view_count || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(post)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {post.status === 'published' ? 'প্রকাশিত' : 'ড্রাফট'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="দেখুন"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          <button
                            onClick={() => openEditModal(post)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="সম্পাদনা"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="মুছে ফেলুন"
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
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
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
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">শিরোনাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: generateSlug(e.target.value)
                      })
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="পোস্টের শিরোনাম"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">স্লাগ (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="post-url-slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">/blog/{formData.slug || 'your-post-slug'}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">লেখক</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="লেখকের নাম"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">স্ট্যাটাস</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="draft">ড্রাফট</option>
                    <option value="published">প্রকাশিত</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ফিচার্ড ছবি URL</label>
                <input
                  type="url"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.featured_image_url && (
                  <div className="mt-2">
                    <img src={formData.featured_image_url} alt="Preview" className="h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows="2"
                  placeholder="পোস্টের সংক্ষিপ্ত বিবরণ (১৫০-২০০ অক্ষর)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">বিভাগ</label>
                <div className="flex flex-wrap gap-2">
                  {allBlogCategories.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.categories.includes(category)
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowBlogCategoryForm(true)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-teal-50 text-teal-600 hover:bg-teal-100 border border-dashed border-teal-300 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    বিভাগ যোগ করুন
                  </button>
                </div>
                
                {showBlogCategoryForm && (
                  <div className="mt-3 p-4 bg-teal-50 rounded-xl border border-teal-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBlogCategoryName}
                        onChange={(e) => setNewBlogCategoryName(e.target.value)}
                        placeholder="নতুন বিভাগের নাম"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      />
                      <button
                        type="button"
                        onClick={createNewBlogCategory}
                        disabled={savingBlogCategory}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                      >
                        {savingBlogCategory ? 'সেভ হচ্ছে...' : 'যোগ করুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBlogCategoryForm(false)
                          setNewBlogCategoryName('')
                        }}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ট্যাগ</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="ট্যাগ (কমা দিয়ে আলাদা করুন)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">পোস্ট কন্টেন্ট *</label>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded font-bold" title="বোল্ড">B</button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded italic" title="ইটালিক">I</button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded underline" title="আন্ডারলাইন">U</button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('strikeThrough')} className="p-2 hover:bg-gray-200 rounded line-through" title="স্ট্রাইকথ্রু">S</button>
                    
                    <div className="w-px bg-gray-300 mx-1"></div>
                    
                    <select 
                      onMouseDown={handleFontSizeMouseDown}
                      onChange={(e) => changeFontSize(e.target.value)} 
                      value={selectedFontSize}
                      className="px-2 py-1 border rounded text-sm"
                      title="ফন্ট সাইজ"
                    >
                      <option value="12px">১২px</option>
                      <option value="14px">১৪px</option>
                      <option value="16px">১৬px</option>
                      <option value="18px">১৮px</option>
                      <option value="20px">২০px</option>
                      <option value="24px">২৪px</option>
                      <option value="28px">২৮px</option>
                      <option value="32px">৩২px</option>
                    </select>
                    
                    <div className="w-px bg-gray-300 mx-1"></div>
                    
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('formatBlock', '<h1>')} className="p-2 hover:bg-gray-200 rounded text-lg font-bold" title="হেডিং ১">H1</button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('formatBlock', '<h2>')} className="p-2 hover:bg-gray-200 rounded text-base font-bold" title="হেডিং ২">H2</button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('formatBlock', '<h3>')} className="p-2 hover:bg-gray-200 rounded text-sm font-bold" title="হেডিং ৩">H3</button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('formatBlock', '<p>')} className="p-2 hover:bg-gray-200 rounded text-sm" title="প্যারাগ্রাফ">P</button>
                    
                    <div className="w-px bg-gray-300 mx-1"></div>
                    
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded" title="বুলেট লিস্ট">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded" title="নম্বর লিস্ট">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </button>
                    
                    <div className="w-px bg-gray-300 mx-1"></div>
                    
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-200 rounded" title="বামে">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                      </svg>
                    </button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-200 rounded" title="মাঝে">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
                      </svg>
                    </button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-200 rounded" title="ডানে">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
                      </svg>
                    </button>
                    
                    <div className="w-px bg-gray-300 mx-1"></div>
                    
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={insertLink} className="p-2 hover:bg-gray-200 rounded" title="লিংক">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={insertImage} className="p-2 hover:bg-gray-200 rounded" title="ছবি">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    
                    <div className="w-px bg-gray-300 mx-1"></div>
                    
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('formatBlock', '<blockquote>')} className="p-2 hover:bg-gray-200 rounded" title="কোট">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </button>
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => execCommand('removeFormat')} className="p-2 hover:bg-gray-200 rounded text-red-500" title="ফরম্যাট রিমুভ">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <div className="w-px bg-gray-300 mx-1"></div>
                    
                    <button type="button" onMouseDown={handleToolbarMouseDown} onClick={openDoctorModal} className="p-2 hover:bg-teal-100 rounded text-teal-600 flex items-center gap-1" title="ডাক্তার কার্ড যোগ করুন">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                      <span className="text-xs font-medium">ডাক্তার</span>
                    </button>
                  </div>
                  
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning={true}
                    className="min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none"
                    onInput={handleEditorChange}
                    onFocus={handleEditorFocus}
                    onMouseUp={handleEditorSelect}
                    onKeyUp={handleEditorSelect}
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setShowSeoSection(!showSeoSection)}
                  className="flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700"
                >
                  <svg className={`w-5 h-5 transition-transform ${showSeoSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  SEO সেটিংস (গুগল সার্চের জন্য)
                </button>

                {showSeoSection && (
                  <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-xl">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Meta Title
                        <span className="text-xs font-normal text-gray-500 ml-2">(গুগলে দেখাবে - ৬০ অক্ষর সেরা)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.meta_title}
                        onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="SEO শিরোনাম"
                        maxLength={60}
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.meta_title?.length || 0}/60 অক্ষর</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Meta Description
                        <span className="text-xs font-normal text-gray-500 ml-2">(গুগলে দেখাবে - ১৬০ অক্ষর সেরা)</span>
                      </label>
                      <textarea
                        value={formData.meta_description}
                        onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        rows="2"
                        placeholder="সার্চ রেজাল্টে দেখানো বিবরণ"
                        maxLength={160}
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.meta_description?.length || 0}/160 অক্ষর</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Keywords
                        <span className="text-xs font-normal text-gray-500 ml-2">(কমা দিয়ে আলাদা করুন)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Google Preview</p>
                      <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                        {formData.meta_title || formData.title || 'পোস্টের শিরোনাম'}
                      </div>
                      <div className="text-green-700 text-sm">
                        rangpurdoctor.com/blog/{formData.slug || 'post-slug'}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">
                        {formData.meta_description || formData.excerpt || 'পোস্টের বিবরণ এখানে দেখা যাবে...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700"
                >
                  {editingPost ? 'আপডেট করুন' : 'পোস্ট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                ডাক্তার কার্ড যোগ করুন
              </h2>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {window._editingPlaceholder && (
                <div className="flex justify-between items-center bg-teal-50 p-4 rounded-xl border border-teal-200">
                  <span className="text-teal-800 font-medium">ডাক্তার কার্ড এডিট করছেন</span>
                  <button 
                    onClick={() => {
                      if(confirm('আপনি কি এই কার্ডটি মুছে ফেলতে চান?')) {
                        window._editingPlaceholder.remove();
                        handleEditorChange();
                        setShowDoctorModal(false);
                        window._editingPlaceholder = null;
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-bold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    কার্ড মুছে ফেলুন
                  </button>
                </div>
              )}
              <div className="flex border-b">
                <button
                  type="button"
                  onClick={() => setDoctorModalTab('url')}
                  className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                    doctorModalTab === 'url'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    URL থেকে
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorModalTab('category')}
                  className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                    doctorModalTab === 'category'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    বিভাগ থেকে
                  </span>
                </button>
              </div>

              {doctorModalTab === 'url' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-700 text-sm">
                      <strong>নির্দেশনা:</strong> ডাক্তারের প্রোফাইল URL বা স্লাগ দিন। একাধিক ডাক্তার যোগ করতে প্রতি লাইনে একটি করে URL দিন।
                      <br />
                      <span className="text-xs text-blue-600 mt-1 block">উদাহরণ: /doctor/dr-xyz বা সম্পূর্ণ URL</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ডাক্তার URL/স্লাগ
                    </label>
                    <textarea
                      value={doctorUrls}
                      onChange={(e) => setDoctorUrls(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows="4"
                      placeholder="/doctor/dr-example&#10;/doctor/dr-another&#10;বা শুধু slug: dr-example"
                    />
                    <button
                      type="button"
                      onClick={addDoctorUrl}
                      className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      ডাক্তার যোগ করুন
                    </button>
                  </div>
                </div>
              )}

              {doctorModalTab === 'category' && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-purple-700 text-sm">
                      <strong>নির্দেশনা:</strong> বিভাগ সিলেক্ট করুন এবং সেই বিভাগের ডাক্তারদের তালিকা থেকে যাদের যোগ করতে চান তাদের সিলেক্ট করুন।
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      বিভাগ নির্বাচন করুন
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">-- বিভাগ সিলেক্ট করুন --</option>
                      {loadingCategories ? (
                        <option disabled>লোড হচ্ছে...</option>
                      ) : (
                        <>
                          {doctorCategories.map(cat => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                          ))}
                          <option value="new" className="text-teal-600 font-semibold">+ নতুন বিভাগ যোগ করুন</option>
                        </>
                      )}
                    </select>
                  </div>

                  {showNewCategoryForm && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        নতুন বিভাগ তৈরি করুন
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">বিভাগের নাম (বাংলা) *</label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="যেমন: হাড় ও জয়েন্ট বিশেষজ্ঞ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">স্লাগ (ইংরেজি, optional)</label>
                        <input
                          type="text"
                          value={newCategorySlug}
                          onChange={(e) => setNewCategorySlug(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="যেমন: orthopedics (খালি রাখলে অটো জেনারেট হবে)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCategoryForm(false)
                            setSelectedCategoryId('')
                            setNewCategoryName('')
                            setNewCategorySlug('')
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={createNewCategory}
                          disabled={savingCategory || !newCategoryName.trim()}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {savingCategory ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              সেভ হচ্ছে...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              সেভ করুন
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedCategoryId && selectedCategoryId !== 'new' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">
                          ডাক্তার তালিকা
                          {categoryDoctors.length > 0 && (
                            <span className="text-gray-500 font-normal ml-1">({categoryDoctors.length} জন)</span>
                          )}
                        </label>
                        {categoryDoctors.length > 0 && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={selectAllCategoryDoctors}
                              className="text-xs text-teal-600 hover:underline"
                            >
                              সব সিলেক্ট
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={deselectAllCategoryDoctors}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              সব বাদ দিন
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {loadingCategoryDoctors ? (
                        <div className="flex justify-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                      ) : categoryDoctors.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl">
                          এই বিভাগে কোনো ডাক্তার নেই
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                          {categoryDoctors.map((doctor) => {
                            const identifier = doctor.slug || doctor.id
                            const isSelected = selectedDoctorIds.includes(identifier)
                            const isAlreadyAdded = doctorUrlsList.includes(identifier)
                            
                            return (
                              <label
                                key={doctor.id}
                                className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                  isAlreadyAdded 
                                    ? 'bg-gray-100 opacity-60 cursor-not-allowed' 
                                    : isSelected 
                                      ? 'bg-teal-50' 
                                      : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected || isAlreadyAdded}
                                  disabled={isAlreadyAdded}
                                  onChange={() => !isAlreadyAdded && toggleDoctorSelection(doctor.id, doctor.slug)}
                                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                />
                                {doctor.image_url ? (
                                  <img 
                                    src={doctor.image_url} 
                                    alt={doctor.name}
                                    className="w-10 h-10 object-cover rounded-full border-2 border-gray-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 text-sm truncate">{doctor.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{doctor.degrees}</p>
                                </div>
                                {isAlreadyAdded && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">যোগ করা হয়েছে</span>
                                )}
                              </label>
                            )
                          })}
                        </div>
                      )}

                      {selectedDoctorIds.length > 0 && (
                        <button
                          type="button"
                          onClick={addSelectedDoctorsToList}
                          className="mt-3 w-full px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {selectedDoctorIds.length} জন ডাক্তার যোগ করুন
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {doctorUrlsList.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    যোগ করা ডাক্তার ({doctorUrlsList.length} জন)
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      (ব্লগে ২টি করে এক সারিতে দেখাবে)
                    </span>
                  </label>
                  
                  {loadingDoctors ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {doctorPreviews.map((doctor) => (
                        <div key={doctor.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-200 relative group">
                          <button
                            type="button"
                            onClick={() => removeDoctorUrl(doctor.slug || doctor.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {doctor.image_url ? (
                            <img 
                              src={doctor.image_url} 
                              alt={doctor.name}
                              className="w-12 h-12 object-cover rounded-full border-2 border-teal-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{doctor.name}</p>
                            <p className="text-xs text-teal-600 truncate">{doctor.category_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {doctorUrlsList.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-700 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>প্রিভিউ:</strong> {doctorUrlsList.length} জন ডাক্তারের কার্ড ব্লগে {Math.ceil(doctorUrlsList.length / 2)} সারিতে দেখাবে
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      window._editingPlaceholder = null
                      setShowDoctorModal(false)
                    }}
                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={insertDoctorCards}
                    className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50"
                  >
                    {window._editingPlaceholder ? 'আপডেট করুন' : 'কন্টেন্টে যোগ করুন'}
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBlogs
