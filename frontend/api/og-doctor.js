const SOCIAL_MEDIA_BOTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'WhatsApp',
  'LinkedInBot',
  'Pinterest',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'vkShare',
  'Embedly',
  'Quora Link Preview',
  'Showyoubot',
  'outbrain',
  'W3C_Validator'
]

function isSocialMediaBot(userAgent) {
  if (!userAgent) return false
  return SOCIAL_MEDIA_BOTS.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()))
}

function escapeHtml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function generateMetaHtml({ title, description, image, url, siteName }) {
  const escapedTitle = escapeHtml(title)
  const escapedDescription = escapeHtml(description)
  
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDescription}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:locale" content="bn_BD">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDescription}">
  <meta name="twitter:image" content="${image}">
  
  <!-- WhatsApp -->
  <meta property="og:image:alt" content="${escapedTitle}">
  
  <!-- Redirect normal users to the real page -->
  <script>
    window.location.href = "${url}";
  </script>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <p>${escapedDescription}</p>
  <img src="${image}" alt="${escapedTitle}" style="max-width:100%;">
  <p><a href="${url}">Click here if not redirected</a></p>
</body>
</html>`
}

export default async function handler(req, res) {
  const { slug } = req.query
  
  if (!slug) {
    return res.redirect(302, '/')
  }

  const userAgent = req.headers['user-agent'] || ''
  const host = req.headers.host || ''
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const siteUrl = `${protocol}://${host}`
  
  if (!isSocialMediaBot(userAgent)) {
    return res.redirect(302, `${siteUrl}/doctor/${slug}`)
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.redirect(302, `${siteUrl}/doctor/${slug}`)
  }

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    const queryParam = isUUID ? `id=eq.${slug}` : `slug=eq.${slug}`
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/doctors?${queryParam}&select=*`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      return res.redirect(302, `${siteUrl}/doctor/${slug}`)
    }

    const doctors = await response.json()
    
    if (!doctors || doctors.length === 0) {
      return res.redirect(302, `${siteUrl}/doctor/${slug}`)
    }

    const doctor = doctors[0]
    const siteName = 'ইজি ডক্টর রংপুর'
    
    const title = `${doctor.name} - ${doctor.category_name}`
    const description = `${doctor.category_name} | ${siteName}`
    const image = doctor.image_url || `${siteUrl}/og-image.png`
    const pageUrl = `${siteUrl}/doctor/${doctor.slug || doctor.id}`

    const html = generateMetaHtml({
      title,
      description,
      image,
      url: pageUrl,
      siteName
    })

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).send(html)
  } catch (error) {
    console.error('API error:', error)
    return res.redirect(302, `${siteUrl}/doctor/${slug}`)
  }
}
