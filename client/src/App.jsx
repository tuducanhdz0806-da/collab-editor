import { useState } from 'react'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import DocList from './DocList'
import Editor from './Editor'
import Login from './Login'
import { getToken, getUsername, logout } from './auth'

function DocPage() {
  const { id } = useParams()
  return (
    <div className="max-w-3xl mx-auto my-10 px-4 font-sans">
      <a href="/" className="text-sm text-blue-700 hover:underline">← Danh sách</a>
      <h1 className="text-2xl font-bold my-4">Collab Editor</h1>
      <Editor room={id} />
    </div>
  )
}

export default function App() {
  // hasToken: đã đăng nhập chưa. Dùng state để login xong tự chuyển sang app.
  const [hasToken, setHasToken] = useState(!!getToken())

  if (!hasToken) {
    return <Login onLoggedIn={() => setHasToken(true)} />
  }

  return (
    <BrowserRouter>
      <div className="max-w-3xl mx-auto px-4 pt-4 flex justify-end text-sm">
        <span className="text-gray-500 mr-3">Xin chào, {getUsername()}</span>
        <button
          onClick={() => { logout(); setHasToken(false) }}
          className="text-blue-700 hover:underline"
        >
          Đăng xuất
        </button>
      </div>
      <Routes>
        <Route path="/" element={<DocList />} />
        <Route path="/doc/:id" element={<DocPage />} />
      </Routes>
    </BrowserRouter>
  )
}