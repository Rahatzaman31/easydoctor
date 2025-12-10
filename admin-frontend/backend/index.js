import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

function generateSlug(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[।,.?!:;'"()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

async function generateUniqueSlug(supabase, name, existingId = null) {
  let baseSlug = generateSlug(name)
  if (!baseSlug) baseSlug = 'doctor'
  
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    let query = supabase.from('doctors').select('id').eq('slug', slug)
    if (existingId) {
      query = query.neq('id', existingId)
    }
    const { data } = await query.single()
    
    if (!data) break
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

const defaultBkashConfig = {
  mode: 'sandbox',
  sandbox: {
    base_url: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    username: 'sandboxTokenizedUser02',
    password: 'sandboxTokenizedUser02@12345',
    app_key: '4f6o0cjiki2rfm34kfdadl1eqq',
    app_secret: '2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b'
  },
  production: {
    base_url: 'https://tokenized.pay.bka.sh/v1.2.0-beta',
    username: '',
    password: '',
    app_key: '',
    app_secret: ''
  }
}

let bkashToken = null
let tokenExpiresAt = null

async function getBkashConfig() {
  try {
    if (!supabase) return defaultBkashConfig
    
    const { data, error } = await supabase
      .from('bkash_settings')
      .select('*')
      .single()
    
    if (error || !data) return defaultBkashConfig
    
    return {
      mode: data.mode || 'sandbox',
      sandbox: {
        base_url: data.sandbox_base_url || defaultBkashConfig.sandbox.base_url,
        username: data.sandbox_username || defaultBkashConfig.sandbox.username,
        password: data.sandbox_password || defaultBkashConfig.sandbox.password,
        app_key: data.sandbox_app_key || defaultBkashConfig.sandbox.app_key,
        app_secret: data.sandbox_app_secret || defaultBkashConfig.sandbox.app_secret
      },
      production: {
        base_url: data.production_base_url || defaultBkashConfig.production.base_url,
        username: data.production_username || '',
        password: data.production_password || '',
        app_key: data.production_app_key || '',
        app_secret: data.production_app_secret || ''
      }
    }
  } catch (error) {
    console.error('Error fetching bKash config:', error)
    return defaultBkashConfig
  }
}

function getActiveConfig(config) {
  return config.mode === 'production' ? config.production : config.sandbox
}

async function getToken() {
  if (bkashToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    return bkashToken
  }

  const config = await getBkashConfig()
  const activeConfig = getActiveConfig(config)

  try {
    const response = await fetch(`${activeConfig.base_url}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'username': activeConfig.username,
        'password': activeConfig.password
      },
      body: JSON.stringify({
        app_key: activeConfig.app_key,
        app_secret: activeConfig.app_secret
      })
    })

    const data = await response.json()
    
    if (data.statusCode === '0000' && data.id_token) {
      bkashToken = data.id_token
      tokenExpiresAt = new Date(Date.now() + (data.expires_in * 1000) - 60000)
      return bkashToken
    }
    
    throw new Error(data.statusMessage || 'Token generation failed')
  } catch (error) {
    console.error('Error getting bKash token:', error)
    throw error
  }
}

app.post('/api/bkash/create-payment', async (req, res) => {
  try {
    const { amount, payerReference, merchantInvoiceNumber, paymentType } = req.body
    
    const config = await getBkashConfig()
    const activeConfig = getActiveConfig(config)
    const token = await getToken()
    
    let baseURL = ''
    if (process.env.REPLIT_DOMAINS) {
      baseURL = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      baseURL = `https://${process.env.REPLIT_DEV_DOMAIN}`
    } else {
      const protocol = req.headers['x-forwarded-proto'] || 'https'
      const host = req.headers['x-forwarded-host'] || req.headers.host
      baseURL = `${protocol}://${host}`
    }
    const callbackURL = paymentType === 'product' 
      ? `${baseURL}/api/bkash/callback?type=product`
      : `${baseURL}/api/bkash/callback`
    
    console.log('bKash Callback URL:', callbackURL)

    const response = await fetch(`${activeConfig.base_url}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'authorization': token,
        'x-app-key': activeConfig.app_key
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: payerReference,
        callbackURL: callbackURL,
        amount: String(amount),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: merchantInvoiceNumber
      })
    })

    const data = await response.json()
    
    if (data.statusCode === '0000' && data.bkashURL) {
      res.json({
        success: true,
        paymentID: data.paymentID,
        bkashURL: data.bkashURL
      })
    } else {
      res.json({
        success: false,
        message: data.statusMessage || 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে'
      })
    }
  } catch (error) {
    console.error('Create payment error:', error)
    res.status(500).json({
      success: false,
      message: 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে'
    })
  }
})

app.get('/api/bkash/callback', async (req, res) => {
  const { paymentID, status, type } = req.query
  
  // Use the configured frontend URL from environment variable for production
  // This is needed when backend is deployed separately from frontend (e.g., Render + Vercel)
  let frontendURL = process.env.FRONTEND_URL || ''
  
  if (!frontendURL) {
    // Fallback for development/Replit environment
    if (process.env.REPLIT_DOMAINS) {
      frontendURL = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      frontendURL = `https://${process.env.REPLIT_DEV_DOMAIN}`
    } else {
      // Default to production frontend URL
      frontendURL = 'https://easydoctorrangpur01.vercel.app'
    }
  }
  
  if (type === 'product') {
    res.redirect(`${frontendURL}/product-order/callback?paymentID=${paymentID}&status=${status}`)
  } else {
    res.redirect(`${frontendURL}/paid-book/callback?paymentID=${paymentID}&status=${status}`)
  }
})

app.post('/api/bkash/execute-payment', async (req, res) => {
  try {
    const { paymentID } = req.body
    
    const config = await getBkashConfig()
    const activeConfig = getActiveConfig(config)
    
    const maxRetries = 3
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const token = await getToken()
        
        console.log(`Execute payment attempt ${attempt}/${maxRetries}`)
        
        const response = await fetch(`${activeConfig.base_url}/tokenized/checkout/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'authorization': token,
            'x-app-key': activeConfig.app_key
          },
          body: JSON.stringify({ paymentID })
        })

        const data = await response.json()
        console.log(`Execute payment response (attempt ${attempt}):`, JSON.stringify(data))
        
        if (data.statusCode === '0000' && data.transactionStatus === 'Completed') {
          return res.json({
            success: true,
            trxID: data.trxID,
            paymentID: data.paymentID,
            amount: data.amount
          })
        }
        
        if (data.statusCode === '2062' || 
            data.statusCode === '2117' ||
            (data.statusMessage && data.statusMessage.toLowerCase().includes('already been completed')) ||
            (data.statusMessage && data.statusMessage.toLowerCase().includes('already been called'))) {
          console.log('Payment already completed/executed - returning success')
          return res.json({
            success: true,
            trxID: data.trxID || `COMPLETED_${paymentID}`,
            paymentID: paymentID,
            amount: data.amount || '100',
            alreadyCompleted: true
          })
        }
        
        if (data.statusCode === '9999' || 
            (data.statusMessage && data.statusMessage.toLowerCase().includes('system error'))) {
          lastError = data.statusMessage || 'System Error'
          if (attempt < maxRetries) {
            console.log(`System error, waiting before retry...`)
            await new Promise(resolve => setTimeout(resolve, 1500 * attempt))
            continue
          }
        } else {
          return res.json({
            success: false,
            message: data.statusMessage || 'পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে'
          })
        }
      } catch (attemptError) {
        console.error(`Attempt ${attempt} error:`, attemptError)
        lastError = attemptError.message
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1500 * attempt))
        }
      }
    }
    
    console.log('All retries exhausted, trying final query...')
    try {
      const token = await getToken()
      const queryResponse = await fetch(`${activeConfig.base_url}/tokenized/checkout/payment/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': activeConfig.app_key
        },
        body: JSON.stringify({ paymentID })
      })
      
      const queryData = await queryResponse.json()
      console.log('Final query payment response:', JSON.stringify(queryData))
      
      if (queryData.transactionStatus === 'Completed' && queryData.trxID) {
        return res.json({
          success: true,
          trxID: queryData.trxID,
          paymentID: queryData.paymentID || paymentID,
          amount: queryData.amount,
          alreadyCompleted: true
        })
      }
    } catch (finalQueryError) {
      console.error('Final query error:', finalQueryError)
    }
    
    res.json({
      success: false,
      message: 'পেমেন্ট যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষন পর আবার চেষ্টা করুন।'
    })
  } catch (error) {
    console.error('Execute payment error:', error)
    res.status(500).json({
      success: false,
      message: 'পেমেন্ট যাচাই করতে সমস্যা হয়েছে'
    })
  }
})

app.get('/api/bkash/query-payment/:paymentID', async (req, res) => {
  try {
    const { paymentID } = req.params
    
    const config = await getBkashConfig()
    const activeConfig = getActiveConfig(config)
    const token = await getToken()

    const response = await fetch(`${activeConfig.base_url}/tokenized/checkout/payment/status?paymentID=${paymentID}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'authorization': token,
        'x-app-key': activeConfig.app_key
      }
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Query payment error:', error)
    res.status(500).json({ success: false, message: 'Error querying payment' })
  }
})

app.get('/api/bkash/settings', async (req, res) => {
  try {
    const config = await getBkashConfig()
    res.json({
      success: true,
      mode: config.mode,
      hasProductionCredentials: !!(config.production.username && config.production.app_key)
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ success: false, message: 'Error fetching settings' })
  }
})

app.get('/api/doctor/by-slug/:slug', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Database not configured' })
    }
    
    const { slug } = req.params
    
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }
    
    res.json({ success: true, doctor: data })
  } catch (error) {
    console.error('Error fetching doctor by slug:', error)
    res.status(500).json({ success: false, message: 'Error fetching doctor' })
  }
})

app.post('/api/doctor/generate-slugs', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Database not configured' })
    }
    
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('id, name, slug')
    
    if (error) throw error
    
    let updated = 0
    for (const doctor of doctors) {
      if (!doctor.slug) {
        const slug = await generateUniqueSlug(supabase, doctor.name, doctor.id)
        await supabase
          .from('doctors')
          .update({ slug })
          .eq('id', doctor.id)
        updated++
      }
    }
    
    res.json({ success: true, message: `Generated slugs for ${updated} doctors` })
  } catch (error) {
    console.error('Error generating slugs:', error)
    res.status(500).json({ success: false, message: 'Error generating slugs' })
  }
})

app.get('/doctor/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    
    if (!supabase) {
      return res.redirect('/')
    }
    
    let doctor = null
    
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    
    if (isUUID) {
      const { data } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', slug)
        .eq('is_active', true)
        .single()
      doctor = data
      
      if (doctor?.slug) {
        return res.redirect(301, `/doctor/${doctor.slug}`)
      }
    } else {
      const { data } = await supabase
        .from('doctors')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      doctor = data
    }
    
    if (!doctor) {
      return res.redirect('/')
    }
    
    // Use frontend URL for redirects (when backend is deployed separately)
    let frontendURL = process.env.FRONTEND_URL || ''
    if (!frontendURL) {
      if (process.env.REPLIT_DOMAINS) {
        frontendURL = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      } else if (process.env.REPLIT_DEV_DOMAIN) {
        frontendURL = `https://${process.env.REPLIT_DEV_DOMAIN}`
      } else {
        frontendURL = 'https://easydoctorrangpur01.vercel.app'
      }
    }
    
    const doctorUrl = `${frontendURL}/doctor/${doctor.slug || doctor.id}`
    const doctorImage = doctor.image_url || `${frontendURL}/logo.png`
    const rating = doctor.rating ? `${doctor.rating} স্টার রেটিং` : ''
    const degreeInfo = doctor.degrees ? ` | ${doctor.degrees}` : ''
    const description = `${doctor.category_name || 'বিশেষজ্ঞ ডাক্তার'}${degreeInfo} ${rating ? '| ' + rating : ''} | ${doctor.chamber_address || 'রংপুর'}`
    
    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doctor.name} - ${doctor.category_name || 'বিশেষজ্ঞ ডাক্তার'} | ইজি ডক্টর রংপুর</title>
  
  <!-- Open Graph Meta Tags for Social Sharing -->
  <meta property="og:title" content="${doctor.name} - ${doctor.category_name || 'বিশেষজ্ঞ ডাক্তার'}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${doctorImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${doctor.name} - ${doctor.category_name || 'বিশেষজ্ঞ ডাক্তার'}">
  <meta property="og:url" content="${doctorUrl}">
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="ইজি ডক্টর রংপুর">
  <meta property="og:locale" content="bn_BD">
  <meta property="profile:first_name" content="${doctor.name.split(' ')[0] || doctor.name}">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@EasyDoctorRangpur">
  <meta name="twitter:title" content="${doctor.name} - ${doctor.category_name || 'বিশেষজ্ঞ ডাক্তার'}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${doctorImage}">
  
  <!-- Standard Meta Tags -->
  <meta name="description" content="${description}">
  <meta name="author" content="${doctor.name}">
  <meta name="keywords" content="${doctor.name}, ${doctor.category_name || 'ডাক্তার'}, রংপুর, অ্যাপয়েন্টমেন্ট, ${doctor.district || 'রংপুর'}">
  <link rel="canonical" href="${doctorUrl}">
  <link rel="icon" type="image/png" href="${frontendURL}/logo-icon.png">
  
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); }
    .card { background: white; border-radius: 16px; padding: 32px; max-width: 400px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .avatar { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #14b8a6; margin-bottom: 16px; }
    .name { font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 8px; }
    .category { font-size: 16px; color: #14b8a6; font-weight: 500; margin: 0 0 16px; }
    .loader { color: #6b7280; }
  </style>
  
  <script>
    setTimeout(function() {
      window.location.replace('${doctorUrl}');
    }, 100);
  </script>
</head>
<body>
  <div class="card">
    ${doctor.image_url ? `<img src="${doctorImage}" alt="${doctor.name}" class="avatar" />` : ''}
    <h1 class="name">${doctor.name}</h1>
    <p class="category">${doctor.category_name || 'বিশেষজ্ঞ ডাক্তার'}</p>
    <p class="loader">প্রোফাইলে নিয়ে যাওয়া হচ্ছে...</p>
  </div>
</body>
</html>`
    
    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    console.error('Error serving doctor meta page:', error)
    res.redirect('/')
  }
})

// Admin Authentication Endpoints (Secure Server-Side)

// Admin Login - verify credentials against Supabase
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'ইউজারনেম এবং পাসওয়ার্ড প্রয়োজন' })
    }

    if (!supabase) {
      // Fallback to default credentials if Supabase not configured
      if (username === 'admin' && password === 'admin123') {
        return res.json({ success: true, message: 'লগইন সফল' })
      }
      return res.status(401).json({ success: false, message: 'ভুল ইউজারনেম বা পাসওয়ার্ড' })
    }

    const { data, error } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !data) {
      // Fallback check for default credentials
      if (username === 'admin' && password === 'admin123') {
        return res.json({ success: true, message: 'লগইন সফল' })
      }
      return res.status(401).json({ success: false, message: 'ভুল ইউজারনেম বা পাসওয়ার্ড' })
    }

    // Check if password is hashed (starts with $2)
    const isHashed = data.password.startsWith('$2')
    let passwordValid = false

    if (isHashed) {
      passwordValid = await bcrypt.compare(password, data.password)
    } else {
      passwordValid = data.password === password
    }

    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'ভুল ইউজারনেম বা পাসওয়ার্ড' })
    }

    res.json({ success: true, message: 'লগইন সফল' })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ success: false, message: 'লগইন করতে সমস্যা হয়েছে' })
  }
})

// Generate OTP for credential update - REQUIRES current admin password for authorization
app.post('/api/admin/generate-otp', async (req, res) => {
  try {
    const { currentUsername, currentPassword, newUsername, newPassword } = req.body

    if (!currentUsername || !currentPassword) {
      return res.status(400).json({ success: false, message: 'বর্তমান ইউজারনেম এবং পাসওয়ার্ড প্রয়োজন' })
    }

    if (!newUsername || !newPassword) {
      return res.status(400).json({ success: false, message: 'নতুন ইউজারনেম এবং পাসওয়ার্ড প্রয়োজন' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' })
    }

    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস কনফিগার করা হয়নি' })
    }

    // SECURITY: First verify current admin credentials before allowing OTP generation
    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', currentUsername)
      .single()

    if (adminError || !adminData) {
      // Check default credentials fallback
      if (!(currentUsername === 'admin' && currentPassword === 'admin123')) {
        return res.status(401).json({ success: false, message: 'বর্তমান ইউজারনেম বা পাসওয়ার্ড ভুল' })
      }
    } else {
      // Verify password
      const isHashed = adminData.password.startsWith('$2')
      let passwordValid = false

      if (isHashed) {
        passwordValid = await bcrypt.compare(currentPassword, adminData.password)
      } else {
        passwordValid = adminData.password === currentPassword
      }

      if (!passwordValid) {
        return res.status(401).json({ success: false, message: 'বর্তমান ইউজারনেম বা পাসওয়ার্ড ভুল' })
      }
    }

    // Clear any existing unused OTPs
    await supabase
      .from('admin_otp')
      .delete()
      .eq('is_used', false)

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Store OTP with hashed password
    const { error: insertError } = await supabase
      .from('admin_otp')
      .insert({
        otp_code: otpCode,
        new_username: newUsername,
        new_password: hashedPassword,
        is_used: false,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })

    if (insertError) {
      console.error('OTP insert error:', insertError)
      return res.status(500).json({ success: false, message: 'OTP তৈরি করতে সমস্যা হয়েছে' })
    }

    res.json({ 
      success: true, 
      message: 'OTP তৈরি হয়েছে। সুপাবেস admin_otp টেবিল থেকে otp_code কপি করুন।' 
    })
  } catch (error) {
    console.error('Generate OTP error:', error)
    res.status(500).json({ success: false, message: 'OTP তৈরি করতে সমস্যা হয়েছে' })
  }
})

// Verify OTP and update credentials
app.post('/api/admin/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: '৬ সংখ্যার OTP প্রয়োজন' })
    }

    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস কনফিগার করা হয়নি' })
    }

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabase
      .from('admin_otp')
      .select('*')
      .eq('otp_code', otp)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otpData) {
      return res.status(400).json({ success: false, message: 'ভুল বা মেয়াদোত্তীর্ণ OTP' })
    }

    // Check if admin_credentials exists
    const { data: existingCreds } = await supabase
      .from('admin_credentials')
      .select('id')
      .limit(1)
      .single()

    if (existingCreds) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('admin_credentials')
        .update({
          username: otpData.new_username,
          password: otpData.new_password,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCreds.id)

      if (updateError) {
        console.error('Credential update error:', updateError)
        return res.status(500).json({ success: false, message: 'ক্রেডেনশিয়াল আপডেট করতে সমস্যা হয়েছে' })
      }
    } else {
      // Insert new credentials
      const { error: insertError } = await supabase
        .from('admin_credentials')
        .insert({
          username: otpData.new_username,
          password: otpData.new_password
        })

      if (insertError) {
        console.error('Credential insert error:', insertError)
        return res.status(500).json({ success: false, message: 'ক্রেডেনশিয়াল সেভ করতে সমস্যা হয়েছে' })
      }
    }

    // Mark OTP as used
    await supabase
      .from('admin_otp')
      .update({ is_used: true })
      .eq('id', otpData.id)

    res.json({ 
      success: true, 
      message: 'ক্রেডেনশিয়াল সফলভাবে আপডেট হয়েছে!' 
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ success: false, message: 'OTP যাচাই করতে সমস্যা হয়েছে' })
  }
})

// Get interstitial ads settings
app.get('/api/interstitial-ads', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস সংযোগ নেই' })
    }

    const { data, error } = await supabase
      .from('interstitial_ads')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching interstitial ads:', error)
      return res.status(500).json({ success: false, message: 'সেটিংস লোড করতে সমস্যা হয়েছে' })
    }

    res.json({ success: true, data: data || null })
  } catch (error) {
    console.error('Error fetching interstitial ads:', error)
    res.status(500).json({ success: false, message: 'সেটিংস লোড করতে সমস্যা হয়েছে' })
  }
})

// Save interstitial ads settings (Admin only)
app.post('/api/interstitial-ads', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস সংযোগ নেই' })
    }

    const { id, adminAuth, ...updateData } = req.body

    if (!adminAuth || !adminAuth.username || !adminAuth.password) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', adminAuth.username)
      .single()

    let isAuthenticated = false

    if (adminError || !adminData) {
      if (adminAuth.username === 'admin' && adminAuth.password === 'admin123') {
        isAuthenticated = true
      }
    } else {
      const isHashed = adminData.password.startsWith('$2')
      if (isHashed) {
        isAuthenticated = await bcrypt.compare(adminAuth.password, adminData.password)
      } else {
        isAuthenticated = adminData.password === adminAuth.password
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    if (id) {
      const { error } = await supabase
        .from('interstitial_ads')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Error updating interstitial ads:', error)
        return res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }

      res.json({ success: true, message: 'সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!' })
    } else {
      const { data, error } = await supabase
        .from('interstitial_ads')
        .insert([updateData])
        .select()
        .single()

      if (error) {
        console.error('Error inserting interstitial ads:', error)
        return res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }

      res.json({ success: true, message: 'সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!', data })
    }
  } catch (error) {
    console.error('Error saving interstitial ads:', error)
    res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
  }
})

// Get doctor packages
app.get('/api/doctor-packages', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস সংযোগ নেই' })
    }

    const { data: packages, error } = await supabase
      .from('doctor_packages')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching packages:', error)
      return res.status(500).json({ success: false, message: 'প্যাকেজ লোড করতে সমস্যা হয়েছে' })
    }

    const packagesWithFeatures = await Promise.all(packages.map(async (pkg) => {
      const { data: features } = await supabase
        .from('doctor_package_features')
        .select('*')
        .eq('package_id', pkg.id)
        .order('sort_order', { ascending: true })
      
      return { ...pkg, features: features || [] }
    }))

    res.json({ success: true, data: packagesWithFeatures })
  } catch (error) {
    console.error('Error fetching packages:', error)
    res.status(500).json({ success: false, message: 'প্যাকেজ লোড করতে সমস্যা হয়েছে' })
  }
})

// Save/update doctor package (Admin only)
app.post('/api/doctor-packages', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস সংযোগ নেই' })
    }

    const { id, adminAuth, features, ...packageData } = req.body

    if (!adminAuth || !adminAuth.username || !adminAuth.password) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', adminAuth.username)
      .single()

    let isAuthenticated = false

    if (adminError || !adminData) {
      if (adminAuth.username === 'admin' && adminAuth.password === 'admin123') {
        isAuthenticated = true
      }
    } else {
      const isHashed = adminData.password.startsWith('$2')
      if (isHashed) {
        isAuthenticated = await bcrypt.compare(adminAuth.password, adminData.password)
      } else {
        isAuthenticated = adminData.password === adminAuth.password
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    let packageId = id

    if (id) {
      const { error } = await supabase
        .from('doctor_packages')
        .update({ ...packageData, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error updating package:', error)
        return res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }
    } else {
      const { data, error } = await supabase
        .from('doctor_packages')
        .insert([packageData])
        .select()
        .single()

      if (error) {
        console.error('Error inserting package:', error)
        return res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }
      packageId = data.id
    }

    if (features && Array.isArray(features)) {
      await supabase
        .from('doctor_package_features')
        .delete()
        .eq('package_id', packageId)

      if (features.length > 0) {
        const featuresToInsert = features.map((f, idx) => ({
          package_id: packageId,
          label: f.label,
          value: f.value,
          sort_order: f.sort_order || idx + 1
        }))

        await supabase
          .from('doctor_package_features')
          .insert(featuresToInsert)
      }
    }

    res.json({ success: true, message: 'প্যাকেজ সফলভাবে সংরক্ষণ করা হয়েছে!' })
  } catch (error) {
    console.error('Error saving package:', error)
    res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
  }
})

// Delete doctor package (Admin only)
app.delete('/api/doctor-packages/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস সংযোগ নেই' })
    }

    const { id } = req.params
    const { adminAuth } = req.body

    if (!adminAuth || !adminAuth.username || !adminAuth.password) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', adminAuth.username)
      .single()

    let isAuthenticated = false

    if (adminError || !adminData) {
      if (adminAuth.username === 'admin' && adminAuth.password === 'admin123') {
        isAuthenticated = true
      }
    } else {
      const isHashed = adminData.password.startsWith('$2')
      if (isHashed) {
        isAuthenticated = await bcrypt.compare(adminAuth.password, adminData.password)
      } else {
        isAuthenticated = adminData.password === adminAuth.password
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    const { error } = await supabase
      .from('doctor_packages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting package:', error)
      return res.status(500).json({ success: false, message: 'মুছে ফেলতে সমস্যা হয়েছে' })
    }

    res.json({ success: true, message: 'প্যাকেজ মুছে ফেলা হয়েছে' })
  } catch (error) {
    console.error('Error deleting package:', error)
    res.status(500).json({ success: false, message: 'মুছে ফেলতে সমস্যা হয়েছে' })
  }
})

// Get advertisement settings
app.get('/api/advertisement-settings', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস সংযোগ নেই' })
    }

    const { data: adTypes, error } = await supabase
      .from('advertisement_types')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching ad types:', error)
      return res.status(500).json({ success: false, message: 'সেটিংস লোড করতে সমস্যা হয়েছে' })
    }

    const adTypesWithData = await Promise.all(adTypes.map(async (at) => {
      const [pricingRes, categoriesRes, facilitiesRes] = await Promise.all([
        supabase
          .from('advertisement_pricing')
          .select('*')
          .eq('ad_type_id', at.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('advertisement_categories')
          .select('*')
          .eq('ad_type_id', at.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('advertisement_facilities')
          .select('*')
          .eq('ad_type_id', at.id)
          .order('sort_order', { ascending: true })
      ])

      return {
        ...at,
        pricing: pricingRes.data || [],
        categories: categoriesRes.data || [],
        facilities: facilitiesRes.data || []
      }
    }))

    res.json({ success: true, data: adTypesWithData })
  } catch (error) {
    console.error('Error fetching ad settings:', error)
    res.status(500).json({ success: false, message: 'সেটিংস লোড করতে সমস্যা হয়েছে' })
  }
})

// Save advertisement settings (Admin only)
app.post('/api/advertisement-settings', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস সংযোগ নেই' })
    }

    const { type, data, adminAuth } = req.body

    if (!adminAuth || !adminAuth.username || !adminAuth.password) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', adminAuth.username)
      .single()

    let isAuthenticated = false

    if (adminError || !adminData) {
      if (adminAuth.username === 'admin' && adminAuth.password === 'admin123') {
        isAuthenticated = true
      }
    } else {
      const isHashed = adminData.password.startsWith('$2')
      if (isHashed) {
        isAuthenticated = await bcrypt.compare(adminAuth.password, adminData.password)
      } else {
        isAuthenticated = adminData.password === adminAuth.password
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    let tableName = ''
    let updateData = { ...data }
    delete updateData.id

    switch (type) {
      case 'ad_type':
        tableName = 'advertisement_types'
        break
      case 'pricing':
        tableName = 'advertisement_pricing'
        break
      case 'category':
        tableName = 'advertisement_categories'
        break
      case 'facility':
        tableName = 'advertisement_facilities'
        break
      default:
        return res.status(400).json({ success: false, message: 'অবৈধ টাইপ' })
    }

    if (data.id) {
      const { error } = await supabase
        .from(tableName)
        .update({ ...updateData, updated_at: type === 'ad_type' ? new Date().toISOString() : undefined })
        .eq('id', data.id)

      if (error) {
        console.error('Error updating:', error)
        return res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }
    } else {
      const { error } = await supabase
        .from(tableName)
        .insert([updateData])

      if (error) {
        console.error('Error inserting:', error)
        return res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
      }
    }

    res.json({ success: true, message: 'সফলভাবে সংরক্ষণ করা হয়েছে!' })
  } catch (error) {
    console.error('Error saving ad settings:', error)
    res.status(500).json({ success: false, message: 'সংরক্ষণ করতে সমস্যা হয়েছে' })
  }
})

// Delete advertisement settings item (Admin only)
app.delete('/api/advertisement-settings', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'ডাটাবেস সংযোগ নেই' })
    }

    const { type, id, adminAuth } = req.body

    if (!adminAuth || !adminAuth.username || !adminAuth.password) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', adminAuth.username)
      .single()

    let isAuthenticated = false

    if (adminError || !adminData) {
      if (adminAuth.username === 'admin' && adminAuth.password === 'admin123') {
        isAuthenticated = true
      }
    } else {
      const isHashed = adminData.password.startsWith('$2')
      if (isHashed) {
        isAuthenticated = await bcrypt.compare(adminAuth.password, adminData.password)
      } else {
        isAuthenticated = adminData.password === adminAuth.password
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস' })
    }

    let tableName = ''
    switch (type) {
      case 'ad_type':
        tableName = 'advertisement_types'
        break
      case 'pricing':
        tableName = 'advertisement_pricing'
        break
      case 'category':
        tableName = 'advertisement_categories'
        break
      case 'facility':
        tableName = 'advertisement_facilities'
        break
      default:
        return res.status(400).json({ success: false, message: 'অবৈধ টাইপ' })
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting:', error)
      return res.status(500).json({ success: false, message: 'মুছে ফেলতে সমস্যা হয়েছে' })
    }

    res.json({ success: true, message: 'মুছে ফেলা হয়েছে' })
  } catch (error) {
    console.error('Error deleting ad settings:', error)
    res.status(500).json({ success: false, message: 'মুছে ফেলতে সমস্যা হয়েছে' })
  }
})

// Auto-complete confirmed appointments endpoint (for cron job)
// This should be called at midnight Bangladesh time (GMT+6)
app.post('/api/appointments/auto-complete', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Database not configured' })
    }

    // Get current date in Bangladesh timezone (GMT+6)
    const now = new Date()
    const bdTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
    const todayBD = bdTime.toISOString().split('T')[0]

    // Auto-complete confirmed appointments from regular appointments table
    const { data: regularCompleted, error: regularError } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('status', 'confirmed')
      .lt('appointment_date', todayBD)
      .select('id')

    if (regularError) {
      console.error('Error auto-completing regular appointments:', regularError)
    }

    // Auto-complete confirmed appointments from paid appointments table
    const { data: paidCompleted, error: paidError } = await supabase
      .from('paid_appointments')
      .update({ status: 'completed' })
      .eq('status', 'confirmed')
      .lt('appointment_date', todayBD)
      .select('id')

    if (paidError) {
      console.error('Error auto-completing paid appointments:', paidError)
    }

    const regularCount = regularCompleted?.length || 0
    const paidCount = paidCompleted?.length || 0

    console.log(`Auto-completed ${regularCount} regular and ${paidCount} paid appointments on ${todayBD}`)

    res.json({
      success: true,
      message: `সফলভাবে ${regularCount + paidCount}টি অ্যাপয়েন্টমেন্ট সম্পন্ন করা হয়েছে`,
      regularCompleted: regularCount,
      paidCompleted: paidCount,
      date: todayBD
    })
  } catch (error) {
    console.error('Auto-complete error:', error)
    res.status(500).json({ success: false, message: 'Auto-complete failed' })
  }
})

// Get current Bangladesh time (for debugging/verification)
app.get('/api/time/bd', (req, res) => {
  const now = new Date()
  const bdTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
  res.json({
    utc: now.toISOString(),
    bangladesh: bdTime.toISOString(),
    bangladeshDate: bdTime.toISOString().split('T')[0],
    bangladeshTime: bdTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour12: true })
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`)
})
