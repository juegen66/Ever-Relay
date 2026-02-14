"use client"

import { useState, useRef, useEffect } from "react"

interface TerminalLine {
  type: "input" | "output"
  content: string
}

const COMMANDS: Record<string, string | ((args: string[]) => string)> = {
  help: "Available commands: help, ls, pwd, whoami, date, echo, clear, cat, uname, uptime, neofetch",
  ls: "Desktop    Documents    Downloads    Music    Pictures    Movies    Applications",
  pwd: "/Users/user",
  whoami: "user",
  date: () => new Date().toString(),
  uname: "Darwin MacBook-Pro.local 23.1.0 Darwin Kernel Version 23.1.0",
  uptime: () => {
    const hours = Math.floor(Math.random() * 24)
    const mins = Math.floor(Math.random() * 60)
    return `${hours}:${mins}  up ${Math.floor(Math.random() * 30)} days, ${hours}:${mins}, 2 users, load averages: 1.24 1.42 1.58`
  },
  cat: (args: string[]) => {
    if (args.length === 0) return "usage: cat [file ...]"
    if (args[0] === "/etc/hostname") return "MacBook-Pro.local"
    return `cat: ${args[0]}: No such file or directory`
  },
  neofetch: `                    'c.          user@MacBook-Pro.local
                 ,xNMM.          -------------------------
               .OMMMMo           OS: macOS Sequoia 15.2
               OMMM0,            Kernel: Darwin 23.1.0
     .;loddo:' loolloddol;.     Uptime: 14 days, 3 hours
   cKMMMMMMMMMMNWMMMMMMMMMM0:   Packages: 142 (brew)
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.   Shell: zsh 5.9
 XMMMMMMMMMMMMMMMMMMMMMMMX.    Resolution: 2560x1600
;MMMMMMMMMMMMMMMMMMMMMMMM:     Terminal: Terminal.app
:MMMMMMMMMMMMMMMMMMMMMMMM:     CPU: Apple M3 Pro
.MMMMMMMMMMMMMMMMMMMMMMMMX.    GPU: Apple M3 Pro
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.  Memory: 8192 MiB / 18432 MiB
 .XMMMMMMMMMMMMMMMMMMMMMMMMk
  .XMMMMMMMMMMMMMMMMMMMMK.
    kMMMMMMMMMMMMMMMMMMd
     ;KMMMMMMMWXXWMMMk.
       .cooc,.    .,coo:.`,
}

export function TerminalApp() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", content: "Last login: Mon Feb 14 10:30:22 on ttys001" },
  ])
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  const handleSubmit = () => {
    const trimmed = input.trim()
    const newLines: TerminalLine[] = [
      ...lines,
      { type: "input", content: `user@MacBook-Pro ~ % ${trimmed}` },
    ]

    if (trimmed === "clear") {
      setLines([])
      setInput("")
      setHistory([trimmed, ...history])
      setHistoryIndex(-1)
      return
    }

    if (trimmed) {
      const parts = trimmed.split(" ")
      const cmd = parts[0]
      const args = parts.slice(1)
      const handler = COMMANDS[cmd]

      if (handler) {
        const output = typeof handler === "function" ? handler(args) : handler
        newLines.push({ type: "output", content: output })
      } else if (cmd === "echo") {
        newLines.push({ type: "output", content: args.join(" ") })
      } else if (trimmed) {
        newLines.push({
          type: "output",
          content: `zsh: command not found: ${cmd}`,
        })
      }
    }

    setLines(newLines)
    setInput("")
    setHistory([trimmed, ...history])
    setHistoryIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      } else {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  return (
    <div
      className="flex h-full flex-col font-mono text-[13px] leading-5"
      style={{ background: "rgba(30, 30, 30, 0.95)", color: "#f0f0f0" }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-auto p-3">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {line.type === "input" ? (
              <span>
                <span className="text-[#4ae34a]">{"user@MacBook-Pro"}</span>
                <span className="text-white">{" ~ % "}</span>
                <span className="text-[#f0f0f0]">
                  {line.content.replace("user@MacBook-Pro ~ % ", "")}
                </span>
              </span>
            ) : (
              <span className="text-[#ddd]">{line.content}</span>
            )}
          </div>
        ))}

        {/* Current Input Line */}
        <div className="flex items-center whitespace-pre">
          <span className="text-[#4ae34a]">{"user@MacBook-Pro"}</span>
          <span className="text-white">{" ~ % "}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#f0f0f0] outline-none caret-[#f0f0f0]"
            autoFocus
            spellCheck={false}
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
