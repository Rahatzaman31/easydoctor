import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminSerialPrintDetail() {
  const navigate = useNavigate()
  const { doctorName } = useParams()
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date') || (() => {
    const t = new Date(); t.setDate(t.getDate() + 1); return t.toISOString().split('T')[0]
  })()

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const printRef = useRef()

  const decodedDoctorName = decodeURIComponent(doctorName)

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) { navigate('/admin/login'); return }
    fetchAppointments()
  }, [doctorName, dateParam])

  async function fetchAppointments() {
    setLoading(true)
    try {
      if (!supabase || !isConfigured) { setLoading(false); return }
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_name', decodedDoctorName)
        .eq('appointment_date', dateParam)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true })
      if (error) throw error
      setRows((data || []).map((apt, i) => ({
        ...apt,
        _serial: i + 1,
        patient_address: apt.patient_address || apt.address || '',
        referral: apt.referral || '',
        serial_no: apt.booking_ref || apt.serial_no || `${i + 1}`,
      })))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(row) {
    setEditingId(row.id)
    setEditData({
      patient_name: row.patient_name || '',
      patient_phone: row.patient_phone || '',
      patient_address: row.patient_address || '',
      appointment_date: row.appointment_date || dateParam,
      serial_no: row.serial_no || '',
      referral: row.referral || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditData({})
  }

  async function saveEdit(id) {
    setSaving(true)
    try {
      if (!supabase || !isConfigured) { alert('ডাটাবেস সংযোগ নেই'); return }
      const updatePayload = {
        patient_name: editData.patient_name,
        patient_phone: editData.patient_phone,
        appointment_date: editData.appointment_date,
      }
      if ('patient_address' in (rows.find(r => r.id === id) || {})) {
        updatePayload.patient_address = editData.patient_address
      }
      if ('referral' in (rows.find(r => r.id === id) || {})) {
        updatePayload.referral = editData.referral
      }
      const { error } = await supabase.from('appointments').update(updatePayload).eq('id', id)
      if (error) {
        const safePayload = { patient_name: editData.patient_name, patient_phone: editData.patient_phone, appointment_date: editData.appointment_date }
        const { error: e2 } = await supabase.from('appointments').update(safePayload).eq('id', id)
        if (e2) throw e2
      }
      setRows(prev => prev.map(r => r.id === id ? {
        ...r,
        patient_name: editData.patient_name,
        patient_phone: editData.patient_phone,
        patient_address: editData.patient_address,
        appointment_date: editData.appointment_date,
        serial_no: editData.serial_no,
        referral: editData.referral,
      } : r))
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert('সেভ করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  const formatDateBengali = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const todayFormatted = formatDateBengali(new Date().toISOString().split('T')[0])
  const apptDateFormatted = formatDateBengali(dateParam)

  return (
    <>
      <style>{`
        @media screen {
          #print-area { display: none; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #print-area { display: block !important; visibility: visible !important; position: fixed !important; left: 0 !important; top: 0 !important; width: 210mm !important; min-height: 297mm !important; background: white !important; padding: 15mm !important; box-sizing: border-box !important; }
          #print-area * { visibility: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex min-h-screen bg-gray-100">
        <div className="no-print">
          <AdminSidebar />
        </div>

        <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-8">
          <div className="no-print flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(`/admin/serial-print?date=${dateParam}`)}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-800 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ফিরে যান
            </button>
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">{decodedDoctorName}</h1>
              <p className="text-gray-500 text-sm">{apptDateFormatted} — {rows.length}টি অ্যাপয়েন্টমেন্ট</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              প্রিন্ট করুন
            </button>
          </div>

          {loading ? (
            <div className="no-print text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="no-print bg-white rounded-xl shadow-md overflow-hidden mb-8">
                {rows.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">কোনো অ্যাপয়েন্টমেন্ট নেই</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-gray-600 text-left">
                          <th className="px-4 py-3 font-semibold">ক্রমিক</th>
                          <th className="px-4 py-3 font-semibold">রোগীর নাম</th>
                          <th className="px-4 py-3 font-semibold">মোবাইল নং</th>
                          <th className="px-4 py-3 font-semibold">ঠিকানা</th>
                          <th className="px-4 py-3 font-semibold">তারিখ</th>
                          <th className="px-4 py-3 font-semibold">সিরিয়াল নং</th>
                          <th className="px-4 py-3 font-semibold">রেফার</th>
                          <th className="px-4 py-3 font-semibold">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={row.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-700">{i + 1}</td>
                            {editingId === row.id ? (
                              <>
                                <td className="px-4 py-2">
                                  <input className="border rounded px-2 py-1 w-full text-sm" value={editData.patient_name} onChange={e => setEditData(p => ({...p, patient_name: e.target.value}))} />
                                </td>
                                <td className="px-4 py-2">
                                  <input className="border rounded px-2 py-1 w-full text-sm" value={editData.patient_phone} onChange={e => setEditData(p => ({...p, patient_phone: e.target.value}))} />
                                </td>
                                <td className="px-4 py-2">
                                  <input className="border rounded px-2 py-1 w-full text-sm" value={editData.patient_address} onChange={e => setEditData(p => ({...p, patient_address: e.target.value}))} placeholder="ঠিকানা" />
                                </td>
                                <td className="px-4 py-2">
                                  <input type="date" className="border rounded px-2 py-1 text-sm" value={editData.appointment_date} onChange={e => setEditData(p => ({...p, appointment_date: e.target.value}))} />
                                </td>
                                <td className="px-4 py-2">
                                  <input className="border rounded px-2 py-1 w-20 text-sm" value={editData.serial_no} onChange={e => setEditData(p => ({...p, serial_no: e.target.value}))} />
                                </td>
                                <td className="px-4 py-2">
                                  <input className="border rounded px-2 py-1 w-full text-sm" value={editData.referral} onChange={e => setEditData(p => ({...p, referral: e.target.value}))} placeholder="রেফার" />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex gap-2">
                                    <button onClick={() => saveEdit(row.id)} disabled={saving} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                                      {saving ? '...' : 'সেভ'}
                                    </button>
                                    <button onClick={cancelEdit} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-300">
                                      বাতিল
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 font-medium text-gray-800">{row.patient_name}</td>
                                <td className="px-4 py-3 text-gray-600">{row.patient_phone}</td>
                                <td className="px-4 py-3 text-gray-500">{row.patient_address || <span className="text-gray-300 italic text-xs">—</span>}</td>
                                <td className="px-4 py-3 text-gray-600">{row.appointment_date}</td>
                                <td className="px-4 py-3 text-gray-600 font-mono">{row.serial_no}</td>
                                <td className="px-4 py-3 text-gray-500">{row.referral || <span className="text-gray-300 italic text-xs">—</span>}</td>
                                <td className="px-4 py-3">
                                  <button onClick={() => startEdit(row)} className="text-primary-600 hover:text-primary-800 text-sm font-medium hover:underline">
                                    এডিট
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div id="print-area">
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '15mm', width: '210mm', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '8mm', borderBottom: '2px solid #333', paddingBottom: '4mm' }}>
            <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1a56db' }}>Easy Doctor Rangpur</div>
            <div style={{ fontSize: '11pt', color: '#444', marginTop: '2mm' }}>ইজি ডক্টর রংপুর — অ্যাপয়েন্টমেন্ট তালিকা</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6mm', fontSize: '10pt' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{decodedDoctorName}</div>
              <div style={{ color: '#555', marginTop: '1mm' }}>তারিখ: {apptDateFormatted}</div>
            </div>
            <div style={{ textAlign: 'right', color: '#555' }}>
              <div>মোট রোগী: {rows.length} জন</div>
              <div>মুদ্রণের তারিখ: {todayFormatted}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '10mm' }}>
            <thead>
              <tr style={{ background: '#f0f4ff' }}>
                <th style={{ border: '1px solid #333', padding: '5pt 6pt', textAlign: 'center', width: '8%' }}>ক্রমিক</th>
                <th style={{ border: '1px solid #333', padding: '5pt 6pt', textAlign: 'left', width: '22%' }}>রোগীর নাম</th>
                <th style={{ border: '1px solid #333', padding: '5pt 6pt', textAlign: 'left', width: '15%' }}>মোবাইল নং</th>
                <th style={{ border: '1px solid #333', padding: '5pt 6pt', textAlign: 'left', width: '20%' }}>ঠিকানা</th>
                <th style={{ border: '1px solid #333', padding: '5pt 6pt', textAlign: 'center', width: '12%' }}>তারিখ</th>
                <th style={{ border: '1px solid #333', padding: '5pt 6pt', textAlign: 'center', width: '12%' }}>সিরিয়াল নং</th>
                <th style={{ border: '1px solid #333', padding: '5pt 6pt', textAlign: 'left', width: '11%' }}>রেফার</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #aaa', padding: '5pt 6pt', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #aaa', padding: '5pt 6pt' }}>{row.patient_name}</td>
                  <td style={{ border: '1px solid #aaa', padding: '5pt 6pt' }}>{row.patient_phone}</td>
                  <td style={{ border: '1px solid #aaa', padding: '5pt 6pt' }}>{row.patient_address || ''}</td>
                  <td style={{ border: '1px solid #aaa', padding: '5pt 6pt', textAlign: 'center' }}>{row.appointment_date}</td>
                  <td style={{ border: '1px solid #aaa', padding: '5pt 6pt', textAlign: 'center' }}>{row.serial_no}</td>
                  <td style={{ border: '1px solid #aaa', padding: '5pt 6pt' }}>{row.referral || ''}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 5 - rows.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ border: '1px solid #aaa', padding: '5pt 6pt', textAlign: 'center' }}>{rows.length + i + 1}</td>
                  <td style={{ border: '1px solid #aaa', padding: '12pt 6pt' }}></td>
                  <td style={{ border: '1px solid #aaa', padding: '12pt 6pt' }}></td>
                  <td style={{ border: '1px solid #aaa', padding: '12pt 6pt' }}></td>
                  <td style={{ border: '1px solid #aaa', padding: '12pt 6pt' }}></td>
                  <td style={{ border: '1px solid #aaa', padding: '12pt 6pt' }}></td>
                  <td style={{ border: '1px solid #aaa', padding: '12pt 6pt' }}></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '15mm', display: 'flex', justifyContent: 'space-between', fontSize: '10pt' }}>
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ borderTop: '1px solid #333', paddingTop: '4pt', marginTop: '20mm' }}>
                <div style={{ fontWeight: 'bold' }}>ডাক্তারের স্বাক্ষর</div>
                <div style={{ color: '#555', fontSize: '9pt', marginTop: '2pt' }}>{decodedDoctorName}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ borderTop: '1px solid #333', paddingTop: '4pt', marginTop: '20mm' }}>
                <div style={{ fontWeight: 'bold' }}>EDR-এর পক্ষে স্বাক্ষর</div>
                <div style={{ color: '#555', fontSize: '9pt', marginTop: '2pt' }}>Easy Doctor Rangpur</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10mm', textAlign: 'center', fontSize: '8pt', color: '#888', borderTop: '1px solid #ddd', paddingTop: '4mm' }}>
            Easy Doctor Rangpur | ইজি ডক্টর রংপুর | মুদ্রিত: {todayFormatted}
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminSerialPrintDetail
