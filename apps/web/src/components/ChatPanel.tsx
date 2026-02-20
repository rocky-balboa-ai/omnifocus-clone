'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Drawer } from '@/components/Drawer';
import { api } from '@/lib/api';
import { Send, Plus, Trash2, MessageCircle, Check, X, Loader2, Bot, User, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: any;
  toolResults?: any;
  createdAt: string;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ActionResult {
  tool: string;
  success: boolean;
  summary: string;
}

interface ChatResponse {
  message: string;
  actions: ActionResult[];
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [pendingActions, setPendingActions] = useState<ActionResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Load conversations when panel opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // Focus input when conversation loads
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversation]);

  const loadConversations = async () => {
    try {
      const convos = await api.get<ChatConversation[]>('/chat/conversations');
      setConversations(convos);
      // Auto-select most recent or create new
      if (convos.length > 0 && !activeConversation) {
        await selectConversation(convos[0].id);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  const selectConversation = async (id: string) => {
    try {
      const conv = await api.get<ChatConversation>(`/chat/conversations/${id}`);
      setActiveConversation(conv);
      // Filter out 'tool' role messages for display — they're internal
      setMessages(conv.messages.filter((m) => m.role !== 'tool'));
      setShowConversations(false);
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  };

  const createConversation = async () => {
    try {
      const conv = await api.post<ChatConversation>('/chat/conversations', {});
      setConversations((prev) => [conv, ...prev]);
      setActiveConversation(conv);
      setMessages([]);
      setShowConversations(false);
      setPendingActions([]);
      inputRef.current?.focus();
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await api.delete(`/chat/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    let convId = activeConversation?.id;
    
    // Create conversation if none active
    if (!convId) {
      try {
        const conv = await api.post<ChatConversation>('/chat/conversations', {});
        setConversations((prev) => [conv, ...prev]);
        setActiveConversation(conv);
        convId = conv.id;
      } catch (e) {
        console.error('Failed to create conversation:', e);
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    setPendingActions([]);
    
    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await api.post<ChatResponse>(
        `/chat/conversations/${convId}/messages`,
        { message: userMessage }
      );

      // Add AI response
      const assistantMsg: ChatMessage = {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Show actions if any
      if (response.actions?.length > 0) {
        setPendingActions(response.actions);
      }

      // Update conversation title in list
      loadConversations();
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, something went wrong: ${e.message || 'Unknown error'}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="right" size="xl" title="">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConversations(!showConversations)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Conversations"
            >
              <MessageCircle size={18} />
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {activeConversation?.title || 'AI Assistant'}
            </h2>
          </div>
          <button
            onClick={createConversation}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="New conversation"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Conversations List (overlay) */}
        {showConversations && (
          <div className="absolute inset-0 top-[53px] z-10 bg-white dark:bg-gray-900 overflow-y-auto">
            <div className="p-3">
              <button
                onClick={createConversation}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors mb-2"
              >
                <Plus size={16} />
                <span className="text-sm font-medium">New Conversation</span>
              </button>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1',
                    activeConversation?.id === conv.id
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => selectConversation(conv.id)}
                  >
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                      {conv.title || 'New Chat'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {conv.messages?.[0]?.content?.substring(0, 50) || 'No messages'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No conversations yet. Start chatting!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                AI Assistant
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                I can help you manage your tasks, projects, and more. Try asking me to create a task, show what&apos;s due, or organize your projects.
              </p>
              <div className="mt-6 space-y-2">
                {[
                  'What tasks are due this week?',
                  'Create a project called "Q1 Goals"',
                  'Show me all flagged items',
                  'What\'s in my inbox?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div
                className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-2.5',
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <User size={16} className="text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {/* Action Results */}
          {pendingActions.length > 0 && (
            <div className="space-y-1.5 ml-11">
              {pendingActions.map((action, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg',
                    action.success
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  )}
                >
                  {action.success ? <Check size={14} /> : <X size={14} />}
                  <span>{action.summary}</span>
                </div>
              ))}
            </div>
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: '42px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={clsx(
                'flex-shrink-0 p-2.5 rounded-xl transition-colors',
                input.trim() && !isLoading
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              )}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
