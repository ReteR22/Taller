import { create } from 'zustand'

export interface VehicleContext {
  brand:      string
  model:      string
  year?:      number
  engineType?: string
  fuelType?:  string
  mileage?:   number
  symptoms?:  string
}

export interface Tag {
  tag: { id: string; name: string; color: string }
}

export interface Message {
  id:          string
  role:        'USER' | 'ASSISTANT' | 'SYSTEM'
  content:     string
  createdAt:   string
  tokens?:     number
  ragSources?: { title: string; documentId: string }[]
}

export interface Chat {
  id:             string
  title:          string
  vehicleContext?: VehicleContext
  folderId?:      string
  folder?:        { id: string; name: string; color?: string }
  tags:           Tag[]
  messages:       Message[]
  totalTokens:    number
  updatedAt:      string
  _count?:        { messages: number }
}

export interface Folder {
  id:        string
  name:      string
  color?:    string
  _count?:   { chats: number }
}

interface ChatStore {
  // State
  chats:           Chat[]
  activeChat:      Chat | null
  folders:         Folder[]
  isStreaming:     boolean
  streamingContent:string
  isLoadingChats:  boolean

  // Actions
  setChats:        (chats: Chat[])   => void
  setFolders:      (folders: Folder[]) => void
  setActiveChat:   (chat: Chat | null) => void
  addChat:         (chat: Chat)      => void
  removeChat:      (chatId: string)  => void
  addMessage:      (chatId: string, message: Message) => void
  appendDelta:     (delta: string)   => void
  finalizeStream:  (chatId: string, content: string, ragSources?: any[]) => void
  resetStream:     () => void
  setLoadingChats: (v: boolean) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats:            [],
  activeChat:       null,
  folders:          [],
  isStreaming:      false,
  streamingContent: '',
  isLoadingChats:   false,

  setChats:        chats   => set({ chats }),
  setFolders:      folders => set({ folders }),
  setActiveChat:   chat    => set({ activeChat: chat }),
  setLoadingChats: v       => set({ isLoadingChats: v }),

  addChat: chat => set(s => ({
    chats: [chat, ...s.chats],
    activeChat: chat,
  })),

  removeChat: chatId => set(s => ({
    chats:      s.chats.filter(c => c.id !== chatId),
    activeChat: s.activeChat?.id === chatId ? null : s.activeChat,
  })),

  addMessage: (chatId, message) => set(s => {
    const update = (c: Chat): Chat => ({
      ...c,
      messages: [...c.messages, message],
    })
    return {
      chats:      s.chats.map(c => c.id === chatId ? update(c) : c),
      activeChat: s.activeChat?.id === chatId ? update(s.activeChat) : s.activeChat,
    }
  }),

  appendDelta: delta => set(s => ({
    isStreaming:      true,
    streamingContent: s.streamingContent + delta,
  })),

  finalizeStream: (chatId, content, ragSources) => {
    const message: Message = {
      id:         crypto.randomUUID(),
      role:       'ASSISTANT',
      content,
      createdAt:  new Date().toISOString(),
      ragSources,
    }
    get().addMessage(chatId, message)
    set({ isStreaming: false, streamingContent: '' })
  },

  resetStream: () => set({ isStreaming: false, streamingContent: '' }),
}))
