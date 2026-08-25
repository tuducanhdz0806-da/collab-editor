const BASE = 'http://localhost:1234'

async function authRequest(path, username, password) {
  const res = await fetch(`${BASE}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra')
  }
  return data
}

// Đăng nhập: lưu token -> vào được app
export async function login(username, password) {
  const data = await authRequest('login', username, password)
  localStorage.setItem('token', data.token)
  localStorage.setItem('username', data.username)
  return data
}

// Đăng ký: KHÔNG lưu token -> đăng ký xong quay về đăng nhập
export function register(username, password) {
  return authRequest('register', username, password)
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getUsername() {
  return localStorage.getItem('username')
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
}