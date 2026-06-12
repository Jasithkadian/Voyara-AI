import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiApi } from '../services/api';
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

  const loadHistory = useCallback(async () => {
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
    } catch {
      setError('Could not load chat history.');
      // Fallback default greeting
      setMessages([
        { role: 'assistant', text: `Welcome! Feel free to ask any travel questions about your trip to ${destination}.` }
      ]);
    } finally {
      setLoading(false);
    }
  }, [tripId, destination]);

  useEffect(() => {
    let isMounted = true;
    if (tripId) {
      setTimeout(() => {
        if (isMounted) {
          loadHistory();
        }
      }, 0);
    }
    return () => {
      isMounted = false;
    };
  }, [tripId, loadHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
    } catch {
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
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-lg overflow-hidden shadow-xl flex flex-col h-[480px]">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary to-cyan-500 p-4 text-warmWhite flex items-center gap-2">
        <div className="w-9 h-9 rounded-md bg-warmWhite/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">AI Copilot Chat</h4>
          <p className="text-xs text-primary">In-context assistant for {destination}</p>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-warmWhite/50 dark:bg-dark-bg/20 scrollbar-hide">
        {error && (
          <div className="p-2 bg-coral dark:bg-coral/25 border border-coral dark:border-coral/50 rounded-md text-coral dark:text-coral text-xs flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`max-w-[85%] rounded-lg p-4 text-xs leading-relaxed shadow-sm ${
              msg.role === 'user'
                ? 'bg-primary text-warmWhite rounded-sm-tr-none'
                : 'bg-warmWhite dark:bg-dark-muted text-textPrimary dark:text-dark-text border border-stoneMuted dark:border-dark-border/60 rounded-sm-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-warmWhite dark:bg-dark-muted text-textSecondary rounded-lg p-4 text-xs flex items-center gap-2 shadow-sm rounded-sm-tl-none border border-stoneMuted dark:border-dark-border/60">
              <span className="w-1.5 h-1.5 bg-primary rounded-lg animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-lg animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-lg animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-stoneMuted/50 dark:border-dark-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask packing, dinner spots, weather tips..."
          className="flex-1 px-4 py-2 text-xs bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:text-dark-text placeholder:text-textSecondary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="p-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
