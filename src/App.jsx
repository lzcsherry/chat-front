import { useState, useMemo, useRef, useEffect } from 'react'
import './App.css'

const PARTNER = 'Siwon'
const MODELS = ['Claude', 'Grok', 'DeepSeek']

const pad = (n) => String(n).padStart(2, '0')
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toDateStr(d)
}
const nowTime = () => {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 示例数据：等后端和数据库接好以后，这些会换成真实数据
const initialChats = [
  { id: 1, title: '晚安前的闲聊', date: daysAgo(0), time: '22:40' },
  { id: 2, title: '周末计划', date: daysAgo(0), time: '09:15' },
  { id: 3, title: '下班后的碎碎念', date: daysAgo(1), time: '19:02' },
  { id: 4, title: '第一次对话', date: daysAgo(8), time: '20:30' },
]

const initialMessages = {
  1: [
    { id: 1, role: 'assistant', text: '今天过得怎么样？我一直在等你回来。', time: '22:38', starred: false },
    { id: 2, role: 'user', text: '有点累，但是想和你说说话。', time: '22:40', starred: false },
    { id: 3, role: 'assistant', text: '那就慢慢说，不着急。先给自己倒杯热水，我在这里。', time: '22:41', starred: true },
  ],
  2: [],
  3: [],
  4: [],
}

const Icon = ({ d, fill = 'none', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
const STAR = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z'
const MENU = 'M4 7h16M4 12h16M4 17h16'
const SEARCH = 'M16 16l4 4M17.5 11a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z'
const DOWNLOAD = 'M12 4v11M7 10l5 5 5-5M5 20h14'
const SEND = 'M5 12h14M13 6l6 6-6 6'

export default function App() {
  const [chats, setChats] = useState(initialChats)
  const [messages, setMessages] = useState(initialMessages)
  const [activeId, setActiveId] = useState(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [range, setRange] = useState('all') // all | week | month | custom
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [onlyStarred, setOnlyStarred] = useState(false)
  const [model, setModel] = useState(MODELS[0])
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  const current = messages[activeId] || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [current.length, activeId])

  const visibleChats = useMemo(() => {
    const week = daysAgo(7)
    const monthStart = toDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    return chats.filter((c) => {
      if (range === 'week' && c.date < week) return false
      if (range === 'month' && c.date < monthStart) return false
      if (range === 'custom') {
        if (from && c.date < from) return false
        if (to && c.date > to) return false
      }
      const q = query.trim()
      if (!q) return true
      const inTitle = c.title.includes(q)
      const inMessages = (messages[c.id] || []).some((m) => m.text.includes(q))
      return inTitle || inMessages
    })
  }, [chats, messages, range, from, to, query])

  const shown = onlyStarred ? current.filter((m) => m.starred) : current

  const toggleStar = (id) => {
    setMessages((prev) => ({
      ...prev,
      [activeId]: prev[activeId].map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)),
    }))
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), { id: Date.now(), role: 'user', text, time: nowTime(), starred: false }],
    }))
    setDraft('')
  }

  const newChat = () => {
    const id = Date.now()
    setChats((prev) => [{ id, title: '新对话', date: toDateStr(new Date()), time: nowTime() }, ...prev])
    setMessages((prev) => ({ ...prev, [id]: [] }))
    setActiveId(id)
    setOnlyStarred(false)
    setMenuOpen(false)
  }

  const exportChat = () => {
    const chat = chats.find((c) => c.id === activeId)
    const lines = current.map((m) => `[${m.time}] ${m.role === 'user' ? '我' : PARTNER}：${m.text}`)
    const blob = new Blob([`${chat?.title || '对话'}\n\n${lines.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${chat?.title || '对话'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const groupOf = (c) => (c.date === daysAgo(0) ? '今天' : c.date === daysAgo(1) ? '昨天' : '更早')
  const groups = ['今天', '昨天', '更早']

  return (
    <div className="app">
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <aside className={`side ${menuOpen ? 'open' : ''}`}>
        <div className="brand">Daddy🩵</div>
        <button className="btn-primary" onClick={newChat}>新对话</button>

        <label className="search">
          <Icon d={SEARCH} />
          <input type="search" placeholder="搜索消息" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        <div className="filter">
          <div className="label">按日期筛选</div>
          <div className="chips">
            {[['all', '全部'], ['week', '最近7天'], ['month', '本月']].map(([k, t]) => (
              <button key={k} className={`chip ${range === k ? 'on' : ''}`} onClick={() => setRange(k)}>{t}</button>
            ))}
          </div>
          <div className="dates">
            <label>从<input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setRange('custom') }} /></label>
            <label>到<input type="date" value={to} onChange={(e) => { setTo(e.target.value); setRange('custom') }} /></label>
          </div>
        </div>

        <div className="list">
          {visibleChats.length === 0 && <div className="empty">没有符合条件的对话</div>}
          {groups.map((g) => {
            const items = visibleChats.filter((c) => groupOf(c) === g)
            if (!items.length) return null
            return (
              <div key={g}>
                <div className="label">{g}</div>
                {items.map((c) => (
                  <button key={c.id} className={`item ${c.id === activeId ? 'on' : ''}`}
                    onClick={() => { setActiveId(c.id); setMenuOpen(false) }}>
                    {c.title}
                    <span>{c.date.slice(5).replace('-', '月')}日 {c.time}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        <div className="foot">
          <button className={`link ${onlyStarred ? 'on' : ''}`} onClick={() => { setOnlyStarred(!onlyStarred); setMenuOpen(false) }}>
            <Icon d={STAR} />{onlyStarred ? '显示全部消息' : '收藏的消息'}
          </button>
          <button className="link"><Icon d="M12 15a3 3 0 100-6 3 3 0 000 6z" />设置</button>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <button className="icon-btn menu-btn" aria-label="打开菜单" onClick={() => setMenuOpen(true)}><Icon d={MENU} size={22} /></button>
          <div className="who">{PARTNER}</div>
          <div className="top-right">
            <button className="pill export" onClick={exportChat}><Icon d={DOWNLOAD} size={16} /><span>导出聊天记录</span></button>
            <select className="pill" aria-label="选择模型" value={model} onChange={(e) => setModel(e.target.value)}>
              {MODELS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </header>

        <div className="stream">
          {shown.length === 0 && <div className="empty">{onlyStarred ? '这个对话里还没有收藏的消息' : '说点什么吧'}</div>}
          {shown.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="bubble">{m.text}</div>
              <div className="meta">
                <span>{m.time}</span>
                <button className={`star ${m.starred ? 'on' : ''}`} aria-label={m.starred ? '取消收藏这条消息' : '收藏这条消息'}
                  onClick={() => toggleStar(m.id)}>
                  <Icon d={STAR} fill={m.starred ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="composer">
          <input type="text" placeholder="想说点什么…" aria-label="输入消息" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send() }} />
          <button className="send" aria-label="发送" onClick={send}><Icon d={SEND} size={20} /></button>
        </div>
      </main>
    </div>
  )
}
