import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plus,
  Search,
  Folder,
  Tag,
  Car,
  Send,
  Loader2,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { apiClient } from "@/services/api";
import { useChatStore, type Chat, type Message } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";

// ── New Chat Modal ─────────────────────────────────────────
function NewChatModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (chat: Chat) => void;
}) {
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const payload: any = { title };
      if (brand && model) {
        payload.vehicleContext = {
          brand,
          model,
          year: year ? parseInt(year) : undefined,
        };
      }
      const { data } = await apiClient.post("/ai/chats", payload);
      onCreated(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="card-raised p-6 w-full max-w-md shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-5">Nueva Conversación</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
              Título *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Diagnóstico Toyota Corolla — P0300"
              className="input-base"
              required
            />
          </div>
          <p className="text-xs text-white/30 font-medium">
            Contexto del vehículo (opcional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Marca
              </label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Toyota"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Modelo
              </label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Corolla"
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Año</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              type="number"
              placeholder="2020"
              className="input-base"
              min={1980}
              max={2030}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Crear
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Chat Message ───────────────────────────────────────────
function ChatMsg({
  msg,
  isStreaming,
}: {
  msg: Message;
  isStreaming?: boolean;
}) {
  const isUser = msg.role === "USER";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 px-3 py-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 
        ${isUser ? "bg-info/20" : "bg-primary/15"}`}
      >
        {isUser ? (
          <span className="text-[10px] font-bold text-info">TÚ</span>
        ) : (
          <Sparkles size={12} className="text-primary" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[82%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${
            isUser
              ? "bg-gradient-to-br from-info to-info-dark text-white rounded-tr-sm"
              : "bg-surface-overlay text-white/90 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="prose-mechpro">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
          {isStreaming && (
            <motion.span
              className="inline-block w-0.5 h-4 bg-primary ml-1 align-middle"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </div>

        {/* RAG sources */}
        {!isUser && msg.ragSources && msg.ragSources.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-1.5 flex-wrap"
          >
            <BookOpen size={11} className="text-gold/50" />
            {msg.ragSources.map((s, i) => (
              <span
                key={i}
                className="text-[10px] text-gold/60 bg-gold/8 border border-gold/15 px-2 py-0.5 rounded-full"
              >
                {s.title}
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main AI Page ───────────────────────────────────────────
export function AIAssistant() {
  const { user } = useAuthStore();
  const {
    chats,
    activeChat,
    isStreaming,
    streamingContent,
    setChats,
    setActiveChat,
    addChat,
    addMessage,
    appendDelta,
    finalizeStream,
    resetStream,
  } = useChatStore();

  const [showNewChat, setShowNewChat] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chats on mount
  useEffect(() => {
    if (!user) return;
    apiClient
      .get("/ai/chats")
      .then((r) => setChats(r.data))
      .catch(console.error);
  }, [user]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

  async function loadChat(chat: Chat) {
    try {
      const { data } = await apiClient.get(`/ai/chats/${chat.id}`);
      setActiveChat(data);
    } catch {
      setActiveChat(chat);
    }
  }

  async function handleSend() {
    if (!input.trim() || !activeChat || isStreaming || isLoading) return;
    const content = input.trim();
    setInput("");

    // Agregar mensaje del usuario al store
    addMessage(activeChat.id, {
      id: crypto.randomUUID(),
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    });
    setIsLoading(true);

    try {
      const token = localStorage.getItem("mechpro-auth")
        ? JSON.parse(localStorage.getItem("mechpro-auth")!).state?.token
        : null;

      const response = await fetch(`/api/ai/chats/${activeChat.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.body) throw new Error("No stream");
      setIsLoading(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "delta") {
              fullContent += data.content;
              appendDelta(data.content);
            }
            if (data.type === "done") {
              finalizeStream(activeChat.id, fullContent);
            }
            if (data.type === "error") {
              resetStream();
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      resetStream();
    }
  }

  const filteredChats = chats.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.vehicleContext?.brand.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            onClose={() => setShowNewChat(false)}
            onCreated={(chat) => {
              addChat(chat);
              setShowNewChat(false);
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex h-[calc(100vh-112px)] gap-4">
        {/* ── Sidebar ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-72 flex flex-col gap-3 flex-shrink-0"
        >
          <button
            onClick={() => setShowNewChat(true)}
            className="btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Plus size={15} /> Nueva Conversación
          </button>

          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversaciones…"
              className="input-base pl-8 text-xs py-2"
            />
          </div>

          <div className="card flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 py-1.5 flex items-center gap-2">
              <Folder size={11} /> Conversaciones
            </p>

            <AnimatePresence>
              {filteredChats.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-white/25 text-center py-8 px-4"
                >
                  No hay conversaciones aún. ¡Creá una nueva!
                </motion.p>
              )}
              {filteredChats.map((chat) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => loadChat(chat)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all duration-150
                    ${
                      activeChat?.id === chat.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-white/[0.04] border border-transparent"
                    }`}
                >
                  <p
                    className={`text-xs font-semibold leading-snug line-clamp-1 ${activeChat?.id === chat.id ? "text-white" : "text-white/70"}`}
                  >
                    {chat.title}
                  </p>
                  {chat.vehicleContext && (
                    <div className="flex items-center gap-1 mt-1">
                      <Car size={10} className="text-white/25" />
                      <span className="text-[10px] text-white/35">
                        {chat.vehicleContext.brand} {chat.vehicleContext.model}
                        {chat.vehicleContext.year &&
                          ` ${chat.vehicleContext.year}`}
                      </span>
                    </div>
                  )}
                  {chat.tags && chat.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {chat.tags.slice(0, 3).map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium"
                          style={{
                            color: tag.color,
                            borderColor: `${tag.color}40`,
                            background: `${tag.color}15`,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Chat Window ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 card flex flex-col overflow-hidden"
        >
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {activeChat.title}
                  </p>
                  <p className="text-xs text-white/35">
                    {activeChat.vehicleContext
                      ? `${activeChat.vehicleContext.brand} ${activeChat.vehicleContext.model} · MechPro AI`
                      : "MechPro AI · Asistente Mecánico"}
                  </p>
                </div>
                {activeChat.tags && activeChat.tags.length > 0 && (
                  <div className="flex gap-1.5">
                    {activeChat.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="badge text-[10px]"
                        style={{
                          color: tag.color,
                          borderColor: `${tag.color}40`,
                          background: `${tag.color}15`,
                        }}
                      >
                        <Tag size={8} /> {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-3">
                {activeChat.messages.length === 0 && !isStreaming && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                      <Sparkles size={24} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-base mb-2">
                      Asistente MechPro AI
                    </h3>
                    <p className="text-sm text-white/40 max-w-xs">
                      Describí el problema, el síntoma o hacé una consulta
                      técnica. La IA buscará en manuales y procedimientos para
                      darte una respuesta precisa.
                    </p>
                    {activeChat.vehicleContext && (
                      <div className="mt-4 px-4 py-2.5 bg-info/8 border border-info/20 rounded-xl flex items-center gap-2 text-sm text-info/80">
                        <Car size={14} />
                        Contexto: {activeChat.vehicleContext.brand}{" "}
                        {activeChat.vehicleContext.model}
                        {activeChat.vehicleContext.year &&
                          ` ${activeChat.vehicleContext.year}`}
                      </div>
                    )}
                  </div>
                )}

                {activeChat.messages.map((msg, i) => (
                  <ChatMsg key={msg.id ?? i} msg={msg} />
                ))}

                {/* Typing indicator */}
                {isLoading && !isStreaming && (
                  <div className="flex gap-3 px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={12} className="text-primary" />
                    </div>
                    <div className="bg-surface-overlay rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary/60"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: d,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Streaming bubble */}
                {isStreaming && streamingContent && (
                  <ChatMsg
                    msg={{
                      id: "streaming",
                      role: "ASSISTANT",
                      content: streamingContent,
                      createdAt: "",
                    }}
                    isStreaming
                  />
                )}

                <div ref={messagesEnd} />
              </div>

              {/* RAG indicator */}
              <div className="px-4 py-2 bg-gold/[0.04] border-t border-gold/10 flex items-center gap-2">
                <BookOpen size={11} className="text-gold/50" />
                <span className="text-[11px] text-gold/50">
                  RAG activo · Manuales técnicos indexados
                </span>
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-white/[0.06]">
                <div className="flex gap-2.5 bg-surface-overlay border border-white/[0.08] rounded-xl p-2 pl-4 focus-within:border-white/20 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Describí el síntoma o hacé tu consulta técnica… (Enter para enviar, Shift+Enter nueva línea)"
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none resize-none leading-relaxed max-h-36 min-h-[44px]"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isStreaming || isLoading}
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all
                      ${
                        input.trim() && !isStreaming && !isLoading
                          ? "bg-gradient-to-br from-primary to-primary-dark shadow-glow-red hover:shadow-none"
                          : "bg-white/[0.06] text-white/20"
                      }`}
                  >
                    {isLoading || isStreaming ? (
                      <Loader2 size={16} className="animate-spin text-white" />
                    ) : (
                      <Send
                        size={16}
                        className={input.trim() ? "text-white" : ""}
                      />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-white/20 mt-2 text-center">
                  MechPro AI usa RAG para fundamentar respuestas en
                  documentación técnica oficial
                </p>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center mb-5 border border-primary/20"
              >
                <Sparkles size={32} className="text-primary" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2">MechPro AI</h2>
              <p className="text-sm text-white/40 max-w-sm mb-6">
                Tu asistente inteligente especializado en diagnóstico y
                reparación automotriz. Seleccioná una conversación o creá una
                nueva para empezar.
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={15} /> Nueva Conversación
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
