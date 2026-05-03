import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  const { slug } = req.query

  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !post) {
      return res.status(404).send('Post not found')
    }

    const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>${post.meta_title || post.title}</title>
    <meta name="description" content="${post.meta_description || post.excerpt || ''}">
    <meta name="keywords" content="${post.keywords?.join(', ') || ''}">
    
    <link rel="canonical" href="https://easydoctorrangpur.com/blog/${post.slug}">
    
    <meta property="og:title" content="${post.meta_title || post.title}">
    <meta property="og:description" content="${post.meta_description || post.excerpt || ''}">
    <meta property="og:image" content="${post.featured_image_url || ''}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://easydoctorrangpur.com/blog/${post.slug}">
    <meta property="og:site_name" content="ইজি ডক্টর রংপুর">
    <meta property="og:locale" content="bn_BD">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.meta_title || post.title}">
    <meta name="twitter:description" content="${post.meta_description || post.excerpt || ''}">
    <meta name="twitter:image" content="${post.featured_image_url || ''}">

    <script type="application/ld+json">
    ${JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'description': post.meta_description || post.excerpt,
        'image': post.featured_image_url,
        'author': { 
          '@type': 'Organization', 
          'name': 'ইজি ডক্টর রংপুর টিম' 
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'ইজি ডক্টর রংপুর',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://easydoctorrangpur.com/logo-icon.png'
          }
        },
        'datePublished': post.published_at,
        'dateModified': post.updated_at,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `https://easydoctorrangpur.com/blog/${post.slug}`
        }
      },
      ...(post.faqs && post.faqs.length > 0 ? [{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': post.faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer }
        }))
      }] : [])
    ])}
    </script>
</head>
<body>
    <article>
        <header>
            <h1>${post.title}</h1>
            <time datetime="${post.published_at}">${new Date(post.published_at).toLocaleDateString('bn-BD')}</time>
            <p>লেখক: ${post.author || 'ইজি ডক্টর রংপুর টিম'}</p>
        </header>
        <div class="content">
            ${post.content}
        </div>
        ${post.faqs && post.faqs.length > 0 ? `
        <section class="faqs">
            <h2>সাধারণ জিজ্ঞাসা (FAQ)</h2>
            ${post.faqs.map(faq => `
                <div class="faq-item">
                    <h3>${faq.question}</h3>
                    <p>${faq.answer}</p>
                </div>
            `).join('')}
        </section>` : ''}
    </article>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return res.status(200).send(html)
  } catch (err) {
    console.error('SEO Error:', err)
    return res.status(500).send('Internal Server Error')
  }
}
