import { Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react'
import api from '../lib/api'

interface Computer {
  id: string
  name: string
  ip: string
  editKey: string
  viewKey: string
  vncAdminKey: string
  createdAt: string
  updatedAt: string
}

export default function Computers() {
  const [computers, setComputers] = useState<Computer[]>([])
  const [name, setName] = useState('')
  const [ip, setIp] = useState('')
  const [editKey, setEditKey] = useState('')
  const [viewKey, setViewKey] = useState('')
  const [vncAdminKey, setVncAdminKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectionById, setSelectionById] = useState<Record<string, 'view' | 'edit' | 'admin'>>({})
  const [viewerById, setViewerById] = useState<Record<string, 'view' | 'edit' | 'admin'>>({})
  const [fullscreenById, setFullscreenById] = useState<Record<string, boolean>>({})
  const viewerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const load = async () => {
    try {
      const { data } = await api.get<Computer[]>('/computers')
      setComputers(data)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Falha ao carregar computadores')
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setError(null)
    setLoading(true)
    try {
      await api.post('/computers', { name, ip, editKey, viewKey, vncAdminKey })
      setName(''); setIp(''); setEditKey(''); setViewKey(''); setVncAdminKey('')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Falha ao criar computador')
    } finally {
      setLoading(false)
    }
  }

  const VNC_ENABLED = true // VNC sempre habilitado

  const LazyVncViewer = useMemo(() => {
    return VNC_ENABLED ? lazy(() => import('../components/VncViewer')) : null
  }, [VNC_ENABLED])

  const VNC_WS_BASE = '/ws/vnc' // Usa proxy do Vite

  const credentialsForType = (computer: Computer, type: 'view' | 'edit' | 'admin') => {
    if (type === 'admin' && computer.vncAdminKey) return { password: computer.vncAdminKey }
    if (type === 'edit' && computer.editKey) return { password: computer.editKey }
    if (type === 'view' && computer.viewKey) return { password: computer.viewKey }
    return undefined
  }

  const buildVncWsUrl = (computer: Computer, type: 'view' | 'edit' | 'admin') => {
    const params = new URLSearchParams()
    params.set('ip', computer.ip)
    params.set('port', '5900')
    params.set('type', type)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) params.set('token', token)
    return `${VNC_WS_BASE}?${params.toString()}`
  }

  const showViewer = (computerId: string, type: 'view' | 'edit' | 'admin') => {
    setViewerById(prev => ({ ...prev, [computerId]: type }))
  }

  const hideViewer = (computerId: string) => {
    setViewerById(prev => {
      const next = { ...prev }
      delete next[computerId]
      return next
    })
    setFullscreenById(prev => {
      const next = { ...prev }
      delete next[computerId]
      return next
    })
  }

  const toggleFullscreen = (computerId: string) => {
    setFullscreenById(prev => {
      const isFullscreen = !prev[computerId]
      const viewerElement = document.getElementById(`vnc-viewer-${computerId}`)
      if (viewerElement) {
        if (isFullscreen) {
          viewerElement.requestFullscreen().catch(err => console.error('Fullscreen error:', err))
        } else {
          document.exitFullscreen().catch(err => console.error('Exit fullscreen error:', err))
        }
      }
      return { ...prev, [computerId]: isFullscreen }
    })
  }

  const openAll = (type: 'view' | 'edit' | 'admin') => {
    const next: Record<string, 'view' | 'edit' | 'admin'> = {}
    computers.forEach(c => { next[c.id] = type })
    setViewerById(next)
  }

  // Handle dynamic resizing
  useEffect(() => {
    const handleResize = () => {
      Object.keys(viewerById).forEach(id => {
        const viewerElement = viewerRefs.current[id]
        if (viewerElement) {
          const canvas = viewerElement.querySelector('canvas')
          if (canvas) {
            const containerWidth = viewerElement.clientWidth
            const containerHeight = fullscreenById[id] ? window.innerHeight - 50 : 300 // Adjust for header
            const remoteWidth = canvas.getAttribute('data-remote-width') || 800 // Fallback
            const remoteHeight = canvas.getAttribute('data-remote-height') || 600 // Fallback
            const aspectRatio = Number(remoteWidth) / Number(remoteHeight)
            const containerAspectRatio = containerWidth / containerHeight

            if (aspectRatio > containerAspectRatio) {
              canvas.style.width = '100%'
              canvas.style.height = `${containerWidth / aspectRatio}px`
            } else {
              canvas.style.height = `${containerHeight}px`
              canvas.style.width = `${containerHeight * aspectRatio}px`
            }
            canvas.style.maxWidth = '100%'
            canvas.style.maxHeight = '100%'
            canvas.style.objectFit = 'contain'
          }
        }
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial resize
    return () => window.removeEventListener('resize', handleResize)
  }, [viewerById, fullscreenById])

  return (
    <div>
      <div className="card">
        <h2>Computadores</h2>
        {error && <div style={{ color: '#ef4444' }}>{error}</div>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
          <span style={{ alignSelf: 'center' }}>Abrir todos:</span>
          <button className="btn secondary" onClick={() => openAll('view')}>View</button>
          <button className="btn secondary" onClick={() => openAll('edit')}>Edit</button>
          <button className="btn secondary" onClick={() => openAll('admin')}>Admin</button>
        </div>
        <ul className="list">
          {computers.map(c => (
            <li key={c.id} className="row" style={{ justifyContent: 'space-between' }}>
              <div className="spaced">
                <strong>{c.name}</strong>
                <span style={{ opacity: 0.7 }}>{c.ip}</span>
              </div>
              <div className="spaced">
                <select
                  className="input"
                  value={selectionById[c.id] || 'view'}
                  onChange={e => setSelectionById(prev => ({ ...prev, [c.id]: e.target.value as 'view' | 'edit' | 'admin' }))}
                >
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                  <option value="admin">Admin</option>
                </select>
                {viewerById[c.id] ? (
                  <button className="btn secondary" onClick={() => hideViewer(c.id)}>Ocultar</button>
                ) : (
                  <button className="btn secondary" onClick={() => showViewer(c.id, (selectionById[c.id] || 'view'))}>Exibir</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {VNC_ENABLED && LazyVncViewer && Object.keys(viewerById).length > 0 && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Visores VNC ({Object.keys(viewerById).length})</h3>
            <button
              className="btn secondary"
              onClick={() => setViewerById({})}
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              Fechar Todos
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 16,
            alignItems: 'start'
          }}>
            {computers.filter(c => viewerById[c.id]).map(c => {
              const type = viewerById[c.id]
              const url = buildVncWsUrl(c, type)
              const credentials = credentialsForType(c, type)
              const isFullscreen = !!fullscreenById[c.id]
              return (
                <div
                  key={`viewer-${c.id}`}
                  id={`vnc-viewer-${c.id}`}
                  ref={el => (viewerRefs.current[c.id] = el)}
                  style={{
                    background: '#f8f9fa',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid #e9ecef',
                    overflow: 'hidden', // Prevent scrollbars
                    ...(isFullscreen && {
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100vw',
                      height: '100vh',
                      zIndex: 1000,
                      background: '#000',
                      padding: 0,
                      border: 'none'
                    })
                  }}
                >
                  <div className="row" style={{
                    justifyContent: 'space-between',
                    marginBottom: isFullscreen ? 0 : 16,
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#fff',
                    borderRadius: isFullscreen ? 0 : 8,
                    border: isFullscreen ? 'none' : '1px solid #dee2e6'
                  }}>
                    <div className="spaced">
                      <strong style={{ color: '#495057' }}>{c.name}</strong>
                      <span style={{
                        padding: '4px 8px',
                        background: type === 'admin' ? '#dc3545' : type === 'edit' ? '#ffc107' : '#28a745',
                        color: 'white',
                        borderRadius: 4,
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {type.toUpperCase()}
                      </span>
                    </div>
                    <div className="spaced">
                      <button
                        className="btn secondary"
                        onClick={() => toggleFullscreen(c.id)}
                        style={{ fontSize: '14px', padding: '6px 12px', marginRight: 8 }}
                      >
                        {isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => hideViewer(c.id)}
                        style={{ fontSize: '14px', padding: '6px 12px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <Suspense fallback={
                    <div style={{
                      height: isFullscreen ? '100%' : 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8f9fa',
                      borderRadius: isFullscreen ? 0 : 8,
                      border: isFullscreen ? 'none' : '2px dashed #dee2e6'
                    }}>
                      <div style={{ color: '#6c757d' }}>Carregando visualizador...</div>
                    </div>
                  }>
                    {LazyVncViewer && (
                      <LazyVncViewer
                        url={url}
                        credentials={credentials}
                        viewOnly={type === 'view'}
                        scaleViewport={true} // Ensure scaling
                        resizeSession={true} // Allow server-side resizing
                        clipViewport={false} // Prevent clipping
                        style={{
                          height: isFullscreen ? '100%' : 300,
                          width: '100%',
                          borderRadius: isFullscreen ? 0 : 8,
                          overflow: 'hidden',
                          display: 'block',
                          objectFit: 'contain' // Fallback for canvas
                        }}
                        onConnect={() => console.log(`Connected to VNC for ${c.name}`)}
                        onDisconnect={(reason) => console.log(`Disconnected from VNC for ${c.name}: ${reason || 'No reason'}`)}
                      />
                    )}
                  </Suspense>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!VNC_ENABLED && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ opacity: 0.8 }}>
            Visualizador VNC desabilitado. Defina <code>VITE_VNC_ENABLED=true</code> no ambiente para ativar.
          </div>
        </div>
      )}

      <div className="card">
        <h3>Novo computador</h3>
        <div className="row">
          <input className="input" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
          <input className="input" placeholder="IP" value={ip} onChange={e => setIp(e.target.value)} />
        </div>
        <div className="row">
          <input className="input" placeholder="Edit Key" value={editKey} onChange={e => setEditKey(e.target.value)} />
          <input className="input" placeholder="View Key" value={viewKey} onChange={e => setViewKey(e.target.value)} />
          <input className="input" placeholder="VNC Admin Key" value={vncAdminKey} onChange={e => setVncAdminKey(e.target.value)} />
        </div>
        <div className="row">
          <button className="btn" disabled={loading} onClick={create}>{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}