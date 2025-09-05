import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface VncViewerProps {
  url: string
  viewOnly?: boolean
  credentials?: { username?: string; password?: string }
  className?: string
  style?: CSSProperties
  scaleViewport?: boolean
  resizeSession?: boolean
  clipViewport?: boolean
  onConnect?: () => void
  onDisconnect?: (reason?: string) => void
}

export default function VncViewer({
  url,
  viewOnly = false,
  credentials,
  className,
  style,
  scaleViewport = true,
  resizeSession = true,
  clipViewport = false,
  onConnect,
  onDisconnect,
}: VncViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const rfbRef = useRef<any>(null)

  const handleCredentials = useCallback((rfb: any) => {
    if (!credentials) return
    try {
      if (typeof rfb?.sendCredentials === 'function') {
        rfb.sendCredentials(credentials)
      }
    } catch { }
  }, [credentials])

  useEffect(() => {
    if (!containerRef.current) return

    console.log('VncViewer: Iniciando conexão para:', url)
    containerRef.current.style.backgroundColor = '#111'

    import('novnc-core').then((novnc) => {
      try {
        const RFB = novnc.default || novnc.RFB || novnc
        console.log('RFB encontrado:', RFB)

        const rfb = new RFB(containerRef.current!, url, {
          credentials,
          viewOnly,
          scaleViewport,
          resizeSession,
          clipViewport,
          showDotCursor: false,
        })

        rfbRef.current = rfb

        rfb.addEventListener('connect', () => {
          setConnected(true)
          setError(null)
          onConnect?.()

          // Store remote desktop resolution
          const canvas = containerRef.current?.querySelector('canvas')
          if (canvas && rfb._rfb_connection) {
            canvas.setAttribute('data-remote-width', rfb._rfb_connection._fb_width)
            canvas.setAttribute('data-remote-height', rfb._rfb_connection._fb_height)
          }
        })

        rfb.addEventListener('disconnect', (e: any) => {
          setConnected(false)
          const reason = e?.detail?.clean ? undefined : (e?.detail?.reason || 'Conexão encerrada')
          setError(reason || null)
          onDisconnect?.(reason)
        })

        rfb.addEventListener('credentialsrequired', () => {
          handleCredentials(rfb)
        })

        return () => {
          try {
            rfb.disconnect()
          } catch { }
        }
      } catch (err: any) {
        setError(err?.message || 'Falha ao conectar VNC')
      }
    }).catch(err => {
      setError('Falha ao carregar cliente VNC: ' + err.message)
    })

    return () => {
      if (rfbRef.current) {
        try {
          rfbRef.current.disconnect()
        } catch { }
      }
    }
  }, [url, credentials, viewOnly, scaleViewport, resizeSession, clipViewport, onConnect, onDisconnect, handleCredentials])

  return (
    <div className={className} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', ...style }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#111', position: 'relative' }} />
      {error && (
        <div style={{ padding: 8, color: '#ef4444', background: '#111' }}>{error}</div>
      )}
      {connected && (
        <div style={{ padding: 4, color: '#10b981', background: '#111', fontSize: '12px' }}>Conectado</div>
      )}
    </div>
  )
}