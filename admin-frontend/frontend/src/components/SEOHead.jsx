import { Helmet } from 'react-helmet-async'

function SEOHead({ 
  title = 'ইজি ডক্টর রংপুর - ডাক্তার অ্যাপয়েন্টমেন্ট বুকিং',
  description = 'রংপুর বিভাগের সেরা ডাক্তারদের সাথে সহজে অনলাইন অ্যাপয়েন্টমেন্ট বুক করুন। বিশেষজ্ঞ ডাক্তার, হাসপাতাল, ডায়াগনস্টিক সেন্টার এবং অ্যাম্বুলেন্স সেবা।',
  keywords = 'ডাক্তার রংপুর, অ্যাপয়েন্টমেন্ট বুকিং, রংপুর হাসপাতাল, ডায়াগনস্টিক সেন্টার, অ্যাম্বুলেন্স সেবা, বিশেষজ্ঞ ডাক্তার',
  image = '/og-image.png',
  url = '',
  type = 'website',
  noIndex = false,
  structuredData = null,
  author = 'ইজি ডক্টর রংপুর',
  language = 'bn-BD'
}) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`

  return (
    <Helmet>
      <html lang="bn" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="language" content={language} />
      
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      <link rel="canonical" href={fullUrl} />
      
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:locale" content="bn_BD" />
      <meta property="og:site_name" content="ইজি ডক্টর রংপুর" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      <meta name="theme-color" content="#0891b2" />
      <meta name="msapplication-TileColor" content="#0891b2" />
      
      <meta name="geo.region" content="BD-55" />
      <meta name="geo.placename" content="Rangpur" />
      
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )
}

export function getWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ইজি ডক্টর রংপুর",
    "alternateName": "Easy Doctor Rangpur",
    "url": typeof window !== 'undefined' ? window.location.origin : '',
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${typeof window !== 'undefined' ? window.location.origin : ''}/specialist-doctors?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }
}

export function getOrganizationStructuredData() {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "ইজি ডক্টর রংপুর",
    "alternateName": "Easy Doctor Rangpur",
    "url": siteUrl,
    "logo": `${siteUrl}/logo-icon.png`,
    "description": "রংপুর বিভাগের সেরা ডাক্তারদের সাথে অনলাইন অ্যাপয়েন্টমেন্ট বুকিং প্ল্যাটফর্ম",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Rangpur",
      "addressRegion": "Rangpur Division",
      "addressCountry": "BD"
    },
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 25.7439,
        "longitude": 89.2752
      },
      "geoRadius": "100000"
    },
    "serviceType": ["Doctor Appointment Booking", "Telemedicine", "Hospital Search", "Ambulance Service"]
  }
}

export function getDoctorStructuredData(doctor) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": doctor.name,
    "image": doctor.image_url,
    "url": `${siteUrl}/doctor/${doctor.id}`,
    "description": doctor.bio || `${doctor.name} - ${doctor.category_name || 'বিশেষজ্ঞ ডাক্তার'}`,
    "medicalSpecialty": doctor.category_name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": doctor.district || "Rangpur",
      "addressCountry": "BD"
    },
    "worksFor": doctor.chamber_name ? {
      "@type": "MedicalOrganization",
      "name": doctor.chamber_name
    } : undefined,
    ...(doctor.average_rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": doctor.average_rating,
        "reviewCount": doctor.review_count || 1,
        "bestRating": 5,
        "worstRating": 1
      }
    })
  }
}

export function getProductStructuredData(product) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url,
    "description": product.short_description || product.description,
    "url": `${siteUrl}/product/${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": product.manufacturer || "ইজি ডক্টর রংপুর"
    },
    "offers": {
      "@type": "Offer",
      "price": product.sale_price || product.price,
      "priceCurrency": "BDT",
      "availability": product.stock_quantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "ইজি ডক্টর রংপুর"
      }
    },
    ...(product.average_rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.average_rating,
        "reviewCount": product.review_count || 1,
        "bestRating": 5,
        "worstRating": 1
      }
    })
  }
}

export function getBlogStructuredData(blog) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "image": blog.image_url,
    "url": `${siteUrl}/blog/${blog.slug}`,
    "datePublished": blog.created_at,
    "dateModified": blog.updated_at || blog.created_at,
    "author": {
      "@type": "Person",
      "name": blog.author_name || "ইজি ডক্টর রংপুর"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ইজি ডক্টর রংপুর",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo-icon.png`
      }
    },
    "description": blog.excerpt || blog.meta_description
  }
}

export function getLocalBusinessStructuredData() {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "ইজি ডক্টর রংপুর",
    "@id": siteUrl,
    "url": siteUrl,
    "telephone": "+8801XXXXXXXXX",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "রংপুর",
      "addressLocality": "রংপুর",
      "addressRegion": "রংপুর বিভাগ",
      "postalCode": "5400",
      "addressCountry": "BD"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 25.7439,
      "longitude": 89.2752
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    },
    "sameAs": []
  }
}

export function getBreadcrumbStructuredData(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }
}

export function getFAQStructuredData(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

export default SEOHead
