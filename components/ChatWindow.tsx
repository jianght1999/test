
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-400 animate-pulse' : 'bg-green-500'}`}></div>
          <h3 className="font-medium text-gray-200">智能索引分析</h3>
        </div>
        <i className="fa-solid fa-microchip text-white/20"></i>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center">
            <i className="fa-solid fa-comment-nodes text-3xl mb-4 opacity-20"></i>
            <p className="text-sm">上传图片后，我可以帮你分析其中的<br/>细节、文字、颜色或场景。</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm transition-all ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20' 
                : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-2xl rounded-tl-none px-5 py-4 flex gap-1.5 border border-white/5">
              <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-black/20 border-t border-white/10">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="关于图片你想知道什么？"
            className="w-full bg-white/5 border border-white/10 pl-5 pr-14 py-4 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:bg-gray-800 transition-all active:scale-90"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
