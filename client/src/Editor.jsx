import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { getToken, getUsername } from './auth'

const COLORS = ['#f783ac', '#4dabf7', '#38d9a9', '#ffa94d', '#9775fa']
const COLOR = COLORS[Math.floor(Math.random() * COLORS.length)]

// Giữ doc/provider theo room ở ngoài vòng đời React -> không bị tạo/hủy lặp ở dev
const cache = new Map()
function getRoom(room) {
  let entry = cache.get(room)
  if (!entry) {
    const ydoc = new Y.Doc()
    const idb = new IndexeddbPersistence(room, ydoc)   // lưu local
    const provider = new WebsocketProvider('ws://localhost:1234', room, ydoc, {
      params: { token: getToken() || '' },
    })
    entry = { ydoc, provider, idb }
    cache.set(room, entry)
  }
  return entry
}

export default function Editor({ room }) {
  const [status, setStatus] = useState('connecting')
  const [synced, setSynced] = useState(false)
  const { ydoc, provider } = getRoom(room)

  useEffect(() => {
    const onStatus = (e) => setStatus(e.status)
    const onSync = (isSynced) => setSynced(isSynced)
    provider.on('status', onStatus)
    provider.on('sync', onSync)
    // provider có thể đã sync xong trước khi effect chạy -> đọc trạng thái hiện tại
    if (provider.synced) setSynced(true)
    return () => {
      provider.off('status', onStatus)
      provider.off('sync', onSync)
    }
  }, [provider])

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ undoRedo: false }),
        Collaboration.configure({ document: ydoc }),
        CollaborationCaret.configure({
          provider,
          user: { name: getUsername() || 'Ẩn danh', color: COLOR },
        }),
      ],
    },
    [ydoc, provider],
  )

  const statusColor =
    status === 'connected' ? 'text-green-700'
    : status === 'disconnected' ? 'text-red-700'
    : 'text-orange-600'

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className={`px-3 py-1.5 text-xs bg-gray-100 ${statusColor}`}>
        {status} · {getUsername()}
      </div>
      <div className="relative">
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:p-4 [&_.ProseMirror]:min-h-60 [&_.ProseMirror]:outline-none"
        />
        {!synced && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-gray-500">
            Đang tải nội dung…
          </div>
        )}
      </div>
    </div>
  )
}