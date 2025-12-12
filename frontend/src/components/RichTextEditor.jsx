import { useMemo, useState, useEffect, useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const fontSizeArr = ['small', false, 'large', 'huge']

const normalizeContent = (content) => {
  if (typeof content === 'string') {
    return content.normalize('NFC')
  }
  return content || ''
}

function RichTextEditor({ value, onChange, placeholder = '' }) {
  const [isReady, setIsReady] = useState(false)
  const [internalValue, setInternalValue] = useState('')
  const quillRef = useRef(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!isInitializedRef.current) {
      const normalized = normalizeContent(value)
      setInternalValue(normalized)
      isInitializedRef.current = true
    }
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isInitializedRef.current && value !== undefined) {
      const normalized = normalizeContent(value)
      if (normalized !== internalValue) {
        setInternalValue(normalized)
      }
    }
  }, [value])

  const handleChange = (content, delta, source) => {
    if (source === 'user') {
      try {
        const normalized = normalizeContent(content)
        setInternalValue(normalized)
        if (onChange) {
          onChange(normalized)
        }
      } catch (error) {
        console.warn('RichTextEditor: Error normalizing content', error)
        setInternalValue(content)
        if (onChange) {
          onChange(content)
        }
      }
    }
  }

  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'size': fontSizeArr }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote'],
      ['clean']
    ]
  }), [])

  const formats = [
    'bold', 'italic', 'underline',
    'size',
    'list',
    'blockquote'
  ]

  if (!isReady) {
    return (
      <div className="rich-text-editor">
        <div className="border border-gray-300 rounded-lg p-4 min-h-[120px] bg-gray-50 animate-pulse">
          <div className="text-gray-400">লোড হচ্ছে...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={internalValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style>{`
        .rich-text-editor .ql-container {
          min-height: 120px;
          font-size: 14px;
          font-family: inherit;
        }
        .rich-text-editor .ql-editor {
          min-height: 100px;
        }
        .rich-text-editor .ql-toolbar {
          background: #f9fafb;
          border-color: #d1d5db;
          border-radius: 0.75rem 0.75rem 0 0;
        }
        .rich-text-editor .ql-container {
          border-color: #d1d5db;
          border-radius: 0 0 0.75rem 0.75rem;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .rich-text-editor .ql-snow .ql-picker.ql-size .ql-picker-label::before,
        .rich-text-editor .ql-snow .ql-picker.ql-size .ql-picker-item::before {
          content: 'সাধারণ';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before {
          content: 'ছোট';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before {
          content: 'বড়';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before {
          content: 'অতি বড়';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-size {
          width: 80px;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
