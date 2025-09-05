import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Tailscale() {
  const [currentKey, setCurrentKey] = useState<string>('')
  const [newKey, setNewKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    try {
      const { data } = await api.get<{ tailscaleKey: string }>('/tailscale')
      setCurrentKey(data.tailscaleKey)
    } catch {
      setCurrentKey('')
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await api.post('/tailscale', { tailscaleKey: newKey })
      setNewKey('')
      await load()
      setMessage('Chave atualizada com sucesso')
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Falha ao salvar chave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Tailscale</h2>
      <div className="row">
        <div className="col">
          <div>Chave ativa:</div>
          <div style={{ wordBreak: 'break-all', opacity: .8 }}>{currentKey || 'Nenhuma'}</div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <input className="input" placeholder="Nova chave Tailscale" value={newKey} onChange={e => setNewKey(e.target.value)} />
        <button className="btn" disabled={loading || !newKey} onClick={save}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </div>
      {message && <div style={{ marginTop: 8 }}>{message}</div>}
    </div>
  )
}
