"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Paperclip, Send } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "me" | "them"
  time: string
}

interface Chat {
  id: string
  name: string
  avatar: string
  avatarColor: string
  lastMessage: string
  time: string
  unread: number
  messages: Message[]
}

const CHATS: Chat[] = [
  {
    id: "1", name: "Sarah", avatar: "S", avatarColor: "#007aff", lastMessage: "See you tomorrow!", time: "12:30 PM", unread: 1,
    messages: [
      { id: "1", text: "Hey! How are you?", sender: "them", time: "12:15 PM" },
      { id: "2", text: "I'm doing great! Just finished the project.", sender: "me", time: "12:20 PM" },
      { id: "3", text: "That's awesome! Want to grab coffee tomorrow?", sender: "them", time: "12:25 PM" },
      { id: "4", text: "Sure! How about 10am at the usual place?", sender: "me", time: "12:28 PM" },
      { id: "5", text: "See you tomorrow!", sender: "them", time: "12:30 PM" },
    ],
  },
  {
    id: "2", name: "Alex", avatar: "A", avatarColor: "#34c759", lastMessage: "Sent the files", time: "11:45 AM", unread: 0,
    messages: [
      { id: "1", text: "Can you send me the design files?", sender: "me", time: "11:30 AM" },
      { id: "2", text: "Sure, give me a moment", sender: "them", time: "11:35 AM" },
      { id: "3", text: "Sent the files", sender: "them", time: "11:45 AM" },
    ],
  },
  {
    id: "3", name: "Team Group", avatar: "T", avatarColor: "#ff9500", lastMessage: "Meeting at 3pm", time: "10:00 AM", unread: 3,
    messages: [
      { id: "1", text: "Meeting at 3pm", sender: "them", time: "10:00 AM" },
      { id: "2", text: "I'll be there!", sender: "me", time: "10:05 AM" },
      { id: "3", text: "Don't forget the presentation", sender: "them", time: "10:10 AM" },
    ],
  },
  {
    id: "4", name: "Mom", avatar: "M", avatarColor: "#ff3b30", lastMessage: "Love you!", time: "Yesterday", unread: 0,
    messages: [
      { id: "1", text: "Hi honey, how's everything going?", sender: "them", time: "8:00 PM" },
      { id: "2", text: "Everything's great, Mom! Really busy with work.", sender: "me", time: "8:15 PM" },
      { id: "3", text: "Remember to eat well! Love you!", sender: "them", time: "8:20 PM" },
      { id: "4", text: "Love you!", sender: "me", time: "8:22 PM" },
    ],
  },
]

export function MessagesApp() {
  const [chats, setChats] = useState(CHATS)
  const [activeChat, setActiveChat] = useState<string>("1")
  const [inputText, setInputText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentChat = chats.find((c) => c.id === activeChat)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentChat?.messages])

  const sendMessage = () => {
    if (!inputText.trim() || !activeChat) return
    const now = new Date()
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    const newMsg: Message = {
      id: String(Date.now()),
      text: inputText.trim(),
      sender: "me",
      time: timeStr,
    }
    setChats(chats.map((c) =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: inputText.trim(), time: timeStr }
        : c
    ))
    setInputText("")
  }

  const filteredChats = searchQuery
    ? chats.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats

  return (
    <div className="flex h-full" style={{ background: "#fff" }}>
      {/* Chat List */}
      <div className="flex w-56 flex-shrink-0 flex-col" style={{ background: "rgba(246,246,246,0.95)", borderRight: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-1.5 rounded-md bg-black/[0.04] px-2 py-1">
            <Search className="h-3 w-3 text-[#999]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent text-[12px] text-[#333] outline-none placeholder:text-[#bbb]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                activeChat === chat.id
                  ? "bg-[#0058d0] text-white"
                  : "hover:bg-black/[0.03] text-[#333]"
              }`}
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
                style={{ background: chat.avatarColor }}
              >
                {chat.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold truncate">{chat.name}</span>
                  <span className={`text-[10px] flex-shrink-0 ${activeChat === chat.id ? "text-white/50" : "text-[#999]"}`}>
                    {chat.time}
                  </span>
                </div>
                <div className={`text-[12px] truncate ${activeChat === chat.id ? "text-white/60" : "text-[#999]"}`}>
                  {chat.lastMessage}
                </div>
              </div>
              {chat.unread > 0 && activeChat !== chat.id && (
                <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#007aff] px-1.5 text-[10px] font-bold text-white">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex flex-1 flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: currentChat.avatarColor }}
              >
                {currentChat.avatar}
              </div>
              <span className="text-[14px] font-semibold text-[#333]">{currentChat.name}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {currentChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[70%]">
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${
                        msg.sender === "me"
                          ? "bg-[#007aff] text-white rounded-br-md"
                          : "bg-[#e9e9eb] text-[#333] rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className={`text-[10px] text-[#bbb] mt-0.5 ${msg.sender === "me" ? "text-right" : ""}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <button className="text-[#999] hover:text-[#666]" aria-label="Attach file">
                <Paperclip className="h-4 w-4" />
              </button>
              <div className="flex flex-1 items-center rounded-full bg-[#f0f0f0] px-3.5 py-1.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="iMessage"
                  className="flex-1 bg-transparent text-[13px] text-[#333] outline-none placeholder:text-[#bbb]"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  inputText.trim() ? "bg-[#007aff] text-white" : "bg-[#e5e5ea] text-[#bbb]"
                }`}
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[14px] text-[#bbb]">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  )
}
