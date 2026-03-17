'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, RotateCcw, ChevronDown, Bot, User, Trash2, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ActionButton {
  label: string
  value: string
}

interface EditEntry {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  record_id: number
  previous_data?: unknown
  new_data?: unknown
  timestamp: string
  reverted?: boolean
}

function parseActions(content: string): { text: string; actions: ActionButton[] } {
  const actionRegex = /```actions\s*\n([\s\S]*?)\n```/g
  let text = content
  const allActions: ActionButton[] = []

  let match
  while ((match = actionRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      if (Array.isArray(parsed)) allActions.push(...parsed)
    } catch { /* ignore parse errors */ }
    text = text.replace(match[0], '')
  }

  return { text: text.trim(), actions: allActions }
}

function formatTable(table: string): string {
  const labels: Record<string, string> = {
    commercials: 'Commerciaux',
    prospect_projects: 'Projets prospection',
    prospection_objectives: 'Objectifs prospection',
    planning_state: 'Planning',
  }
  return labels[table] || table
}

function formatEditType(type: string): string {
  const labels: Record<string, string> = { create: 'Création', update: 'Modification', delete: 'Suppression' }
  return labels[type] || type
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [editHistory, setEditHistory] = useState<EditEntry[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReverting, setIsReverting] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Send initial greeting when opening for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0 && !isLoading) {
      sendMessage('Bonjour')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          editHistory,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages([...newMessages, { role: 'assistant', content: `❌ Erreur: ${data.error || 'Erreur inconnue'}` }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.message }])
        if (data.editHistory) setEditHistory(data.editHistory)
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '❌ Erreur de connexion au serveur.' }])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRevert(edit: EditEntry) {
    if (edit.reverted) return
    setIsReverting(edit.id)

    try {
      const res = await fetch('/api/assistant/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit }),
      })
      const data = await res.json()

      if (res.ok) {
        setEditHistory((prev) => prev.map((e) => e.id === edit.id ? { ...e, reverted: true } : e))
        setMessages((prev) => [...prev, { role: 'assistant', content: `✅ ${data.message}` }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: `❌ Erreur annulation: ${data.error}` }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Erreur de connexion.' }])
    } finally {
      setIsReverting(null)
    }
  }

  function handleClearChat() {
    setMessages([])
    setEditHistory([])
    setShowHistory(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function renderMessage(msg: Message, index: number) {
    const isUser = msg.role === 'user'
    const { text, actions } = parseActions(msg.content)

    return (
      <div key={index} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
          {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
        </div>
        <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-gradient-to-br from-red-500 to-red-700 text-white rounded-tr-md'
                : 'bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-tl-md'
            }`}
          >
            {text}
          </div>
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.value)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:border-red-400 hover:text-red-500 transition-all hover:shadow-sm disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const activeEdits = editHistory.filter((e) => !e.reverted)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? 'bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rotate-90'
            : 'bg-gradient-to-br from-red-500 to-red-700 text-white hover:shadow-red-500/30 hover:shadow-xl'
        }`}
        aria-label={isOpen ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant'}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!isOpen && activeEdits.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {activeEdits.length}
          </span>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[75vh] rounded-2xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-bg-page)] flex flex-col overflow-hidden animate-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-red-600 to-red-800 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Assistant Beterbat</h3>
                <p className="text-[11px] text-red-100">Gérez votre tableau de bord</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {editHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors relative"
                  title="Historique des modifications"
                >
                  <RotateCcw size={16} />
                  {activeEdits.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">
                      {activeEdits.length}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Nouvelle conversation"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Edit History Panel */}
          {showHistory && editHistory.length > 0 && (
            <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-card)] max-h-48 overflow-y-auto">
              <div className="px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider border-b border-[var(--color-border)]">
                Historique des modifications
              </div>
              {[...editHistory].reverse().map((edit) => (
                <div
                  key={edit.id}
                  className={`flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] last:border-0 ${edit.reverted ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                      {formatEditType(edit.type)} — {formatTable(edit.table)}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)]">
                      {new Date(edit.timestamp).toLocaleTimeString('fr-FR')}
                      {edit.reverted && ' — Annulé'}
                    </div>
                  </div>
                  {!edit.reverted && (
                    <button
                      onClick={() => handleRevert(edit)}
                      disabled={isReverting === edit.id}
                      className="ml-2 px-2.5 py-1 text-[11px] font-medium rounded-md bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isReverting === edit.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                      Annuler
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[calc(75vh-140px)]">
            {messages.filter((m) => !(m.role === 'user' && m.content === 'Bonjour' && messages.indexOf(m) === 0)).map(renderMessage)}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-card)] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all disabled:opacity-50"
                style={{ maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-40 disabled:hover:shadow-none flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-in {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  )
}
