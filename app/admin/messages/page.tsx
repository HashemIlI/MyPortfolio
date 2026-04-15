'use client';
import { useEffect, useState } from 'react';
import { Trash2, Mail, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchJson } from '@/lib/http';

type Message = {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function fetchMessages() {
    try {
      const data = await fetchJson<Message[]>('/api/messages');
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
      toast({ title: 'Failed to load messages', variant: 'destructive' });
    }
  }

  useEffect(() => { fetchMessages(); }, []);

  async function markRead(id: string) {
    await fetchJson<{ success: boolean }>('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read: true }),
    });
    setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, read: true } : m)));
  }

  async function handleDelete(id: string) {
    await fetchJson<{ success: boolean }>('/api/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.filter((m) => m._id !== id));
    setDeleteId(null);
    toast({ title: 'Message deleted' });
  }

  const filtered = filter === 'unread' ? messages.filter((m) => !m.read) : messages;
  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Messages</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {messages.length} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {f}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-16 text-center text-gray-500">
            {filter === 'unread' ? 'No unread messages.' : 'No messages yet.'}
          </div>
        ) : (
          filtered.map((msg) => (
            <div
              key={msg._id}
              className={`bg-gray-800 rounded-xl border overflow-hidden transition-all ${
                !msg.read ? 'border-emerald-500/20 shadow-sm shadow-emerald-500/10' : 'border-gray-700'
              }`}
            >
              {/* Header row */}
              <div
                className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                onClick={() => {
                  setExpanded(expanded === msg._id ? null : msg._id);
                  if (!msg.read) markRead(msg._id);
                }}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {msg.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-100 text-sm">{msg.name}</span>
                    {!msg.read && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-600 text-white font-medium">New</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">{msg.email}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-gray-500 text-xs">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${expanded === msg._id ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Expanded message */}
              {expanded === msg._id && (
                <div className="px-5 pb-5 border-t border-gray-700">
                  {msg.subject && (
                    <p className="text-gray-400 text-xs mt-3 font-medium">
                      Subject: <span className="text-gray-300">{msg.subject}</span>
                    </p>
                  )}
                  <p className="text-gray-300 text-sm leading-relaxed mt-3 whitespace-pre-wrap">{msg.message}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${msg.subject || 'Your message'}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 text-xs font-medium transition-colors"
                    >
                      <Mail className="h-3 w-3" />
                      Reply via Email
                    </a>
                    {!msg.read && (
                      <button
                        onClick={() => markRead(msg._id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(msg._id)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 text-xs font-medium transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h3 className="font-bold text-gray-100 mb-2">Delete Message?</h3>
            <p className="text-gray-400 text-sm mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
