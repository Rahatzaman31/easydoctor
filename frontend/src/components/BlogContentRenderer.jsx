import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import EmbeddedDoctorCards from './EmbeddedDoctorCards'

function DoctorCardsPortal({ container, slugs }) {
  if (!container) return null
  return createPortal(<EmbeddedDoctorCards doctorSlugs={slugs} />, container)
}

function BlogContentRenderer({ content }) {
  const containerRef = useRef(null)
  const [doctorContainers, setDoctorContainers] = useState([])

  const processedContent = useMemo(() => {
    if (!content) return ''
    
    // Support both old and new formats (with or without inner preview HTML)
    // Also remove the "Click to edit" prompt from the final render
    const cleanedContent = content.replace(/<div class="edit-prompt"[^>]*>([\s\S]*?)<\/div>/gi, '')

    return cleanedContent.replace(
      /<div[^>]*class="embedded-doctors"[^>]*data-doctor-slugs="([^"]*)"[^>]*>([\s\S]*?)<\/div>/gi,
      (match, slugs) => {
        const id = `doctor-embed-${Math.random().toString(36).substr(2, 9)}`
        return `<div id="${id}" class="doctor-embed-placeholder" data-doctor-slugs="${slugs}"></div>`
      }
    )
  }, [content])

  useEffect(() => {
    if (!containerRef.current) return

    const placeholders = containerRef.current.querySelectorAll('.doctor-embed-placeholder')
    const containers = []

    placeholders.forEach(placeholder => {
      const slugs = placeholder.getAttribute('data-doctor-slugs')
      if (slugs) {
        containers.push({
          element: placeholder,
          slugs: slugs.split(',').filter(s => s.trim())
        })
      }
    })

    setDoctorContainers(containers)
  }, [processedContent])

  if (!content) return null

  return (
    <>
      <div 
        ref={containerRef}
        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-teal-600 prose-strong:text-gray-900 prose-img:rounded-xl prose-img:shadow-lg"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      {doctorContainers.map((container, index) => (
        <DoctorCardsPortal 
          key={index}
          container={container.element}
          slugs={container.slugs}
        />
      ))}
    </>
  )
}

export default BlogContentRenderer
