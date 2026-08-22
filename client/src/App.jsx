import Editor from './Editor'

export default function App() {
  return (
    <div className="max-w-3xl mx-auto my-10 px-4 font-sans">
      <h1 className="text-2xl font-bold mb-4">Collab Editor</h1>
      <Editor room="demo" />
    </div>
  )
}