import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import DocList from './DocList'
import Editor from './Editor'

// Trang editor cho một document cụ thể — lấy id từ URL làm room
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DocList />} />
        <Route path="/doc/:id" element={<DocPage />} />
      </Routes>
    </BrowserRouter>
  )
}