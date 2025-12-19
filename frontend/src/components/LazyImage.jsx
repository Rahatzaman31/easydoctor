import { useState, useEffect, useRef } from 'react'

/**
 * LazyImage - Optimized image component with native lazy loading
 * Supports WebP with PNG fallback
 */
export default function LazyImage({ 
  src, 
  alt = '', 
  className = '', 
  width, 
  height,
  srcWebp,
  onLoad
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '50px' }
    )

    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <picture ref={imgRef}>
      {srcWebp && <source srcSet={srcWebp} type="image/webp" />}
      <img
        src={isVisible ? src : 'data:image/gif;base64,R0lGODlhAQABAAAAACw='}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => {
          setIsLoaded(true)
          onLoad?.()
        }}
      />
    </picture>
  )
}
