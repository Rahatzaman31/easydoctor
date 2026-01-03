import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import Footer from '../components/Footer'
import BlogContentRenderer from '../components/BlogContentRenderer'

function BlogDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    if (slug) {
      fetchPost()
    }
  }, [slug])

  async function fetchPost() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error) throw error
      setPost(data)

      await supabase
        .from('blog_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id)

      if (data.categories && data.categories.length > 0) {
        const { data: related } = await supabase
          .from('blog_posts')
          .select('id, title, slug, featured_image_url, published_at')
          .eq('status', 'published')
          .neq('id', data.id)
          .contains('categories', [data.categories[0]])
          .limit(3)

        setRelatedPosts(related || [])
      }

      updateMetaTags(data)
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateMetaTags(postData) {
    document.title = postData.meta_title || postData.title || 'ব্লগ পোস্ট'
    
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.appendChild(metaDescription)
    }
    metaDescription.content = postData.meta_description || postData.excerpt || ''

    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.name = 'keywords'
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.content = postData.keywords?.join(', ') || ''

    const ogTags = {
      'og:title': postData.meta_title || postData.title,
      'og:description': postData.meta_description || postData.excerpt,
      'og:image': postData.featured_image_url,
      'og:type': 'article',
      'og:locale': 'bn_BD',
      'article:published_time': postData.published_at,
      'article:author': postData.author
    }

    Object.entries(ogTags).forEach(([property, content]) => {
      if (content) {
        let tag = document.querySelector(`meta[property="${property}"]`)
        if (!tag) {
          tag = document.createElement('meta')
          tag.setAttribute('property', property)
          document.head.appendChild(tag)
        }
        tag.content = content
      }
    })

    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': postData.meta_title || postData.title,
      'twitter:description': postData.meta_description || postData.excerpt,
      'twitter:image': postData.featured_image_url
    }

    Object.entries(twitterTags).forEach(([name, content]) => {
      if (content) {
        let tag = document.querySelector(`meta[name="${name}"]`)
        if (!tag) {
          tag = document.createElement('meta')
          tag.name = name
          document.head.appendChild(tag)
        }
        tag.content = content
      }
    })

    let existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) existingScript.remove()

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': postData.title,
      'description': postData.meta_description || postData.excerpt,
      'image': postData.featured_image_url,
      'author': {
        '@type': 'Person',
        'name': postData.author
      },
      'datePublished': postData.published_at,
      'dateModified': postData.updated_at,
      'publisher': {
        '@type': 'Organization',
        'name': 'ইজি ডক্টর রংপুর',
        'logo': {
          '@type': 'ImageObject',
          'url': window.location.origin + '/logo-icon.png'
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': window.location.href
      },
      'keywords': postData.keywords?.join(', '),
      'inLanguage': 'bn-BD'
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schema)
    document.head.appendChild(script)
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function handleShare(platform) {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(post?.title || '')
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`
    }

    window.open(shareUrls[platform], '_blank', 'width=600,height=400')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">পোস্ট পাওয়া যায়নি</h1>
          <p className="text-gray-500 mb-6">আপনি যে পোস্টটি খুঁজছেন তা পাওয়া যায়নি</p>
          <Link to="/blog" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ব্লগে ফিরে যান
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <article>
        {post.featured_image_url && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto max-h-[300px] md:max-h-[350px] object-cover object-center"
              />
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ব্লগে ফিরে যান
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          <BlogContentRenderer content={post.content} />

          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">শেয়ার করুন</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleShare('facebook')}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                title="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
                title="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
                title="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                title="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
            </div>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">ট্যাগ</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">সম্পর্কিত পোস্ট</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(relatedPost => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-video overflow-hidden">
                    {relatedPost.featured_image_url ? (
                      <img
                        src={relatedPost.featured_image_url}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-emerald-100">
                        <svg className="w-12 h-12 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 group-hover:text-teal-600 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(relatedPost.published_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}

export default BlogDetail
