import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Paperclip, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ChatInterface = ({ sessionId, user, isDarkMode }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load history when session changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) {
        setMessages([]);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:8000/api/chat/history/${sessionId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    fetchHistory();
  }, [sessionId]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    
    // Add user message immediately
    const userMsg = { role: 'user', content: userText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:8000/chat', {
        user_id: user.id,
        session_id: sessionId,
        message: userText
      });
      
      const assistantMsg = { 
        role: 'assistant', 
        content: res.data.response,
        status: res.data.status,
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat failure:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error connecting to the server.',
        type: 'error' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input
    e.target.value = null;

    // Add immediate feedback
    const userMsg = { 
      role: 'user', 
      content: `Uploaded prescription: ${file.name}`, 
      type: 'image',
      timestamp: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.id);
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    try {
      const res = await axios.post('http://localhost:8000/agent/upload_prescription', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const assistantMsg = { 
        role: 'assistant', 
        content: res.data.response || res.data.message || 'Prescription uploaded successfully.',
        status: res.data.status || 'pending_approval',
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Upload failure:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, failed to upload prescription.',
        type: 'error' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageBubble = (msg, index) => {
    const isUser = msg.role === 'user';
    
    // Determine the base styles based on type and role
    let bubbleClass = isUser 
      ? 'bg-blue-600 text-white' 
      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm';
      
    if (msg.type === 'error') {
      bubbleClass = 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50';
    } else if (msg.type === 'warning' || msg.status === 'needs_prescription') {
      bubbleClass = 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50';
    }

    return (
      <div key={`msg-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${bubbleClass}`}>
          {/* Status Icon Header for special messages */}
          {!isUser && msg.status === 'pending_approval' && (
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-medium text-sm">
              <Clock size={16} /> Pending Review
            </div>
          )}
          {!isUser && msg.status === 'added_to_cart' && (
            <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
              <CheckCircle size={16} /> Added to Cart
            </div>
          )}
          {!isUser && msg.status === 'needs_prescription' && (
            <div className="flex items-center gap-2 mb-2 font-medium text-sm">
              <AlertTriangle size={16} /> Prescription Required
            </div>
          )}

          {/* Content */}
          <div className="whitespace-pre-wrap">{msg.content}</div>

          {/* Custom Widgets based on Status */}
          {!isUser && msg.status === 'pending_confirmation' && (
            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
                Confirm Order
              </button>
              <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FB] dark:bg-slate-900 transition-colors">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Welcome to MedAssist AI
            </h3>
            <p className="text-sm dark:text-slate-400">
              I can help you find medicines, check availability, answer pharmacy-related questions, and process your orders. How can I assist you today?
            </p>
          </div>
        ) : (
          messages.map(renderMessageBubble)
        )}
        
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-1 shadow-sm">
              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form 
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto relative flex items-center bg-[#F8F9FB] dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200 dark:border-slate-700/50 shadow-sm focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-colors"
        >
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
            title="Upload Prescription"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="hidden" 
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about medications or request refills..."
            className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className={`p-3 rounded-xl transition-colors shrink-0 ${
              inputValue.trim() && !isTyping
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} className={inputValue.trim() && !isTyping ? 'ml-0.5' : ''} />
          </button>
        </form>
        <div className="text-center mt-2 text-xs text-slate-400">
          AI can make mistakes. Check important information with your doctor.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
