"use client"

import { useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  date: string
}

const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    title: "Welcome to Notes",
    content: "This is your Notes app. Start writing your thoughts here!\n\nYou can create, edit, and delete notes.",
    date: "Today",
  },
  {
    id: "2",
    title: "Shopping List",
    content: "- Milk\n- Eggs\n- Bread\n- Coffee\n- Avocado",
    date: "Yesterday",
  },
  {
    id: "3",
    title: "Meeting Notes",
    content: "Discussed Q1 objectives.\nAction items:\n1. Update roadmap\n2. Review budget\n3. Schedule follow-up",
    date: "Jan 12",
  },
]

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES)
  const [activeNote, setActiveNote] = useState<string>("1")
  const [searchQuery, setSearchQuery] = useState("")

  const currentNote = notes.find((n) => n.id === activeNote)

  const addNote = () => {
    const newNote: Note = {
      id: String(Date.now()),
      title: "New Note",
      content: "",
      date: "Just now",
    }
    setNotes([newNote, ...notes])
    setActiveNote(newNote.id)
  }

  const deleteNote = (id: string) => {
    const filtered = notes.filter((n) => n.id !== id)
    setNotes(filtered)
    if (activeNote === id && filtered.length > 0) {
      setActiveNote(filtered[0].id)
    }
  }

  const updateNote = (content: string) => {
    setNotes(
      notes.map((n) =>
        n.id === activeNote
          ? {
              ...n,
              content,
              title: content.split("\n")[0].slice(0, 40) || "New Note",
              date: "Just now",
            }
          : n
      )
    )
  }

  const filtered = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

  return (
    <div className="flex h-full">
      {/* Notes List */}
      <div
        className="flex w-56 flex-shrink-0 flex-col"
        style={{
          background: "rgba(246, 246, 246, 0.95)",
          borderRight: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Search & Add */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex flex-1 items-center gap-1.5 rounded-md bg-black/[0.05] px-2 py-1">
            <Search className="h-3 w-3 text-[#888]" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[12px] text-[#333] outline-none placeholder:text-[#999]"
            />
          </div>
          <button
            onClick={addNote}
            className="rounded-md p-1 text-[#666] hover:bg-black/5"
            aria-label="Add note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Note Items */}
        <div className="flex-1 overflow-auto">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => setActiveNote(note.id)}
              className={`group cursor-default px-3 py-2 transition-colors ${
                activeNote === note.id
                  ? "bg-[#0058d0] text-white"
                  : "hover:bg-black/[0.04] text-[#333]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium truncate flex-1">{note.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNote(note.id)
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
                    activeNote === note.id ? "text-white/70 hover:text-white" : "text-[#999] hover:text-[#666]"
                  }`}
                  aria-label="Delete note"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[11px] ${activeNote === note.id ? "text-white/70" : "text-[#999]"}`}>
                  {note.date}
                </span>
                <span className={`text-[11px] truncate ${activeNote === note.id ? "text-white/60" : "text-[#bbb]"}`}>
                  {note.content.split("\n")[0].slice(0, 30)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {currentNote ? (
          <textarea
            value={currentNote.content}
            onChange={(e) => updateNote(e.target.value)}
            className="h-full w-full resize-none bg-transparent p-4 text-[14px] leading-relaxed text-[#333] outline-none"
            placeholder="Start writing..."
            spellCheck={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[14px] text-[#999]">
            No note selected
          </div>
        )}
      </div>
    </div>
  )
}
