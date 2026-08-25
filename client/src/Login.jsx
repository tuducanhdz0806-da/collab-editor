import { useState } from 'react'
import { login, register } from './auth'

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState('login') // 'login' hoặc 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('') // thông báo tốt (vd đăng ký thành công)
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  const submit = async () => {
    const name = username.trim()
    if (!name || !password) {
      setError('Nhập đủ tên và mật khẩu.')
      return
    }
    if (isRegister && password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setBusy(true)
    setError('')
    setInfo('')
    try {
      if (isRegister) {
        await register(name, password)
        // Đăng ký xong: về màn đăng nhập, giữ lại tên cho tiện
        setMode('login')
        setPassword('')
        setConfirm('')
        setInfo('Đăng ký thành công! Vui lòng đăng nhập.')
      } else {
        await login(name, password)
        onLoggedIn()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register')
    setError('')
    setInfo('')
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="max-w-sm mx-auto my-24 px-4 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? 'Đăng ký' : 'Đăng nhập'}
      </h1>

      <input
        autoFocus
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Tên đăng nhập"
        className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 mb-3"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !isRegister && submit()}
        placeholder="Mật khẩu"
        className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 mb-3"
      />
      {isRegister && (
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Xác nhận mật khẩu"
          className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 mb-3"
        />
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? 'Đang xử lý…' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
      </button>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {info && <p className="text-sm text-green-600 mt-3">{info}</p>}

      <p className="text-sm text-gray-600 mt-4 text-center">
        {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
        <button onClick={switchMode} className="text-blue-700 hover:underline">
          {isRegister ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </p>
    </div>
  )
}