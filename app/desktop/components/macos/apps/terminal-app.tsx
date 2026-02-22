"use client"

import { useState, useRef, useEffect } from "react"

interface TerminalLine {
  type: "input" | "output"
  content: string
}

const COMMANDS: Record<string, string | ((args: string[]) => string)> = {
  help: "Available commands:\n  help     - Show this help message\n  ls       - List directory contents\n  pwd      - Print working directory\n  whoami   - Print current user\n  date     - Show current date/time\n  echo     - Print text\n  clear    - Clear terminal\n  cat      - Display file contents\n  uname    - System information\n  uptime   - Show system uptime\n  neofetch - System info with logo\n  top      - Process viewer\n  df       - Disk usage\n  ifconfig - Network interfaces\n  ping     - Test connectivity\n  curl     - Transfer data\n  python3  - Python interpreter\n  node     - Node.js interpreter\n  brew     - Package manager\n  git      - Version control",
  ls: (args: string[]) => {
    if (args.includes("-la") || args.includes("-al")) {
      return `total 24
drwxr-xr-x   8 user  staff   256 Feb 14 10:30 .
drwxr-xr-x   5 root  admin   160 Jan  1  2024 ..
drwx------+  5 user  staff   160 Feb 14 09:15 Desktop
drwx------+  3 user  staff    96 Feb 10 14:30 Documents
drwx------+  4 user  staff   128 Feb 13 18:22 Downloads
drwx------+  3 user  staff    96 Jan 15 11:00 Music
drwx------+  3 user  staff    96 Feb  8 09:45 Pictures
drwx------+  2 user  staff    64 Dec 20 16:30 Movies
drwxr-xr-x   9 user  staff   288 Feb 12 20:00 Applications
-rw-r--r--   1 user  staff  1420 Feb 14 10:00 .zshrc
-rw-r--r--   1 user  staff   256 Feb  1 09:00 .gitconfig`
    }
    return "Desktop    Documents    Downloads    Music    Pictures    Movies    Applications"
  },
  pwd: "/Users/user",
  whoami: "user",
  hostname: "MacBook-Pro.local",
  date: () => new Date().toString(),
  uname: (args: string[]) => {
    if (args.includes("-a")) return "Darwin MacBook-Pro.local 23.1.0 Darwin Kernel Version 23.1.0: Mon Oct  9 21:27:27 PDT 2023; root:xnu-10002.41.9~6/RELEASE_ARM64_T6031 arm64"
    return "Darwin"
  },
  uptime: () => {
    const hours = Math.floor(Math.random() * 24)
    const mins = Math.floor(Math.random() * 60)
    const days = Math.floor(Math.random() * 30) + 1
    return ` ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}  up ${days} days, ${hours}:${String(mins).padStart(2, "0")}, 2 users, load averages: 1.24 1.42 1.58`
  },
  top: () => {
    return `Processes: 312 total, 3 running, 309 sleeping, 1842 threads
Load Avg: 1.24, 1.42, 1.58  CPU usage: 8.2% user, 4.1% sys, 87.7% idle
SharedLibs: 324M resident, 82M data, 42M linkedit.
MemRegions: 124932 total, 4.2G resident, 196M private, 1.8G shared.
PhysMem: 12G used (2.8G wired), 6.0G unused.
VM: 58T vsize, 3125M framework vsize, 0(0) swapins, 0(0) swapouts.

PID    COMMAND      %CPU  TIME     MEM
1234   WindowServer 12.3  14:22.10 512M
5678   Safari       8.1   06:45.23 1.2G
9012   Terminal     0.3   00:12.45 48M
3456   Finder       1.2   02:33.18 256M
7890   Dock         0.1   00:08.92 64M`
  },
  df: () => {
    return `Filesystem     Size   Used  Avail  Capacity  Mounted on
/dev/disk3s1  500Gi  312Gi  188Gi     63%    /
devfs         204Ki  204Ki    0Bi    100%    /dev
/dev/disk3s5  500Gi  312Gi  188Gi     63%    /System/Volumes/Data`
  },
  ifconfig: () => {
    return `en0: flags=8863<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST> mtu 1500
    inet 192.168.1.105 netmask 0xffffff00 broadcast 192.168.1.255
    inet6 fe80::1c5a:3f2e:d8a1:7bc4%en0 prefixlen 64 secured scopeid 0x6
    ether a4:83:e7:2b:1f:9c
    media: autoselect
    status: active`
  },
  ping: (args: string[]) => {
    const host = args[0] || "google.com"
    return `PING ${host} (142.250.80.46): 56 data bytes
64 bytes from 142.250.80.46: icmp_seq=0 ttl=116 time=12.345 ms
64 bytes from 142.250.80.46: icmp_seq=1 ttl=116 time=11.892 ms
64 bytes from 142.250.80.46: icmp_seq=2 ttl=116 time=13.102 ms

--- ${host} ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 11.892/12.446/13.102/0.496 ms`
  },
  curl: (args: string[]) => {
    if (args.length === 0) return "curl: try 'curl --help' for more information"
    return `{"status": "ok", "message": "Hello from ${args[0]}"}`
  },
  python3: () => "Python 3.12.2 (main, Feb  6 2024, 20:19:44) [Clang 15.0.0]\nType \"exit()\" to quit.\n>>> Use 'exit' to quit interactive mode",
  node: () => "v21.6.1\n> Use '.exit' to quit interactive mode",
  brew: (args: string[]) => {
    if (args[0] === "list") return "bat\nfd\nfzf\ngit\nhtop\njq\nneovim\nnode\npython\nripgrep\ntmux\nwget"
    if (args[0] === "doctor") return "Your system is ready to brew."
    return "Example usage:\n  brew install <formula>\n  brew list\n  brew update\n  brew doctor"
  },
  git: (args: string[]) => {
    if (args[0] === "status") return "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean"
    if (args[0] === "log") return "commit a1b2c3d (HEAD -> main, origin/main)\nAuthor: User <user@email.com>\nDate:   Fri Feb 14 10:30:00 2026 -0800\n\n    Initial commit"
    return "usage: git <command> [<args>]\n\nCommonly used commands:\n   status    Show working tree status\n   log       Show commit logs\n   add       Add file contents to the index\n   commit    Record changes to the repository"
  },
  cat: (args: string[]) => {
    if (args.length === 0) return "usage: cat [file ...]"
    if (args[0] === "/etc/hostname") return "MacBook-Pro.local"
    if (args[0] === ".zshrc") return '# ~/.zshrc\nexport PATH="/opt/homebrew/bin:$PATH"\nalias ll="ls -la"\nalias gs="git status"\nPROMPT="%F{green}%n@%m%f %F{blue}%~%f %% "'
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
