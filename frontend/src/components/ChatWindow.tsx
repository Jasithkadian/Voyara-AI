import React, { useState, useEffect, useRef } from 'react';
import { aiApi, ChatHistoryItem } from '../services/api';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';

interface ChatWindowProps {
  tripId: number;
  destination: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ tripId, destination }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tripId) {
      loadHistory();
    }
  }, [tripId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await aiApi.getChatHistory(tripId);
      
      const formatted = data.reduce((acc: Array<{ role: 'user' | 'assistant'; text: string }>, item) => {
        acc.push({ role: 'user', text: item.message });
        acc.push({ role: 'assistant', text: item.response });
        return acc;
      }, []);
      
      if (formatted.length === 0) {
        // Add default greeting
        setMessages([
          { role: 'assistant', text: `Hi! I am your AI Travel Copilot. Ask me anything about your trip to ${destination}! For example: "What should I pack?" or "What should I do tonight?"` }
        ]);
      } else {
        setMessages(formatted);
      }
    } catch (err) {
      setError('Could not load chat history.');
      // Fallback default greeting
      setMessages([
        { role: 'assistant', text: `Welcome! Feel free to ask any travel questions about your trip to ${destination}.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setError('');
    
    // Optimistic UI update
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const result = await aiApi.chat(tripId, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', text: result.reply }]);
    } catch (err: any) {
      setError('Failed to send message. Please try again.');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I failed to generate a response. Please check your connection or try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl overflow-hidden shadow-xl flex flex-col h-[480px]">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-brand to-cyan-500 p-4 text-white flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm">AI Copilot Chat</h4>
          <p className="text-[10px] text-sky-100">In-context assistant for {destination}</p>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-neutral-950/20 scrollbar-hide">
        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-[10px] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
              msg.role === 'user'
                ? 'bg-brand text-white rounded-tr-none'
                : 'bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 border border-slate-150 dark:border-neutral-800/60 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-neutral-800 text-slate-500 rounded-2xl p-3 text-xs flex items-center gap-1.5 shadow-sm rounded-tl-none border border-slate-150 dark:border-neutral-800/60">
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-neutral-850 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask packing, dinner spots, weather tips..."
          className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand dark:text-white placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 bg-brand text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
