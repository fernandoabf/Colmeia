import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', data.token)
      navigate('/computers')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{maxWidth: 420, margin: '48px auto'}}>
      <h2>Entrar</h2>
      <form onSubmit={onSubmit} className="row" style={{flexDirection:'column', gap: 12}}>
        <input className="input" placeholder="Usuário" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="input" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div style={{color:'#ef4444'}}>{error}</div>}
        <button disabled={loading} className="btn" type="submit">{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  )
}
