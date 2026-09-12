import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, EmptyState, ErrorState, Input, LoadingState } from '@/components/ui'
import { conversationApi } from '@/api'
import { errorMessage } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import type { Message, PageResponse } from '@/types'

/** Two-pane messaging: conversation list on the left, thread on the right. */
export function MessagesPage(): React.ReactElement {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const conversations = useQuery({ queryKey: ['conversations'], queryFn: () => conversationApi.list(0, 50) })
  const [activeId, setActiveId] = useState<number | null>(null)

  // Arriving with ?providerId= (from a provider profile) opens or resumes that
  // conversation, then the list query picks it up on invalidation.
  const openProviderId = searchParams.get('providerId')
  useEffect(() => {
    if (openProviderId == null || conversations.isLoading) return
    const providerId = Number(openProviderId)
    if (!Number.isFinite(providerId)) return
    let cancelled = false
    void conversationApi
      .open({ providerId })
      .then((conversation: { id: number }) => {
        if (cancelled) return
        void queryClient.invalidateQueries({ queryKey: ['conversations'] })
        setActiveId(conversation.id)
      })
      .catch(() => {
        /* failures surface through the conversations query itself */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProviderId])

  // Auto-select the first conversation once loaded.
  useEffect(() => {
    if (activeId == null && conversations.data && conversations.data.content.length > 0) {
      setActiveId(conversations.data.content[0].id)
    }
  }, [activeId, conversations.data])

  const thread = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => conversationApi.messages(activeId as number, 0, 100),
    enabled: activeId != null,
  })

  const markRead = useMutation({
    mutationFn: (id: number) => conversationApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  useEffect(() => {
    if (activeId != null) markRead.mutate(activeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Messages</h1>
        <p className="mt-2 text-sm text-muted">Chat with your pros before and after a booking.</p>
      </div>

      {conversations.isLoading && <LoadingState rows={2} />}
      {conversations.isError && <ErrorState message={errorMessage(conversations.error)} onRetry={() => void conversations.refetch()} />}

      {conversations.data && conversations.data.content.length === 0 && (
        <EmptyState
          title="No conversations yet"
          hint="Open a chat from a provider's profile or a booking."
        />
      )}

      {conversations.data && conversations.data.content.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <ul className="space-y-2">
            {conversations.data.content.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-sm border p-4 text-left transition-colors ${
                    activeId === c.id ? 'border-bamboo bg-bamboo-50' : 'border-line bg-white hover:bg-bamboo-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{c.otherParticipant}</p>
                    {c.unreadCount > 0 && (
                      <span className="rounded-full bg-bamboo px-2 py-0.5 text-xs font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{c.lastMessage ?? 'No messages yet'}</p>
                  {c.lastMessageAt && (
                    <p className="mt-1 text-xs text-muted">{new Date(c.lastMessageAt).toLocaleString()}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {activeId != null && <Thread conversationId={activeId} thread={thread.data} isLoading={thread.isLoading} error={thread.isError ? errorMessage(thread.error) : null} onRetry={() => void thread.refetch()} />}
        </div>
      )}
    </div>
  )
}

function Thread({
  conversationId,
  thread,
  isLoading,
  error,
  onRetry,
}: {
  conversationId: number
  thread?: PageResponse<Message>
  isLoading: boolean
  error: string | null
  onRetry: () => void
}): React.ReactElement {
  const [text, setText] = useState('')
  const { user } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const send = useMutation({
    mutationFn: () => conversationApi.send(conversationId, text),
    onSuccess: () => {
      setText('')
      void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  function submit(e: FormEvent): void {
    e.preventDefault()
    if (text.trim()) send.mutate()
  }

  return (
    <Card className="flex h-[480px] flex-col p-0">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && <LoadingState rows={3} />}
        {error && <ErrorState message={error} onRetry={onRetry} />}
        {thread?.content.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[70%] rounded-sm px-3 py-2 text-sm ${
                m.senderId === user?.id ? 'bg-bamboo text-white' : 'bg-cloud text-ink'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className={`mt-1 text-xs ${m.senderId === user?.id ? 'text-bamboo-100' : 'text-muted'}`}>
                {new Date(m.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-line p-3">
        <div className="flex-1">
          <Input
            name="message"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Message"
          />
        </div>
        <Button type="submit" loading={send.isPending} disabled={!text.trim()}>
          Send
        </Button>
      </form>
    </Card>
  )
}
