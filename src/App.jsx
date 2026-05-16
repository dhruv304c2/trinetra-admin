import { useState, useEffect } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/admin'

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

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [tab, setTab] = useState('plans')
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

  const fetchAll = async () => {
    try {
      await Promise.all([fetchPlans(), fetchCoaches(), fetchHeroBanners(), fetchMessages()])
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
    setShowModal(true)
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
    setShowModal(true)
  }

  const openEditBanner = (banner) => {
    setEditing(banner._id)
    setBannerForm({
      url: banner.url,
      mediaType: banner.mediaType,
      label: banner.label || '',
      active: banner.active,
    })
    setShowModal(true)
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

  const handleDelete = async (id) => {
    const entityMap = { plans: 'plan', coaches: 'coach', heroBanners: 'banner' }
    const entity = entityMap[tab] || tab
    if (!window.confirm(`Delete this ${entity}?`)) return
    try {
      const endpoint = tab === 'heroBanners' ? 'hero-banners' : tab
      const res = await authFetch(`${API}/${endpoint}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      if (tab === 'plans') fetchPlans()
      else if (tab === 'coaches') fetchCoaches()
      else if (tab === 'heroBanners') fetchHeroBanners()
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
          {tab !== 'inbox' && tab !== 'leads' && (
            <button className="btn-new" onClick={openCreate}>
              + New {tab === 'plans' ? 'Plan' : tab === 'coaches' ? 'Coach' : 'Banner'}
            </button>
          )}
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${tab === 'plans' ? 'tab-active' : ''}`} onClick={() => setTab('plans')}>
          Membership Plans
        </button>
        <button className={`tab ${tab === 'coaches' ? 'tab-active' : ''}`} onClick={() => setTab('coaches')}>
          Coaches
        </button>
        <button className={`tab ${tab === 'heroBanners' ? 'tab-active' : ''}`} onClick={() => setTab('heroBanners')}>
          Hero Banners
        </button>
        <button className={`tab ${tab === 'inbox' ? 'tab-active' : ''}`} onClick={() => setTab('inbox')}>
          Inbox {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
        </button>
        <button className={`tab ${tab === 'leads' ? 'tab-active' : ''}`} onClick={() => setTab('leads')}>
          Leads
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
      ) : tab === 'leads' ? (
        messages.length === 0 ? (
          <div className="empty-state">
            <p>No leads collected yet</p>
            <span>Contact details from form submissions will appear here.</span>
          </div>
        ) : (
          <div className="leads-section">
            <div className="leads-count">{messages.length} contact{messages.length !== 1 ? 's' : ''} collected</div>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg._id}>
                    <td>{msg.name}</td>
                    <td><a href={`mailto:${msg.email}`}>{msg.email}</a></td>
                    <td>{msg.phone ? <a href={`tel:${msg.phone}`}>{msg.phone}</a> : <span className="leads-empty">--</span>}</td>
                    <td className="leads-date">{new Date(msg.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'plans' ? (
        plans.length === 0 ? (
          <div className="empty-state">
            <p>No membership plans yet</p>
            <span>Click "+ New Plan" to create your first one.</span>
          </div>
        ) : (
          <div className="program-list">
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
                  <button className="btn-delete" onClick={() => handleDelete(p._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'coaches' ? (
        coaches.length === 0 ? (
          <div className="empty-state">
            <p>No coaches yet</p>
            <span>Click "+ New Coach" to add your first one.</span>
          </div>
        ) : (
          <div className="program-list">
            {coaches.map((c, i) => (
              <div key={c._id} className="program-row">
                <div className="reorder-buttons">
                  <button
                    className="btn-reorder"
                    disabled={i === 0}
                    onClick={() => moveCoach(i, -1)}
                    title="Move up"
                  >&#9650;</button>
                  <button
                    className="btn-reorder"
                    disabled={i === coaches.length - 1}
                    onClick={() => moveCoach(i, 1)}
                    title="Move down"
                  >&#9660;</button>
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
                  <button className="btn-delete" onClick={() => handleDelete(c._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        heroBanners.length === 0 ? (
          <div className="empty-state">
            <p>No hero banners yet</p>
            <span>Click "+ New Banner" to add your first one.</span>
          </div>
        ) : (
          <div className="program-list">
            {heroBanners.map((b, i) => (
              <div key={b._id} className="program-row">
                <div className="reorder-buttons">
                  <button
                    className="btn-reorder"
                    disabled={i === 0}
                    onClick={() => moveBanner(i, -1)}
                    title="Move up"
                  >&#9650;</button>
                  <button
                    className="btn-reorder"
                    disabled={i === heroBanners.length - 1}
                    onClick={() => moveBanner(i, 1)}
                    title="Move down"
                  >&#9660;</button>
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
                  <button className="btn-delete" onClick={() => handleDelete(b._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Plan Modal */}
      {showModal && tab === 'plans' && (
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
      {showModal && tab === 'heroBanners' && (
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
      {showModal && tab === 'coaches' && (
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
    </div>
  )
}

export default App
