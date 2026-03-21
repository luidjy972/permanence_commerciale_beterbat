'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  FileText,
  CheckCircle2,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ActionButton {
  label: string
  value: string
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

const INITIAL_PROMPT = 'Je souhaite créer une nouvelle application pour le dashboard Beterbat. Guide-moi étape par étape.'

export default function NewApplicationPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [specSaved, setSpecSaved] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const initialized = useRef(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  // Send the initial prompt automatically on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      sendMessage(INITIAL_PROMPT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          editHistory: [],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages([...newMessages, { role: 'assistant', content: `❌ Erreur: ${data.error || 'Erreur inconnue'}` }])
      } else {
        const assistantContent: string = data.message || ''
        setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
        // Detect if the spec was saved (the assistant mentions saving)
        if (
          assistantContent.includes('sauvegardée') ||
          assistantContent.includes('enregistrée') ||
          assistantContent.includes('save_app_specification')
        ) {
          setSpecSaved(true)
        }
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '❌ Erreur de connexion au serveur.' }])
    } finally {
      setIsLoading(false)
    }
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
    // Hide the initial auto-prompt from display
    if (isUser && index === 0 && msg.content === INITIAL_PROMPT) return null

    return (
      <div key={index} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-gradient-to-br from-red-500 to-red-700'
              : 'bg-gradient-to-br from-slate-600 to-slate-800'
          }`}
        >
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>
        <div className={`max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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
                  className="px-3.5 py-2 text-xs font-medium rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:border-red-400 hover:text-red-500 transition-all hover:shadow-sm disabled:opacity-50"
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

  // Determine current step from messages for the progress indicator
  const assistantMessages = messages.filter((m) => m.role === 'assistant')
  const step = Math.min(assistantMessages.length, 5)
  const steps = [
    'Titre & Description',
    'Fonctionnalités',
    'Cas d\'utilisation',
    'Exemple & Validation',
    'Spécification finale',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 text-sm mb-3 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Applications
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              <p
                className="text-xs font-medium tracking-widest uppercase"
                style={{ color: 'var(--color-accent)' }}
              >
                BETERBAT · CRÉATEUR D&apos;APPLICATION
              </p>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Nouvelle application
            </h1>
          </div>

          {specSaved && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Spécification sauvegardée</span>
            </div>
          )}
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mt-4">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  i < step
                    ? 'bg-green-500/10 text-green-500'
                    : i === step
                    ? 'bg-red-500/10 text-red-500'
                    : 'text-[var(--color-text-tertiary)]'
                }`}
                style={
                  i >= step && i !== step
                    ? { backgroundColor: 'var(--color-bg-card)' }
                    : undefined
                }
              >
                {i < step ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[9px]">
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="w-4 h-px"
                  style={{
                    backgroundColor:
                      i < step ? '#22c55e' : 'var(--color-border)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 min-h-0 rounded-2xl border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-page)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
              >
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Créons votre application
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                L&apos;assistant va vous guider étape par étape pour définir votre nouvelle application.
              </p>
            </div>
          )}

          {messages.map(renderMessage)}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div
                className="rounded-2xl rounded-tl-md px-5 py-3 border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
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

        {/* Input area */}
        <div
          className="shrink-0 p-4 border-t"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Décrivez votre application..."
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all disabled:opacity-50"
              style={{ maxHeight: '150px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 150) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-40 disabled:hover:shadow-none flex-shrink-0"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
