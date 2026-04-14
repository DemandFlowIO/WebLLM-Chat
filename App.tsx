import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Role, Attachment, ModelConfig, Conversation } from './types';
import { streamGeminiResponse, initLocalModel, AVAILABLE_MODELS, resetEngine } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { 
  Bot, Cpu, Download, AlertCircle, Check, Zap, Shield, HardDrive, 
  Plus, MessageSquare, Settings, Trash2, Menu, X, ChevronLeft, ChevronRight,
  Share2, DownloadCloud, Maximize2, Edit3, Search, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'webllm_chat_v1';

const App: React.FC = () => {
  // --- State ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initStatus, setInitStatus] = useState<string>("");
  const [isModelReady, setIsModelReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [isInitializingStarted, setIsInitializingStarted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Derived State ---
  const activeConversation = useMemo(() => 
    conversations.find(c => c.id === activeId) || null
  , [conversations, activeId]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [conversations, searchQuery]);

  // --- Effects ---
  
  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed.conversations || []);
        setActiveId(parsed.activeId || null);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeId }));
    }
  }, [conversations, activeId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  // --- Handlers ---

  const createNewChat = () => {
    const newChat: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      modelId: selectedModel?.id || AVAILABLE_MODELS[0].id,
      createdAt: Date.now(),
      systemPrompt: "You are a helpful AI assistant running locally in the browser via WebLLM."
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveId(newChat.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  const startModel = async (model: ModelConfig) => {
    setSelectedModel(model);
    setIsInitializingStarted(true);
    setInitStatus("Initializing WebGPU...");
    try {
      await initLocalModel(model, (progress) => {
        setInitStatus(progress);
      });
      setIsModelReady(true);
      setInitStatus("");
      if (!activeId) {
        createNewChat();
      }
    } catch (err: any) {
      setInitError(err.message || "Failed to load model. WebGPU might not be supported.");
    }
  };

  const switchModel = async () => {
    setIsLoading(true);
    try {
      await resetEngine();
      setIsModelReady(false);
      setIsInitializingStarted(false);
      setSelectedModel(null);
    } catch (err) {
      console.error("Failed to reset engine", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSend = async (text: string, attachment?: Attachment) => {
    if (!isModelReady || !activeId) return;

    const timestamp = Date.now();
    const newMessageId = `msg-${timestamp}`;
    
    const userMessage: Message = {
      id: newMessageId,
      role: Role.User,
      text: text,
      attachment: attachment,
      timestamp: timestamp,
    };

    if (attachment && !attachment.base64) {
      try {
        const base64 = await fileToBase64(attachment.file);
        userMessage.attachment = { ...attachment, base64 };
      } catch (error) {
        console.error("Failed to process image", error);
      }
    }

    // Update title if it's the first message
    let updatedConversations = conversations.map(c => {
      if (c.id === activeId) {
        const newMessages = [...c.messages, userMessage];
        const newTitle = c.messages.length === 0 ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : c.title;
        return { ...c, messages: newMessages, title: newTitle };
      }
      return c;
    });
    setConversations(updatedConversations);
    setIsLoading(true);

    const assistantMessageId = `msg-${timestamp + 1}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: Role.Model,
      text: '',
      timestamp: timestamp + 1,
    };
    
    setConversations(prev => prev.map(c => 
      c.id === activeId ? { ...c, messages: [...c.messages, initialAssistantMessage] } : c
    ));

    abortControllerRef.current = new AbortController();

    try {
      const currentConv = updatedConversations.find(c => c.id === activeId)!;
      const stream = streamGeminiResponse(
        currentConv.messages.slice(0, -1), 
        text, 
        currentConv.systemPrompt,
        userMessage.attachment,
        abortControllerRef.current.signal
      );
      
      let fullResponseText = '';

      for await (const chunk of stream) {
        fullResponseText += chunk;
        setConversations(prev => prev.map(c => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === assistantMessageId ? { ...m, text: fullResponseText } : m)
            };
          }
          return c;
        }));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Generation error:", error);
      setConversations(prev => prev.map(c => {
        if (c.id === activeId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === assistantMessageId ? { 
              ...m, 
              text: "Error generating response. Ensure your browser supports WebGPU.",
              isError: true 
            } : m)
          };
        }
        return c;
      }));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const updateSystemPrompt = (prompt: string) => {
    setConversations(prev => prev.map(c => 
      c.id === activeId ? { ...c, systemPrompt: prompt } : c
    ));
  };

  // --- Render Helpers ---

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1117] text-white p-8">
        <div className="max-w-md text-center">
          <div className="inline-flex p-4 bg-red-900/30 text-red-500 rounded-full mb-4">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Initialization Failed</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            Retry Initialization
          </button>
        </div>
      </div>
    );
  }

  if (!isInitializingStarted) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl w-full"
        >
          <div className="text-center mb-16">
            <div className="bg-indigo-600/20 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-indigo-500 shadow-2xl shadow-indigo-500/10">
              <Bot size={48} />
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tight">WebLLM Chat</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Experience private, local AI running entirely in your browser. 
              No data ever leaves your device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AVAILABLE_MODELS.map((model, idx) => (
              <motion.button
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => startModel(model)}
                className="group relative bg-[#161b22] border border-[#30363d] rounded-[2rem] p-8 text-left hover:border-indigo-500/50 hover:bg-[#1c2128] transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5"
              >
                <div className="mb-6 flex justify-between items-start">
                  <div className="p-4 rounded-2xl bg-[#0d1117] group-hover:bg-indigo-600/10 text-gray-400 group-hover:text-indigo-500 transition-all">
                    {model.id.includes('gemma') ? <Zap size={28} /> : model.id.includes('Llama') ? <Shield size={28} /> : <Bot size={28} />}
                  </div>
                  <div className="text-xs font-black px-3 py-1.5 bg-[#21262d] rounded-full text-gray-400 uppercase tracking-widest">
                    {model.size}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">{model.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">{model.description}</p>
                <div className="mt-auto pt-6 border-t border-[#30363d] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <HardDrive size={14} />
                    {model.vram}MB VRAM
                  </div>
                  <div className="bg-indigo-600 text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <Check size={18} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-16 p-8 bg-indigo-600/5 rounded-[2.5rem] border border-indigo-500/10 flex items-start gap-6 max-w-3xl mx-auto">
            <div className="p-3 bg-indigo-600/10 rounded-2xl text-indigo-500 mt-1">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2">System Requirements</h4>
              <p className="text-gray-400 leading-relaxed">
                WebLLM uses WebGPU to run models on your graphics card. 
                Please use <strong>Chrome 113+</strong> or <strong>Edge 113+</strong>. 
                The first download will be cached locally for future use.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0d1117] text-gray-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="fixed md:relative z-30 h-full bg-[#0d1117] border-r border-[#30363d] overflow-hidden"
          >
            <div className="flex flex-col h-full w-72">
              <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Bot className="text-indigo-500" />
                  <span>WebLLM Chat</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-[#21262d] rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <button 
                  onClick={createNewChat}
                  className="w-full flex items-center gap-2 justify-center bg-[#21262d] hover:bg-[#30363d] text-white py-3 rounded-xl font-bold transition-all border border-[#30363d]"
                >
                  <Plus size={18} />
                  New Chat
                </button>

                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                {filteredConversations.map(conv => (
                  <div 
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`
                      group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all
                      ${activeId === conv.id ? 'bg-[#21262d] text-white border border-[#30363d]' : 'hover:bg-[#161b22] text-gray-400'}
                    `}
                  >
                    <MessageSquare size={18} className={activeId === conv.id ? 'text-indigo-500' : ''} />
                    <span className="flex-1 truncate text-sm font-medium">{conv.title}</span>
                    <button 
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {filteredConversations.length === 0 && searchQuery && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No conversations found
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[#30363d]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                    U
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">Local User</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">WebGPU Active</p>
                  </div>
                  <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400">
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-[#0d1117]">
        
        {/* Header */}
        <header className="h-16 border-b border-[#30363d] flex items-center justify-between px-4 md:px-6 bg-[#0d1117]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400">
                <Menu size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-md">
                {activeConversation?.title || 'Select a conversation'}
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                {selectedModel?.name} • {isModelReady ? 'Ready' : 'Initializing'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={switchModel}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] rounded-lg text-xs font-bold text-gray-400 transition-all border border-[#30363d]"
              title="Switch Model"
            >
              <RefreshCw size={14} />
              Switch Model
            </button>
            <div className="h-4 w-[1px] bg-[#30363d] mx-1 hidden md:block"></div>
            <button className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400" title="Fullscreen">
              <Maximize2 size={18} />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth">
          {!isModelReady && (
             <div className="absolute inset-0 z-40 bg-[#0d1117]/90 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                  <Download size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Downloading {selectedModel?.name}</h3>
                <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                  Caching model weights to your browser. This will only happen once.
                </p>
                <div className="w-full max-w-sm bg-[#21262d] rounded-full h-2 mb-4 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-300 w-full animate-pulse"></div>
                </div>
                <p className="text-xs font-mono text-gray-500 truncate max-w-xs">
                  {initStatus || "Preparing WebGPU..."}
                </p>
             </div>
          )}

          <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
            {activeConversation?.messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8"
              >
                <div className="bg-[#161b22] p-8 rounded-[3rem] border border-[#30363d] shadow-2xl">
                  <Bot size={64} className="text-indigo-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-black mb-4">Hello! I'm {selectedModel?.name}</h2>
                  <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                    I am running entirely on your computer. You can ask me anything, 
                    and your data will never leave this browser session.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  {[
                    "Explain quantum computing in simple terms",
                    "Write a Python script to scrape a website",
                    "How do I make a perfect sourdough bread?",
                    "What are the best practices for React hooks?"
                  ].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(suggestion)}
                      className="p-4 bg-[#161b22] border border-[#30363d] rounded-2xl text-sm text-gray-400 hover:border-indigo-500/50 hover:text-white transition-all text-left"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {activeConversation?.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} className="h-32" />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        {activeId && (
          <div className="p-4 md:p-6 bg-gradient-to-t from-[#0d1117] via-[#0d1117] to-transparent">
            <div className="max-w-4xl mx-auto">
              <div className="relative group">
                <InputArea 
                  onSend={handleSend} 
                  onStop={handleStop}
                  isLoading={isLoading || !isModelReady} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#161b22] border border-[#30363d] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
                <div className="flex items-center gap-3 font-bold text-xl">
                  <Settings className="text-indigo-500" />
                  <span>Settings</span>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Edit3 size={20} className="text-indigo-500" />
                    <h3 className="font-bold text-lg">System Prompt</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    Define the behavior and persona of the AI. This will be applied to the current conversation.
                  </p>
                  <textarea 
                    value={activeConversation?.systemPrompt || ""}
                    onChange={(e) => updateSystemPrompt(e.target.value)}
                    className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Enter system instructions..."
                  />
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu size={20} className="text-indigo-500" />
                    <h3 className="font-bold text-lg">Model Information</h3>
                  </div>
                  <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Active Model</span>
                      <span className="text-sm font-bold text-indigo-400">{selectedModel?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">VRAM Usage</span>
                      <span className="text-sm font-bold text-gray-300">{selectedModel?.vram} MB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Model Size</span>
                      <span className="text-sm font-bold text-gray-300">{selectedModel?.size}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Trash2 size={20} className="text-red-500" />
                    <h3 className="font-bold text-lg">Danger Zone</h3>
                  </div>
                  <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                    <p className="text-sm text-gray-400 mb-4">
                      This will permanently delete all your conversations and history. This action cannot be undone.
                    </p>
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to delete ALL conversations?")) {
                          setConversations([]);
                          setActiveId(null);
                          localStorage.removeItem(STORAGE_KEY);
                          setShowSettings(false);
                        }
                      }}
                      className="w-full py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all"
                    >
                      Clear All Conversations
                    </button>
                  </div>
                </section>
              </div>

              <div className="p-6 bg-[#0d1117] border-t border-[#30363d] flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;