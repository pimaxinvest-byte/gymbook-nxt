'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
} from '@/features/messaging/actions'

type ClientItem = {
  clientRecordId: string
  userId:         string
  name:           string
  email:          string
}

type Message = {
  id:        string
  content:   string
  senderId:  string
  createdAt: Date
  sender:    { id: string; name: string; avatarUrl: string | null }
}

type Props = {
  clients:       ClientItem[]
  currentUserId: string
}

export default function MessagingClient({ clients, currentUserId }: Props) {
  const [selected,       setSelected]       = useState<ClientItem | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages,       setMessages]       = useState<Message[]>([])
  const [content,        setContent]        = useState('')
  const [loading,        setLoading]        = useState(false)
  const [sending,        setSending]        = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const msgs = await getMessages(convId)
      setMessages(msgs as Message[])
      await markAsRead(convId)
    } catch {
      // silently ignore
    }
  }, [])

  // Poll for new messages every 3 s while a conversation is open
  useEffect(() => {
    if (!conversationId) return
    intervalRef.current = setInterval(() => {
      loadMessages(conversationId)
    }, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [conversationId, loadMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function openChat(client: ClientItem) {
    setSelected(client)
    setMessages([])
    setLoading(true)
    try {
      const conv = await getOrCreateConversation(client.userId)
      setConversationId(conv.id)
      await loadMessages(conv.id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!conversationId || !content.trim() || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(conversationId, content)
      setMessages((prev) => [...prev, msg as Message])
      setContent('')
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  const fmtTime = (d: Date) =>
    new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div className="mb-4">
        <div className="breadcrumb">trainer / mensajes</div>
        <h1 className="text-2xl font-bold text-text">Mensajes</h1>
        <p className="text-text-muted text-sm mt-1">Comunicación directa con tus clientes</p>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 min-h-0 gap-0 rounded-xl overflow-hidden"
        style={{ border: '1px solid #27272A', background: '#121212' }}>

        {/* ── Left panel: client list ─────────────────────────────── */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r"
          style={{ borderColor: '#27272A' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#27272A' }}>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              Clientes ({clients.length})
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                <span className="text-2xl text-text-muted">◈</span>
                <p className="text-xs text-text-muted">Sin clientes activos</p>
              </div>
            ) : (
              clients.map((client) => {
                const isActive = selected?.userId === client.userId
                return (
                  <button
                    key={client.userId}
                    onClick={() => openChat(client)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      background: isActive ? 'rgba(59,130,246,.1)' : 'transparent',
                      borderBottom: '1px solid #1A1A1A',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ background: 'rgba(59,130,246,.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.2)' }}
                    >
                      {initials(client.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{client.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{client.email}</p>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#3B82F6' }} />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right panel: chat ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.15)' }}
              >
                ◫
              </div>
              <p className="text-sm font-medium text-text">Selecciona un cliente</p>
              <p className="text-xs text-text-muted max-w-xs">
                Elige un cliente de la lista para iniciar o continuar una conversación
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
                style={{ borderColor: '#27272A' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,.15)', color: '#93C5FD' }}
                >
                  {initials(selected.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{selected.name}</p>
                  <p className="text-[10px] text-text-muted">{selected.email}</p>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex gap-1">
                      {[0,1,2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: '#3B82F6', animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                    <p className="text-xs text-text-muted">
                      No hay mensajes todavía.<br />
                      ¡Sé el primero en escribir!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-xs lg:max-w-md px-3.5 py-2.5 rounded-2xl"
                          style={
                            isMe
                              ? { background: '#3B82F6', color: '#fff', borderBottomRightRadius: 4 }
                              : { background: '#1E1E1E', color: '#F1F1F1', border: '1px solid #27272A', borderBottomLeftRadius: 4 }
                          }
                        >
                          <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                          <p className="text-[10px] mt-1 opacity-70 text-right">{fmtTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div className="flex-shrink-0 px-4 py-3 border-t" style={{ borderColor: '#27272A' }}>
                <div className="flex items-end gap-2">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje… (Enter para enviar)"
                    rows={1}
                    className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition-colors"
                    style={{
                      background: '#1A1A1A',
                      border: '1px solid #27272A',
                      maxHeight: 120,
                      lineHeight: '1.5',
                    }}
                    onInput={(e) => {
                      const t = e.target as HTMLTextAreaElement
                      t.style.height = 'auto'
                      t.style.height = `${Math.min(t.scrollHeight, 120)}px`
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!content.trim() || sending}
                    className="btn-primary flex-shrink-0 cursor-pointer"
                    style={{ padding: '10px 18px', opacity: (!content.trim() || sending) ? 0.5 : 1 }}
                  >
                    {sending ? '…' : 'Enviar'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
