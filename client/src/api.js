const BASE = 'http://localhost:1234'

// Lấy danh sách document
export async function listDocs() {
  const res = await fetch(`${BASE}/docs`)
  return res.json()
}

// Tạo document mới, trả về { id, title }
export async function createDoc(title) {
  const res = await fetch(`${BASE}/docs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  return res.json()
}

// Xóa document theo id
export async function deleteDoc(id) {
  const res = await fetch(`${BASE}/docs/${id}`, { method: 'DELETE' })
  return res.json()
}