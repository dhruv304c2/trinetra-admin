import { useState, useEffect } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/admin'
const PUBLIC_API = API.replace(/\/admin$/, '')

const EMPTY_PLAN = {
  icon: '',
  title: '',
  description: '',
  duration: '',
  level: 'Beginner',
  price: '',
  discountedPrice: '',
  active: true,
}

const EMPTY_COACH = {
  name: '',
  role: '',
  bio: '',
  images: [],
  active: true,
}

const EMPTY_BANNER = {
  url: '',
  mediaType: 'image',
  label: '',
  active: true,
}

const EMPTY_SITE_CONFIG = {
  address: '',
  phones: '',
  primaryPhone: '',
  whatsappNumber: '',
  email: '',
  hours: '',
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [tab, setTab] = useState('bookings')
  const [plans, setPlans] = useState([])
  const [coaches, setCoaches] = useState([])
  const [heroBanners, setHeroBanners] = useState([])
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [expandedMessage, setExpandedMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [planForm, setPlanForm] = useState(EMPTY_PLAN)
  const [coachForm, setCoachForm] = useState(EMPTY_COACH)
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER)
  const [uploading, setUploading] = useState(false)
  const [siteConfig, setSiteConfig] = useState(EMPTY_SITE_CONFIG)
  const [siteConfigLoading, setSiteConfigLoading] = useState(false)
  const [trialBookings, setTrialBookings] = useState([])
  const [contacts, setContacts] = useState([])
  const [trialRules, setTrialRules] = useState(null)
  const [trialRulesLoading, setTrialRulesLoading] = useState(false)
  const [slots, setSlots] = useState([])
  const [newSlotStart, setNewSlotStart] = useState('')
  const [newSlotEnd, setNewSlotEnd] = useState('')
  const [newSlotLabel, setNewSlotLabel] = useState('')
  const [rescheduleBooking, setRescheduleBooking] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState(null)
  const [rescheduleSelected, setRescheduleSelected] = useState(null)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)

  const logout = () => {
    localStorage.removeItem('admin_token')
    setToken('')
  }

  const authFetch = async (url, options = {}) => {
    const headers = { ...options.headers, Authorization: `Bearer ${token}` }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
      logout()
      throw new Error('Session expired, please login again')
    }
    return res
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }
      const { token: t } = await res.json()
      localStorage.setItem('admin_token', t)
      setToken(t)
      setLoginPassword('')
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const fetchPlans = async () => {
    const res = await authFetch(`${API}/plans`)
    if (!res.ok) throw new Error('Failed to fetch plans')
    setPlans(await res.json())
  }

  const fetchCoaches = async () => {
    const res = await authFetch(`${API}/coaches`)
    if (!res.ok) throw new Error('Failed to fetch coaches')
    setCoaches(await res.json())
  }

  const fetchHeroBanners = async () => {
    const res = await authFetch(`${API}/hero-banners`)
    if (!res.ok) throw new Error('Failed to fetch hero banners')
    setHeroBanners(await res.json())
  }

  const fetchMessages = async () => {
    const res = await authFetch(`${API}/messages`)
    if (!res.ok) throw new Error('Failed to fetch messages')
    const data = await res.json()
    setMessages(data)
    setUnreadCount(data.filter((m) => !m.read).length)
  }

  const fetchSiteConfig = async () => {
    const res = await authFetch(`${API}/site-config`)
    if (!res.ok) throw new Error('Failed to fetch site config')
    const data = await res.json()
    if (data && data._id) {
      setSiteConfig({
        address: data.address || '',
        phones: (data.phones || []).join(', '),
        primaryPhone: data.primaryPhone || '',
        whatsappNumber: data.whatsappNumber || '',
        email: data.email || '',
        hours: data.hours || '',
      })
    }
  }

  const fetchTrialBookings = async () => {
    const res = await authFetch(`${API}/trial-bookings`)
    if (!res.ok) throw new Error('Failed to fetch trial bookings')
    setTrialBookings(await res.json())
  }

  const fetchContacts = async () => {
    const res = await authFetch(`${API}/contacts`)
    if (!res.ok) throw new Error('Failed to fetch contacts')
    setContacts(await res.json())
  }

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Delete this contact?')) return
    try {
      const res = await authFetch(`${API}/contacts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setContacts((prev) => prev.filter((c) => c._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchTrialRules = async () => {
    const res = await authFetch(`${API}/trial-rules`)
    if (!res.ok) throw new Error('Failed to fetch trial rules')
    setTrialRules(await res.json())
  }

  const fetchSlots = async () => {
    const res = await authFetch(`${API}/slots`)
    if (!res.ok) throw new Error('Failed to fetch slots')
    setSlots(await res.json())
  }

  const handleTrialRulesSubmit = async (e) => {
    e.preventDefault()
    setTrialRulesLoading(true)
    try {
      const res = await authFetch(`${API}/trial-rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingWindowDays: trialRules.bookingWindowDays,
          blockedWeekdays: trialRules.blockedWeekdays,
          maxBookingsPerSlot: trialRules.maxBookingsPerSlot,
        }),
      })
      if (!res.ok) throw new Error('Failed to save trial rules')
      setTrialRules(await res.json())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setTrialRulesLoading(false)
    }
  }

  const handleToggleSlot = async (slot) => {
    try {
      const res = await authFetch(`${API}/slots/${slot._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !slot.active }),
      })
      if (!res.ok) throw new Error('Failed to update slot')
      setSlots((prev) => prev.map((s) => s._id === slot._id ? { ...s, active: !s.active } : s))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    if (!newSlotStart.trim() || !newSlotEnd.trim()) return
    try {
      const res = await authFetch(`${API}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: newSlotStart.trim(), end: newSlotEnd.trim(), label: newSlotLabel.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add slot')
      const slot = await res.json()
      setSlots((prev) => [...prev, slot])
      setNewSlotStart('')
      setNewSlotEnd('')
      setNewSlotLabel('')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this slot?')) return
    try {
      const res = await authFetch(`${API}/slots/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete slot')
      setSlots((prev) => prev.filter((s) => s._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRescheduleDateChange = async (date) => {
    setRescheduleDate(date)
    setRescheduleSelected(null)
    setRescheduleSlots(null)
    if (!date) return
    try {
      const res = await fetch(`${PUBLIC_API}/trial-slots?date=${date}`)
      if (!res.ok) throw new Error('Failed to load slots')
      setRescheduleSlots(await res.json())
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRescheduleSubmit = async () => {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleSelected) return
    setRescheduleLoading(true)
    const morningSlots = rescheduleSlots?.morning?.map((s) => s.time) || []
    const batch = morningSlots.includes(rescheduleSelected) ? 'morning' : 'evening'
    try {
      const res = await authFetch(`${API}/trial-bookings/${rescheduleBooking._id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: rescheduleDate, slot: rescheduleSelected, batch }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Reschedule failed')
      }
      setRescheduleBooking(null)
      setRescheduleDate('')
      setRescheduleSlots(null)
      setRescheduleSelected(null)
      fetchTrialBookings()
    } catch (err) {
      setError(err.message)
    } finally {
      setRescheduleLoading(false)
    }
  }

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Delete this booking? The slot will become available again.')) return
    try {
      const res = await authFetch(`${API}/trial-bookings/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchTrialBookings()
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchAll = async () => {
    try {
      await Promise.all([fetchPlans(), fetchCoaches(), fetchHeroBanners(), fetchMessages(), fetchSiteConfig(), fetchTrialBookings(), fetchTrialRules(), fetchContacts(), fetchSlots()])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchAll()
  }, [token])

  const openCreate = () => {
    setEditing(null)
    setPlanForm(EMPTY_PLAN)
    setCoachForm(EMPTY_COACH)
    setBannerForm(EMPTY_BANNER)
    setShowModal(true)
  }

  const openEditPlan = (plan) => {
    setEditing(plan._id)
    setPlanForm({
      icon: plan.icon || '',
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      level: plan.level,
      price: plan.price || '',
      discountedPrice: plan.discountedPrice || '',
      active: plan.active,
    })
    setShowModal('plan')
  }

  const openEditCoach = (coach) => {
    setEditing(coach._id)
    setCoachForm({
      name: coach.name,
      role: coach.role,
      bio: coach.bio,
      images: coach.images || [],
      active: coach.active,
    })
    setShowModal('coach')
  }

  const openEditBanner = (banner) => {
    setEditing(banner._id)
    setBannerForm({
      url: banner.url,
      mediaType: banner.mediaType,
      label: banner.label || '',
      active: banner.active,
    })
    setShowModal('banner')
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setPlanForm(EMPTY_PLAN)
    setCoachForm(EMPTY_COACH)
    setBannerForm(EMPTY_BANNER)
  }

  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editing ? `${API}/plans/${editing}` : `${API}/plans`
      const method = editing ? 'PUT' : 'POST'
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Request failed')
      }
      closeModal()
      fetchPlans()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCoachSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editing ? `${API}/coaches/${editing}` : `${API}/coaches`
      const method = editing ? 'PUT' : 'POST'
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coachForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Request failed')
      }
      closeModal()
      fetchCoaches()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBannerSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editing ? `${API}/hero-banners/${editing}` : `${API}/hero-banners`
      const method = editing ? 'PUT' : 'POST'
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Request failed')
      }
      closeModal()
      fetchHeroBanners()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBannerMediaUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('media', file)
      const res = await authFetch(`${API}/upload-media`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url, mediaType } = await res.json()
      setBannerForm((prev) => ({ ...prev, url, mediaType }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const moveBanner = async (index, direction) => {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= heroBanners.length) return
    const reordered = [...heroBanners]
    ;[reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]]
    setHeroBanners(reordered)
    try {
      const res = await authFetch(`${API}/hero-banners-reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((b) => b._id) }),
      })
      if (!res.ok) throw new Error('Reorder failed')
      setHeroBanners(await res.json())
    } catch (err) {
      setError(err.message)
      fetchHeroBanners()
    }
  }

  const handleDelete = async (id, entityType) => {
    if (!window.confirm(`Delete this ${entityType}?`)) return
    try {
      const endpointMap = { plan: 'plans', coach: 'coaches', banner: 'hero-banners' }
      const res = await authFetch(`${API}/${endpointMap[entityType]}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      if (entityType === 'plan') fetchPlans()
      else if (entityType === 'coach') fetchCoaches()
      else if (entityType === 'banner') fetchHeroBanners()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleExpandMessage = async (msg) => {
    if (expandedMessage === msg._id) {
      setExpandedMessage(null)
      return
    }
    setExpandedMessage(msg._id)
    if (!msg.read) {
      try {
        await authFetch(`${API}/messages/${msg._id}/read`, { method: 'PUT' })
        setMessages((prev) => prev.map((m) => m._id === msg._id ? { ...m, read: true } : m))
        setUnreadCount((prev) => prev - 1)
      } catch {}
    }
  }

  const handleDeleteMessage = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this message?')) return
    try {
      const res = await authFetch(`${API}/messages/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      const msg = messages.find((m) => m._id === id)
      if (msg && !msg.read) setUnreadCount((prev) => prev - 1)
      setMessages((prev) => prev.filter((m) => m._id !== id))
      if (expandedMessage === id) setExpandedMessage(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const updatePlanField = (field, value) => {
    setPlanForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateCoachField = (field, value) => {
    setCoachForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateBannerField = (field, value) => {
    setBannerForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e) => {
    const files = e.target.files
    if (!files.length) return
    setUploading(true)
    try {
      const formData = new FormData()
      for (const file of files) formData.append('images', file)
      formData.append('folder', 'coaches')
      const res = await authFetch(`${API}/upload-multiple`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { urls } = await res.json()
      setCoachForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const updateSiteConfigField = (field, value) => {
    setSiteConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSiteConfigSubmit = async (e) => {
    e.preventDefault()
    setSiteConfigLoading(true)
    try {
      const body = {
        ...siteConfig,
        phones: siteConfig.phones.split(',').map((p) => p.trim()).filter(Boolean),
      }
      const res = await authFetch(`${API}/site-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSiteConfigLoading(false)
    }
  }

  const removeImage = (index) => {
    setCoachForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const moveCoach = async (index, direction) => {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= coaches.length) return
    const reordered = [...coaches]
    ;[reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]]
    setCoaches(reordered)
    try {
      const res = await authFetch(`${API}/coaches-reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((c) => c._id) }),
      })
      if (!res.ok) throw new Error('Reorder failed')
      setCoaches(await res.json())
    } catch (err) {
      setError(err.message)
      fetchCoaches()
    }
  }

  if (!token) {
    return (
      <div className="login-screen">
        <form className="login-box" onSubmit={handleLogin}>
          <h1><span>TRINETRA</span> Admin</h1>
          <input
            type="password"
            placeholder="Enter admin password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            autoFocus
            required
          />
          <button type="submit" className="btn-save" disabled={loginLoading}>
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
          {loginError && <p className="login-error">{loginError}</p>}
        </form>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <h1>
          <span>TRINETRA</span> Admin
        </h1>
        <div className="admin-header-actions">
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${tab === 'inbox' ? 'tab-active' : ''}`} onClick={() => setTab('inbox')}>
          Inbox {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
        </button>
        <button className={`tab ${tab === 'bookings' ? 'tab-active' : ''}`} onClick={() => setTab('bookings')}>
          Bookings
        </button>
        <button className={`tab ${tab === 'leads' ? 'tab-active' : ''}`} onClick={() => setTab('leads')}>
          Leads
        </button>
        <button className={`tab ${tab === 'settings' ? 'tab-active' : ''}`} onClick={() => setTab('settings')}>
          Settings
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : tab === 'inbox' ? (
        messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet</p>
            <span>Messages from the contact form will appear here.</span>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`message-row ${!msg.read ? 'message-unread' : ''} ${expandedMessage === msg._id ? 'message-expanded' : ''}`}
                onClick={() => handleExpandMessage(msg)}
              >
                <div className="message-row-header">
                  <div className="message-row-left">
                    {!msg.read && <span className="message-dot" />}
                    <strong>{msg.name}</strong>
                    <span className="message-email">{msg.email}</span>
                    {msg.phone && <span className="message-phone">{msg.phone}</span>}
                  </div>
                  <div className="message-row-right">
                    <span className="message-time">{new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button className="btn-delete" onClick={(e) => handleDeleteMessage(e, msg._id)}>Delete</button>
                  </div>
                </div>
                {expandedMessage !== msg._id && msg.message && (
                  <p className="message-preview">{msg.message}</p>
                )}
                {expandedMessage === msg._id && (
                  <div className="message-body">{msg.message || '(No message)'}</div>
                )}
              </div>
            ))}
          </div>
        )
      ) : tab === 'bookings' ? (
        trialBookings.length === 0 ? (
          <div className="empty-state">
            <p>No trial bookings yet</p>
            <span>Trial class bookings from the website will appear here.</span>
          </div>
        ) : (
          <div className="leads-section">
            <div className="leads-count">{trialBookings.length} booking{trialBookings.length !== 1 ? 's' : ''}</div>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Batch</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trialBookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.date}</td>
                    <td>{b.slot}</td>
                    <td style={{ textTransform: 'capitalize' }}>{b.batch}</td>
                    <td>{b.name}</td>
                    <td>{b.phone ? <a href={`tel:${b.phone}`}>{b.phone}</a> : '--'}</td>
                    <td><a href={`mailto:${b.email}`}>{b.email}</a></td>
                    <td><span style={{ textTransform: 'capitalize', color: b.status === 'confirmed' ? '#22c55e' : '#ef4444' }}>{b.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {b.status === 'confirmed' && (
                          <button
                            className="btn-icon"
                            title="Reschedule"
                            onClick={() => { setRescheduleBooking(b); setRescheduleDate(''); setRescheduleSlots(null); setRescheduleSelected(null) }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </button>
                        )}
                        <button
                          className="btn-icon btn-icon-danger"
                          title="Delete"
                          onClick={() => handleDeleteBooking(b._id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'leads' ? (
        contacts.length === 0 ? (
          <div className="empty-state">
            <p>No leads collected yet</p>
            <span>Contact details from form submissions will appear here.</span>
          </div>
        ) : (
          <div className="leads-section">
            <div className="leads-count">{contacts.length} contact{contacts.length !== 1 ? 's' : ''} collected</div>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td><a href={`mailto:${c.email}`}>{c.email}</a></td>
                    <td>{c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : <span className="leads-empty">--</span>}</td>
                    <td style={{ textTransform: 'capitalize' }}>{c.source}</td>
                    <td className="leads-date">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Delete"
                        onClick={() => handleDeleteContact(c._id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'settings' ? (
        <div className="settings-section" style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

          {/* --- Site Configuration --- */}
          <div className="settings-card">
            <h2 className="settings-card-title">Site Configuration</h2>
            <form onSubmit={handleSiteConfigSubmit}>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={siteConfig.address}
                  onChange={(e) => updateSiteConfigField('address', e.target.value)}
                  placeholder="Full address"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Numbers (comma-separated)</label>
                <input
                  type="text"
                  value={siteConfig.phones}
                  onChange={(e) => updateSiteConfigField('phones', e.target.value)}
                  placeholder="e.g. 8796986635, 9999663511"
                />
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Primary Phone</label>
                  <input
                    type="text"
                    value={siteConfig.primaryPhone}
                    onChange={(e) => updateSiteConfigField('primaryPhone', e.target.value)}
                    placeholder="e.g. 8796986635"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    type="text"
                    value={siteConfig.whatsappNumber}
                    onChange={(e) => updateSiteConfigField('whatsappNumber', e.target.value)}
                    placeholder="e.g. 918796986635"
                    required
                  />
                </div>
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={siteConfig.email}
                    onChange={(e) => updateSiteConfigField('email', e.target.value)}
                    placeholder="contact@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hours</label>
                  <input
                    type="text"
                    value={siteConfig.hours}
                    onChange={(e) => updateSiteConfigField('hours', e.target.value)}
                    placeholder="e.g. Mon-Sat: 6:00 AM - 9:00 PM"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={siteConfigLoading}>
                  {siteConfigLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* --- Batch Slots --- */}
          <div className="settings-card">
            <h2 className="settings-card-title">Batch Slots</h2>
            <p style={{ color: '#888', fontSize: 13, margin: '0 0 16px' }}>Displayed on the website schedule and used for trial bookings. Batch is auto-derived from time (AM = morning, PM = evening).</p>
            {['morning', 'evening'].map((batch) => {
              const batchSlots = slots.filter((s) => s.batch === batch)
              return (
                <div key={batch} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 10 }}>{batch} batch</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {batchSlots.map((slot) => (
                      <div key={slot._id} className="slot-row">
                        <button
                          type="button"
                          className={`slot-toggle ${slot.active ? 'slot-toggle-on' : ''}`}
                          onClick={() => handleToggleSlot(slot)}
                          title={slot.active ? 'Active — click to disable' : 'Inactive — click to enable'}
                        >
                          <span className="slot-toggle-knob" />
                        </button>
                        <div className={`slot-info ${!slot.active ? 'slot-time-off' : ''}`}>
                          <span className="slot-time">{slot.displayLabel || slot.time}</span>
                          {slot.label && <span className="slot-time-sub">{slot.time}</span>}
                        </div>
                        <button
                          className="btn-icon btn-icon-danger"
                          title="Delete slot"
                          onClick={() => handleDeleteSlot(slot._id)}
                          style={{ marginLeft: 'auto' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    ))}
                    {batchSlots.length === 0 && <p style={{ color: '#666', fontSize: 13, margin: 0 }}>No slots configured</p>}
                  </div>
                </div>
              )
            })}
            <form onSubmit={handleAddSlot} className="slot-add-form">
              <input
                type="text"
                value={newSlotStart}
                onChange={(e) => setNewSlotStart(e.target.value)}
                placeholder="Start (e.g. 5:30 AM)"
                style={{ flex: 1 }}
                required
              />
              <input
                type="text"
                value={newSlotEnd}
                onChange={(e) => setNewSlotEnd(e.target.value)}
                placeholder="End (e.g. 7:00 AM)"
                style={{ flex: 1 }}
                required
              />
              <input
                type="text"
                value={newSlotLabel}
                onChange={(e) => setNewSlotLabel(e.target.value)}
                placeholder="Label (optional)"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-save" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
            </form>
          </div>

          {/* --- Trial Booking Rules --- */}
          {trialRules && (
            <div className="settings-card">
              <h2 className="settings-card-title">Trial Booking Rules</h2>
              <form onSubmit={handleTrialRulesSubmit}>
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Booking Window (days)</label>
                    <input
                      type="number"
                      min="1"
                      value={trialRules.bookingWindowDays}
                      onChange={(e) => setTrialRules((r) => ({ ...r, bookingWindowDays: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Bookings Per Slot</label>
                    <input
                      type="number"
                      min="1"
                      value={trialRules.maxBookingsPerSlot}
                      onChange={(e) => setTrialRules((r) => ({ ...r, maxBookingsPerSlot: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Blocked Weekdays</label>
                  <div className="weekday-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                      <button
                        key={day}
                        type="button"
                        className={`weekday-btn ${trialRules.blockedWeekdays.includes(i) ? 'weekday-btn-active' : ''}`}
                        onClick={() => {
                          setTrialRules((r) => ({
                            ...r,
                            blockedWeekdays: r.blockedWeekdays.includes(i)
                              ? r.blockedWeekdays.filter((d) => d !== i)
                              : [...r.blockedWeekdays, i],
                          }))
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={trialRulesLoading}>
                    {trialRulesLoading ? 'Saving...' : 'Save Rules'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- Membership Plans --- */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h2 className="settings-card-title" style={{ margin: 0, padding: 0, border: 'none' }}>Membership Plans</h2>
              <button className="btn-new" onClick={() => { setEditing(null); setPlanForm(EMPTY_PLAN); setShowModal('plan') }}>+ New Plan</button>
            </div>
            {plans.length === 0 ? (
              <p style={{ color: '#666', fontSize: 13 }}>No plans yet. Click "+ New Plan" to create one.</p>
            ) : (
              <div className="program-list" style={{ margin: 0 }}>
                {plans.map((p) => (
                  <div key={p._id} className="program-row">
                    <div className="program-row-icon">{p.icon || '\u{1F94A}'}</div>
                    <div className="program-row-info">
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                    </div>
                    <div className="program-row-meta">
                      {p.discountedPrice && <span className="badge-price">{p.discountedPrice}</span>}
                      {p.price && <span className={p.discountedPrice ? 'badge-original-price' : 'badge-price'}>{p.price}</span>}
                      <span>{p.duration}</span>
                      <span>{p.level}</span>
                      <span className={p.active ? 'badge-active' : 'badge-inactive'}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="program-row-actions">
                      <button className="btn-edit" onClick={() => openEditPlan(p)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(p._id, 'plan')}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- Coaches --- */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h2 className="settings-card-title" style={{ margin: 0, padding: 0, border: 'none' }}>Coaches</h2>
              <button className="btn-new" onClick={() => { setEditing(null); setCoachForm(EMPTY_COACH); setShowModal('coach') }}>+ New Coach</button>
            </div>
            {coaches.length === 0 ? (
              <p style={{ color: '#666', fontSize: 13 }}>No coaches yet. Click "+ New Coach" to add one.</p>
            ) : (
              <div className="program-list" style={{ margin: 0 }}>
                {coaches.map((c, i) => (
                  <div key={c._id} className="program-row">
                    <div className="reorder-buttons">
                      <button className="btn-reorder" disabled={i === 0} onClick={() => moveCoach(i, -1)} title="Move up">&#9650;</button>
                      <button className="btn-reorder" disabled={i === coaches.length - 1} onClick={() => moveCoach(i, 1)} title="Move down">&#9660;</button>
                    </div>
                    <div className="program-row-icon">{'\u{1F464}'}</div>
                    <div className="program-row-info">
                      <h3>{c.name}</h3>
                      <p>{c.bio}</p>
                    </div>
                    <div className="program-row-meta">
                      <span>{c.role}</span>
                      <span className={c.active ? 'badge-active' : 'badge-inactive'}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="program-row-actions">
                      <button className="btn-edit" onClick={() => openEditCoach(c)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(c._id, 'coach')}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- Hero Banners --- */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h2 className="settings-card-title" style={{ margin: 0, padding: 0, border: 'none' }}>Hero Banners</h2>
              <button className="btn-new" onClick={() => { setEditing(null); setBannerForm(EMPTY_BANNER); setShowModal('banner') }}>+ New Banner</button>
            </div>
            {heroBanners.length === 0 ? (
              <p style={{ color: '#666', fontSize: 13 }}>No banners yet. Click "+ New Banner" to add one.</p>
            ) : (
              <div className="program-list" style={{ margin: 0 }}>
                {heroBanners.map((b, i) => (
                  <div key={b._id} className="program-row">
                    <div className="reorder-buttons">
                      <button className="btn-reorder" disabled={i === 0} onClick={() => moveBanner(i, -1)} title="Move up">&#9650;</button>
                      <button className="btn-reorder" disabled={i === heroBanners.length - 1} onClick={() => moveBanner(i, 1)} title="Move down">&#9660;</button>
                    </div>
                    <div className="program-row-icon" style={{ width: 80, height: 60, overflow: 'hidden', borderRadius: 4 }}>
                      {b.mediaType === 'video' ? (
                        <video src={b.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={b.url} alt={b.label || 'Banner'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div className="program-row-info">
                      <h3>{b.label || '(No label)'}</h3>
                    </div>
                    <div className="program-row-meta">
                      <span className="badge-active" style={{ background: b.mediaType === 'video' ? '#6366f1' : '#0ea5e9', color: '#fff' }}>
                        {b.mediaType}
                      </span>
                      <span className={b.active ? 'badge-active' : 'badge-inactive'}>
                        {b.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="program-row-actions">
                      <button className="btn-edit" onClick={() => openEditBanner(b)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(b._id, 'banner')}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Plan Modal */}
      {showModal === 'plan' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Plan' : 'New Membership Plan'}</h2>
            <form onSubmit={handlePlanSubmit}>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Icon (emoji)</label>
                  <input
                    type="text"
                    value={planForm.icon}
                    onChange={(e) => updatePlanField('icon', e.target.value)}
                    placeholder="e.g. \u{1F94A}"
                  />
                </div>
                <div className="form-group">
                  <label>Level</label>
                  <select
                    value={planForm.level}
                    onChange={(e) => updatePlanField('level', e.target.value)}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>All Levels</option>
                    <option>Youth</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={planForm.title}
                  onChange={(e) => updatePlanField('title', e.target.value)}
                  placeholder="Plan title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => updatePlanField('description', e.target.value)}
                  placeholder="Describe the plan..."
                  required
                />
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={planForm.duration}
                    onChange={(e) => updatePlanField('duration', e.target.value)}
                    placeholder="e.g. 1 Month"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price (Original)</label>
                  <input
                    type="text"
                    value={planForm.price}
                    onChange={(e) => updatePlanField('price', e.target.value)}
                    placeholder="e.g. 3,500/-"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Discounted Price (leave empty if no discount)</label>
                <input
                  type="text"
                  value={planForm.discountedPrice}
                  onChange={(e) => updatePlanField('discountedPrice', e.target.value)}
                  placeholder="e.g. 3,000/-"
                />
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  id="active"
                  checked={planForm.active}
                  onChange={(e) => updatePlanField('active', e.target.checked)}
                />
                <label htmlFor="active">Active (visible on website)</label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {showModal === 'banner' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Banner' : 'New Hero Banner'}</h2>
            <form onSubmit={handleBannerSubmit}>
              <div className="form-group">
                <label>Media File</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleBannerMediaUpload}
                  disabled={uploading}
                />
                {uploading && <p className="upload-status">Uploading...</p>}
                {bannerForm.url && (
                  <div className="image-preview-grid" style={{ marginTop: 12 }}>
                    <div className="image-preview" style={{ width: '100%', maxWidth: 400 }}>
                      {bannerForm.mediaType === 'video' ? (
                        <video src={bannerForm.url} autoPlay muted loop style={{ width: '100%', borderRadius: 4 }} />
                      ) : (
                        <img src={bannerForm.url} alt="Preview" style={{ width: '100%', borderRadius: 4 }} />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Label (optional, admin-only)</label>
                <input
                  type="text"
                  value={bannerForm.label}
                  onChange={(e) => updateBannerField('label', e.target.value)}
                  placeholder="e.g. Boxing ring shot"
                />
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  id="banner-active"
                  checked={bannerForm.active}
                  onChange={(e) => updateBannerField('active', e.target.checked)}
                />
                <label htmlFor="banner-active">Active (visible on website)</label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save" disabled={!bannerForm.url}>{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coach Modal */}
      {showModal === 'coach' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Coach' : 'New Coach'}</h2>
            <form onSubmit={handleCoachSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={coachForm.name}
                  onChange={(e) => updateCoachField('name', e.target.value)}
                  placeholder="Coach name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={coachForm.role}
                  onChange={(e) => updateCoachField('role', e.target.value)}
                  placeholder="e.g. Head Coach"
                  required
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={coachForm.bio}
                  onChange={(e) => updateCoachField('bio', e.target.value)}
                  placeholder="Short bio..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <p className="upload-status">Uploading...</p>}
                {coachForm.images.length > 0 && (
                  <div className="image-preview-grid">
                    {coachForm.images.map((url, i) => (
                      <div key={i} className="image-preview">
                        <img src={url} alt={`Coach ${i + 1}`} />
                        <button type="button" className="btn-remove-img" onClick={() => removeImage(i)}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  id="coach-active"
                  checked={coachForm.active}
                  onChange={(e) => updateCoachField('active', e.target.checked)}
                />
                <label htmlFor="coach-active">Active (visible on website)</label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="modal-overlay" onClick={() => setRescheduleBooking(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reschedule Booking</h2>
            <p style={{ marginBottom: 16, color: '#999' }}>
              Current: <strong style={{ color: '#f5f5f5' }}>{rescheduleBooking.date}</strong> at <strong style={{ color: '#f5f5f5' }}>{rescheduleBooking.slot}</strong> ({rescheduleBooking.name})
            </p>
            <div className="form-group">
              <label>New Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => handleRescheduleDateChange(e.target.value)}
              />
            </div>
            {rescheduleSlots && (
              <div className="form-group">
                <label>Available Slots</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...rescheduleSlots.morning, ...rescheduleSlots.evening].map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setRescheduleSelected(s.time)}
                      style={{
                        padding: '8px 12px',
                        background: rescheduleSelected === s.time ? '#d4af37' : s.available ? '#1a1a1a' : '#111',
                        color: rescheduleSelected === s.time ? '#000' : s.available ? '#f5f5f5' : '#555',
                        border: `1px solid ${rescheduleSelected === s.time ? '#d4af37' : '#333'}`,
                        cursor: s.available ? 'pointer' : 'not-allowed',
                        textAlign: 'left',
                      }}
                    >
                      {s.time} {!s.available && '(Full)'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setRescheduleBooking(null)}>Cancel</button>
              <button
                type="button"
                className="btn-save"
                disabled={!rescheduleDate || !rescheduleSelected || rescheduleLoading}
                onClick={handleRescheduleSubmit}
              >
                {rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
