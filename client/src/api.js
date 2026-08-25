import { getToken } from './auth'

const BASE = 'http://localhost:1234'

// Header kèm token cho mọi request cần xác thực
function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  }
}

export async function listDocs() {
  const res = await fetch(`${BASE}/docs`, {
    headers: authHeaders(),
  })
  return res.json()
}

export async function createDoc(title) {
  const res = await fetch(`${BASE}/docs`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title }),
  })
  return res.json()
}

export async function deleteDoc(id) {
  const res = await fetch(`${BASE}/docs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.json()
}