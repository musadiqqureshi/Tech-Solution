/**
 * LiveChat.jsx — real-time client ↔ admin messaging
 *
 * Client view  : single chat window with admin online/offline badge
 * Admin view   : left panel lists all clients with unread counts;
 *                right panel shows the selected conversation
 *
 * Presence     : heartbeat upsert every 20 s, expires after 45 s
 * Realtime     : Supabase channel subscription on chat_messages & online_presence
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Loader2, MessageSquare, Circle, Users, ArrowLeft, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// ─── helpers ────────────────────────────────────────────────────────────────

const PRESENCE_INTERVAL = 20_000   // heartbeat every 20 s
const PRESENCE_TTL      = 45_000   // considered offline after 45 s

function isOnline(lastSeen) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < PRESENCE_TTL
}

function initials(name, email) {
  const src = name || email || '?'
  return src.slice(0, 2).toUpperCase()
}

function fmtTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── data layer ─────────────────────────────────────────────────────────────

async function fetchMessages(roomId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error
  return data
}

async function sendMessage(roomId, senderId, senderRole, content) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ room_id: roomId, sender_id: senderId, sender_role: senderRole, content })
    .select()
    .single()
  if (error) throw error
  return data
}

async function markRead(roomId, readerRole) {
  // Mark messages sent by the other side as read
  const otherRole = readerRole === 'admin' ? 'client' : 'admin'
  await supabase
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('sender_role', otherRole)
    .is('read_at', null)
}

async function fetchRooms() {
  // Fetch only the latest 500 messages (covers most active portals) to build the room list.
  // For high-volume deployments replace this with a Supabase RPC that does
  //   SELECT DISTINCT ON (room_id) * FROM chat_messages ORDER BY room_id, created_at DESC
  const { data, error } = await supabase
    .from('chat_messages')
    .select('room_id, content, sender_role, created_at, read_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error

  // Group by room_id keeping the latest message and counting unread client messages
  const map = {}
  for (const row of data) {
    if (!map[row.room_id]) {
      map[row.room_id] = { room_id: row.room_id, latest: row, unread: 0 }
    }
    if (row.sender_role === 'client' && !row.read_at) {
      map[row.room_id].unread++
    }
  }
  return Object.values(map).sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at))
}

async function fetchProfiles(ids) {
  if (!ids.length) return []
  const { data } = await supabase.from('profiles').select('id,name,email,company').in('id', ids)
  return data || []
}

async function heartbeat(userId, role) {
  await supabase
    .from('online_presence')
    .upsert({ user_id: userId, role, last_seen: new Date().toISOString() }, { onConflict: 'user_id' })
}

async function fetchPresence() {
  const { data } = await supabase.from('online_presence').select('*')
  return data || []
}

// ─── Presence hook ───────────────────────────────────────────────────────────

function usePresence(userId, role) {
  const [presence, setPresence] = useState([])   // array of { user_id, role, last_seen }

  useEffect(() => {
    if (!userId) return

    // Initial fetch + immediate heartbeat
    heartbeat(userId, role)
    fetchPresence().then(setPresence)

    // Heartbeat interval
    const hb = setInterval(() => heartbeat(userId, role), PRESENCE_INTERVAL)

    // Realtime subscription
    const ch = supabase
      .channel('presence-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_presence' }, () => {
        fetchPresence().then(setPresence)
      })
      .subscribe()

    return () => {
      clearInterval(hb)
      supabase.removeChannel(ch)
    }
  }, [userId, role])

  const isUserOnline = useCallback(
    (uid) => {
      const row = presence.find((p) => p.user_id === uid)
      return isOnline(row?.last_seen)
    },
    [presence]
  )

  const adminOnline = presence.some((p) => p.role === 'admin' && isOnline(p.last_seen))

  return { isUserOnline, adminOnline, presence }
}

// ─── Chat window (shared by client and admin) ────────────────────────────────

function ChatWindow({ roomId, myId, myRole, otherName, otherOnline, onBack }) {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const scroller                  = useRef(null)

  const scrollBottom = () =>
    setTimeout(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }), 50)

  // Initial load + mark read
  useEffect(() => {
    if (!roomId) return
    setLoading(true)
    fetchMessages(roomId).then((m) => {
      setMessages(m)
      setLoading(false)
      scrollBottom()
    })
    markRead(roomId, myRole)
  }, [roomId, myRole])

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return
    const ch = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        scrollBottom()
        markRead(roomId, myRole)
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [roomId, myRole])

  const submit = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    try {
      await sendMessage(roomId, myId, myRole, text)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-purple-100 shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-slate-400 hover:text-purple-700 mr-1">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="relative">
          <span className="grid place-items-center w-9 h-9 rounded-full text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
            {initials(otherName, '')}
          </span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${otherOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        </div>
        <div>
          <div className="font-bold text-slate-900 text-sm leading-tight">{otherName}</div>
          <div className={`text-[11px] font-semibold flex items-center gap-1 ${otherOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Circle size={7} fill="currentColor" />
            {otherOnline ? 'Online' : 'Offline — we\'ll respond shortly'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && (
          <div className="grid place-items-center py-12 text-slate-400">
            <Loader2 className="animate-spin" size={22} />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="grid place-items-center py-16 text-center text-slate-400">
            <MessageSquare size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No messages yet.<br />Start the conversation below.</p>
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === myId
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] group`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  mine
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-md'
                    : 'bg-white border border-purple-100 text-slate-800 rounded-bl-md shadow-sm'
                }`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 mt-0.5 px-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] text-slate-400">{fmtTime(msg.created_at)}</span>
                  {mine && (
                    <span className={`text-[10px] ${msg.read_at ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {msg.read_at ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Offline notice */}
      {!otherOnline && (
        <div className="mx-4 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
          <Clock size={13} />
          {myRole === 'client'
            ? 'Our team is currently offline. Leave a message and we\'ll get back to you shortly.'
            : 'Client is offline. Your message will be delivered when they return.'}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="flex items-end gap-2 bg-white border border-purple-200 rounded-2xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-purple-400 focus-within:border-transparent transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none max-h-32"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || sending}
            className="shrink-0 w-9 h-9 grid place-items-center rounded-xl text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

// ─── Client view ─────────────────────────────────────────────────────────────

export function ClientChat() {
  const { user, profile } = useAuth()
  const { adminOnline } = usePresence(user?.id, 'client')

  if (!user) return null

  return (
    <div className="h-full flex flex-col">
      <ChatWindow
        roomId={user.id}
        myId={user.id}
        myRole="client"
        otherName="Tech Solutions Support"
        otherOnline={adminOnline}
      />
    </div>
  )
}

// ─── Admin view ───────────────────────────────────────────────────────────────

export function AdminChat() {
  const { user } = useAuth()
  const { isUserOnline } = usePresence(user?.id, 'admin')

  const [rooms, setRooms]       = useState([])   // [{ room_id, latest, unread }]
  const [profiles, setProfiles] = useState({})   // room_id → profile
  const [selected, setSelected] = useState(null) // room_id
  const [loadingRooms, setLoadingRooms] = useState(true)

  const loadRooms = useCallback(async () => {
    try {
      const r = await fetchRooms()
      setRooms(r)
      // Fetch profiles for any new room_ids
      const ids = r.map((x) => x.room_id)
      if (ids.length) {
        const profs = await fetchProfiles(ids)
        setProfiles((prev) => {
          const next = { ...prev }
          for (const p of profs) next[p.id] = p
          return next
        })
      }
    } catch (e) { /* ignore */ }
    setLoadingRooms(false)
  }, [])

  useEffect(() => {
    loadRooms()
    // Realtime: refresh room list on any new chat message
    const ch = supabase
      .channel('admin-rooms-watcher')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, loadRooms)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loadRooms])

  const clientsOnly = rooms // rooms are always client rooms
  const selectedRoom = clientsOnly.find((r) => r.room_id === selected)
  const selectedProfile = selected ? profiles[selected] : null

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-purple-100 shadow-sm bg-white">
      {/* ── Left panel: client list ─────────────────────────────── */}
      <div className={`flex flex-col border-r border-purple-100 bg-slate-50 transition-all ${selected ? 'hidden sm:flex sm:w-64 shrink-0' : 'flex w-full sm:w-64 shrink-0'}`}>
        {/* Panel header */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-purple-100 bg-white">
          <Users size={16} className="text-purple-600" />
          <span className="font-bold text-slate-900 text-sm">Client Conversations</span>
          {clientsOnly.reduce((s, r) => s + r.unread, 0) > 0 && (
            <span className="ml-auto grid place-items-center w-5 h-5 rounded-full text-[10px] font-black text-white bg-purple-600">
              {clientsOnly.reduce((s, r) => s + r.unread, 0)}
            </span>
          )}
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingRooms && (
            <div className="grid place-items-center py-12 text-slate-400">
              <Loader2 className="animate-spin" size={20} />
            </div>
          )}
          {!loadingRooms && clientsOnly.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-slate-400">
              No client messages yet.
            </div>
          )}
          {clientsOnly.map((room) => {
            const prof = profiles[room.room_id]
            const online = isUserOnline(room.room_id)
            const active = selected === room.room_id
            return (
              <button
                key={room.room_id}
                onClick={() => setSelected(room.room_id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${active ? 'bg-purple-50' : 'hover:bg-slate-100'}`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <span className="grid place-items-center w-9 h-9 rounded-full text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
                    {initials(prof?.name, prof?.email)}
                  </span>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {prof?.name || prof?.email || 'Client'}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {fmtTime(room.latest.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-xs text-slate-500 truncate">
                      {room.latest.sender_role === 'admin' ? 'You: ' : ''}{room.latest.content}
                    </span>
                    {room.unread > 0 && (
                      <span className="shrink-0 grid place-items-center w-5 h-5 rounded-full text-[10px] font-black text-white bg-purple-600">
                        {room.unread}
                      </span>
                    )}
                  </div>
                  {prof?.company && (
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{prof.company}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right panel: conversation ───────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selected ? 'hidden sm:flex' : 'flex'}`}>
        {!selected ? (
          <div className="flex-1 grid place-items-center text-center p-8 text-slate-400">
            <MessageSquare size={36} className="mb-3 opacity-25" />
            <p className="text-sm font-semibold">Select a conversation<br />from the left panel</p>
          </div>
        ) : (
          <ChatWindow
            key={selected}
            roomId={selected}
            myId={user.id}
            myRole="admin"
            otherName={selectedProfile?.name || selectedProfile?.email || 'Client'}
            otherOnline={isUserOnline(selected)}
            onBack={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  )
}
