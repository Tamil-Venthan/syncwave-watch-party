import React, { useState, useRef, useEffect } from 'react';
import { useParty } from '../context/PartyContext';
import { Avatar } from '../utils/avatar';
import { Send, Smile, Info, Flame, Heart, Sparkles } from 'lucide-react';

export const ChatPanel: React.FC = () => {
  const { messages, sendMessage, triggerReaction, currentUser } = useParty();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const QUICK_CHAT_EMOJIS = ['👋', '🔥', '❤️', '🍿', '😂', '🎉', '👏', '👀', '💯', '✨'];

  return (
    <div className="flex flex-col h-full bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Messages Header */}
      <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/40">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-neutral-100">Live Party Chat</span>
          <span className="text-xs text-neutral-500">· {messages.length} messages</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => triggerReaction('🔥')}
            className="p-1 text-xs hover:scale-125 transition-transform cursor-pointer"
            title="React Fire"
          >
            🔥
          </button>
          <button
            onClick={() => triggerReaction('🍿')}
            className="p-1 text-xs hover:scale-125 transition-transform cursor-pointer"
            title="React Popcorn"
          >
            🍿
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <Sparkles className="w-8 h-8 mb-2 text-rose-500/50" />
            <p className="text-sm font-medium text-neutral-400">The chat is quiet</p>
            <p className="text-xs text-neutral-600 mt-1">Say hello or react with popcorn to kick things off!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex items-center gap-2 justify-center my-2 text-[11px] text-neutral-500">
                  <div className="h-[1px] bg-neutral-800/80 flex-1" />
                  <span className="px-2 py-0.5 rounded-full bg-neutral-800/50 border border-neutral-800 text-neutral-400">
                    {msg.text}
                  </span>
                  <div className="h-[1px] bg-neutral-800/80 flex-1" />
                </div>
              );
            }

            const isMe = msg.senderId === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar config={msg.senderAvatar} size="xs" className="mt-0.5 shrink-0" />
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-neutral-500">
                    <span className="font-semibold text-neutral-300">{msg.senderName}</span>
                    <span>·</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs md:text-sm break-words leading-relaxed ${
                      isMe
                        ? 'bg-rose-600 text-white rounded-tr-xs shadow-md shadow-rose-900/20'
                        : 'bg-neutral-800 text-neutral-200 rounded-tl-xs border border-neutral-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Emoji Bar Popover */}
      {showEmojiPicker && (
        <div className="p-2 border-t border-neutral-800 bg-neutral-950/90 flex flex-wrap gap-1 items-center">
          {QUICK_CHAT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText((prev) => prev + emoji);
              }}
              className="w-7 h-7 flex items-center justify-center hover:bg-neutral-800 rounded-md transition-colors cursor-pointer text-sm"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2.5 md:p-3 border-t border-neutral-800/80 bg-neutral-900/60">
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute left-2.5 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer p-1"
            title="Insert emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or react..."
            maxLength={300}
            className="w-full pl-9 pr-10 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs md:text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500/80 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 p-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
