import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDocs, createDoc, deleteDoc } from './api'

export default function DocList() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false) // đang hiện ô input tạo mới?
  const [newTitle, setNewTitle] = useState('')

  const refresh = async () => {
    setLoading(true)
    setDocs(await listDocs())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const startCreating = () => {
    setNewTitle('')
    setCreating(true)
  }

  const submitCreate = async () => {
    const title = newTitle.trim() || 'Untitled'
    await createDoc(title)
    setCreating(false)
    setNewTitle('')
    refresh()
  }

  const cancelCreate = () => {
    setCreating(false)
    setNewTitle('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') submitCreate()
    if (e.key === 'Escape') cancelCreate()
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa document này?')) return
    await deleteDoc(id)
    refresh()
  }

  return (
    <div className="max-w-3xl mx-auto my-6 sm:my-10 px-4 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Documents</h1>
        <button
          onClick={startCreating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + New
        </button>
      </div>

      {creating && (
        <div className="flex items-center gap-2 border border-blue-300 rounded-md px-4 py-3 mb-3 bg-blue-50">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tên document…"
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md outline-none focus:border-blue-500"
          />
          <button
            onClick={submitCreate}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tạo
          </button>
          <button
            onClick={cancelCreate}
            className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
          >
            Hủy
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải…</p>
      ) : docs.length === 0 && !creating ? (
        <p className="text-gray-500">Chưa có document nào. Bấm “+ New” để tạo.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-50"
            >
              <Link to={`/doc/${d.id}`} className="text-blue-700 hover:underline">
                {d.title}
              </Link>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}