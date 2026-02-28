"use client"

import { useState } from "react"
import { Star, Paperclip, Reply, Trash2, Archive, ChevronDown, Search, Inbox, Send, File, AlertCircle } from "lucide-react"

interface Email {
  id: string
  from: string
  fromEmail: string
  subject: string
  preview: string
  body: string
  date: string
  read: boolean
  starred: boolean
  hasAttachment: boolean
  avatar: string
}

const EMAILS: Email[] = [
  {
    id: "1", from: "Sarah Johnson", fromEmail: "sarah@company.com",
    subject: "Q1 Report Review", preview: "Hi, I've attached the Q1 report for your review. Please take a look...",
    body: "Hi,\n\nI've attached the Q1 report for your review. Please take a look at the revenue projections on page 5 and let me know your thoughts.\n\nWe should discuss this before the board meeting next week.\n\nBest regards,\nSarah",
    date: "10:32 AM", read: false, starred: true, hasAttachment: true, avatar: "SJ",
  },
  {
    id: "2", from: "GitHub", fromEmail: "noreply@github.com",
    subject: "[repo] Pull Request #142 merged", preview: "Your pull request 'Fix navigation bug' has been successfully merged...",
    body: "Your pull request 'Fix navigation bug' has been successfully merged into the main branch.\n\nMerged by: @teammate\n\nFiles changed: 3\nAdditions: +42\nDeletions: -18\n\nView the full diff on GitHub.",
    date: "9:15 AM", read: true, starred: false, hasAttachment: false, avatar: "GH",
  },
  {
    id: "3", from: "Alex Chen", fromEmail: "alex@startup.io",
    subject: "Design System Update", preview: "Hey! Just pushed the new design tokens to the repo. The color palette...",
    body: "Hey!\n\nJust pushed the new design tokens to the repo. The color palette has been updated to match the latest brand guidelines.\n\nKey changes:\n- Primary blue shifted to #0066FF\n- New semantic color tokens\n- Updated spacing scale\n- Added dark mode variants\n\nLet me know if anything looks off!\n\nCheers,\nAlex",
    date: "Yesterday", read: false, starred: false, hasAttachment: false, avatar: "AC",
  },
  {
    id: "4", from: "Vercel", fromEmail: "notifications@vercel.com",
    subject: "Deployment successful", preview: "Your project 'my-app' has been deployed successfully to production...",
    body: "Your project 'my-app' has been deployed successfully to production.\n\nDeployment URL: https://my-app.vercel.app\nBranch: main\nCommit: abc1234\nBuild Duration: 45s\n\nView deployment details in your dashboard.",
    date: "Yesterday", read: true, starred: false, hasAttachment: false, avatar: "V",
  },
  {
    id: "5", from: "Maya Williams", fromEmail: "maya@design.co",
    subject: "Logo concepts ready", preview: "I've completed 3 logo variations for the new brand identity. Attached are...",
    body: "I've completed 3 logo variations for the new brand identity. Attached are high-res files in SVG and PNG formats.\n\nConcept A: Modern geometric approach\nConcept B: Organic flowing design\nConcept C: Minimal wordmark\n\nI'd recommend we go with Concept A as it aligns best with your tech-forward positioning.\n\nLet me know which direction you'd like to explore further.\n\nMaya",
    date: "Mon", read: true, starred: true, hasAttachment: true, avatar: "MW",
  },
  {
    id: "6", from: "Newsletter", fromEmail: "digest@technews.com",
    subject: "This Week in Tech - AI Updates", preview: "New GPT models, Apple's latest announcements, and more...",
    body: "This Week in Tech\n\n1. New AI models are breaking benchmarks across multiple tasks\n2. Apple announces new MacBook Pro lineup\n3. Web platform gains new CSS features\n4. Open source project of the week\n5. Developer tools roundup\n\nRead the full newsletter at technews.com",
    date: "Mon", read: true, starred: false, hasAttachment: false, avatar: "TN",
  },
]

const MAILBOXES = [
  { name: "Inbox", icon: <Inbox className="h-4 w-4" />, count: 2, color: "#007aff" },
  { name: "Sent", icon: <Send className="h-4 w-4" />, count: 0, color: "#34c759" },
  { name: "Drafts", icon: <File className="h-4 w-4" />, count: 1, color: "#ff9500" },
  { name: "Junk", icon: <AlertCircle className="h-4 w-4" />, count: 0, color: "#8e8e93" },
  { name: "Trash", icon: <Trash2 className="h-4 w-4" />, count: 0, color: "#8e8e93" },
]

export function MailApp() {
  const [activeMailbox, setActiveMailbox] = useState("Inbox")
  const [selectedEmail, setSelectedEmail] = useState<Email>(EMAILS[0])
  const [emails, setEmails] = useState(EMAILS)
  const [searchQuery, setSearchQuery] = useState("")

  const toggleStar = (id: string) => {
    setEmails(emails.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)))
  }

  const markRead = (id: string) => {
    setEmails(emails.map((e) => (e.id === id ? { ...e, read: true } : e)))
  }

  const filtered = searchQuery
    ? emails.filter((e) => e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || e.from.toLowerCase().includes(searchQuery.toLowerCase()))
    : emails

  return (
    <div className="flex h-full" style={{ background: "#fff" }}>
      {/* Sidebar */}
      <div className="flex w-44 flex-shrink-0 flex-col p-2" style={{ background: "rgba(246,246,246,0.95)", borderRight: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#999]">
          Mailboxes
        </div>
        {MAILBOXES.map((mb) => (
          <button
            key={mb.name}
            onClick={() => setActiveMailbox(mb.name)}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
              activeMailbox === mb.name ? "bg-[#0058d0] text-white" : "text-[#333] hover:bg-black/5"
            }`}
          >
            <span className={activeMailbox === mb.name ? "text-white" : ""} style={{ color: activeMailbox === mb.name ? "white" : mb.color }}>
              {mb.icon}
            </span>
            <span className="flex-1">{mb.name}</span>
            {mb.count > 0 && (
              <span className={`text-[11px] ${activeMailbox === mb.name ? "text-white/70" : "text-[#007aff]"}`}>
                {mb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Email List */}
      <div className="flex w-64 flex-shrink-0 flex-col" style={{ borderRight: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex flex-1 items-center gap-1.5 rounded-md bg-black/[0.04] px-2 py-1">
            <Search className="h-3 w-3 text-[#999]" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-[#333] outline-none placeholder:text-[#bbb]"
            />
          </div>
          <button className="text-[#999] hover:text-[#666]">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.map((email) => (
            <button
              key={email.id}
              onClick={() => { setSelectedEmail(email); markRead(email.id) }}
              className={`w-full text-left px-3 py-2.5 transition-colors ${
                selectedEmail.id === email.id
                  ? "bg-[#0058d0] text-white"
                  : "hover:bg-black/[0.03] text-[#333]"
              }`}
              style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center gap-2">
                {!email.read && selectedEmail.id !== email.id && (
                  <div className="h-2 w-2 rounded-full bg-[#007aff] flex-shrink-0" />
                )}
                <span className={`flex-1 text-[13px] truncate ${!email.read ? "font-semibold" : "font-medium"}`}>
                  {email.from}
                </span>
                <span className={`text-[11px] flex-shrink-0 ${selectedEmail.id === email.id ? "text-white/60" : "text-[#999]"}`}>
                  {email.date}
                </span>
              </div>
              <div className={`text-[12px] truncate mt-0.5 ${selectedEmail.id === email.id ? "text-white/90" : !email.read ? "font-medium text-[#333]" : "text-[#333]"}`}>
                {email.subject}
              </div>
              <div className={`text-[11px] truncate mt-0.5 ${selectedEmail.id === email.id ? "text-white/50" : "text-[#999]"}`}>
                {email.preview}
              </div>
              <div className="mt-1 flex items-center gap-1">
                {email.hasAttachment && (
                  <Paperclip className={`h-3 w-3 ${selectedEmail.id === email.id ? "text-white/40" : "text-[#bbb]"}`} />
                )}
                {email.starred && (
                  <Star className={`h-3 w-3 ${selectedEmail.id === email.id ? "text-yellow-300 fill-yellow-300" : "text-yellow-400 fill-yellow-400"}`} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedEmail ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <button className="rounded-md p-1.5 text-[#666] hover:bg-black/5" aria-label="Reply">
                <Reply className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1.5 text-[#666] hover:bg-black/5" aria-label="Archive">
                <Archive className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1.5 text-[#666] hover:bg-black/5" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex-1" />
              <button onClick={() => toggleStar(selectedEmail.id)} aria-label="Star email">
                <Star className={`h-4 w-4 ${selectedEmail.starred ? "fill-yellow-400 text-yellow-400" : "text-[#ccc]"}`} />
              </button>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-auto p-5">
              <h2 className="text-[20px] font-semibold text-[#333]">{selectedEmail.subject}</h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[12px] font-bold text-white">
                  {selectedEmail.avatar}
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[#333]">{selectedEmail.from}</div>
                  <div className="text-[12px] text-[#999]">{selectedEmail.fromEmail}</div>
                </div>
                <div className="flex-1" />
                <span className="text-[12px] text-[#999]">{selectedEmail.date}</span>
              </div>
              {selectedEmail.hasAttachment && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e5e5ea] p-2.5">
                  <Paperclip className="h-4 w-4 text-[#999]" />
                  <span className="text-[12px] text-[#666]">1 attachment</span>
                </div>
              )}
              <div className="mt-5 whitespace-pre-wrap text-[14px] leading-relaxed text-[#444]">
                {selectedEmail.body}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[14px] text-[#bbb]">
            Select an email
          </div>
        )}
      </div>
    </div>
  )
}
