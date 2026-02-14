"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart, ListMusic, Search } from "lucide-react"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  durationSec: number
  color: string
  liked: boolean
}

const TRACKS: Track[] = [
  { id: "1", title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: "3:20", durationSec: 200, color: "#e63946", liked: true },
  { id: "2", title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera", duration: "5:55", durationSec: 355, color: "#457b9d", liked: false },
  { id: "3", title: "Shape of You", artist: "Ed Sheeran", album: "Divide", duration: "3:53", durationSec: 233, color: "#2a9d8f", liked: true },
  { id: "4", title: "Dance Monkey", artist: "Tones And I", album: "The Kids Are Coming", duration: "3:29", durationSec: 209, color: "#e9c46a", liked: false },
  { id: "5", title: "Someone Like You", artist: "Adele", album: "21", duration: "4:45", durationSec: 285, color: "#264653", liked: true },
  { id: "6", title: "Watermelon Sugar", artist: "Harry Styles", album: "Fine Line", duration: "2:54", durationSec: 174, color: "#f4a261", liked: false },
  { id: "7", title: "Bad Guy", artist: "Billie Eilish", album: "WWAFAWDWG", duration: "3:14", durationSec: 194, color: "#1d3557", liked: false },
  { id: "8", title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration: "3:23", durationSec: 203, color: "#a8dadc", liked: true },
]

const SIDEBAR = [
  { label: "Listen Now", icon: "play" },
  { label: "Browse", icon: "browse" },
  { label: "Radio", icon: "radio" },
  { label: "Library", icon: "library" },
]

export function MusicApp() {
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("Listen Now")
  const [tracks, setTracks] = useState(TRACKS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= currentTrack.durationSec) {
            const idx = tracks.findIndex((t) => t.id === currentTrack.id)
            const next = tracks[(idx + 1) % tracks.length]
            setCurrentTrack(next)
            return 0
          }
          return p + 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, currentTrack, tracks])

  const toggleLike = (id: string) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, liked: !t.liked } : t)))
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  const playTrack = (track: Track) => {
    setCurrentTrack(track)
    setProgress(0)
    setIsPlaying(true)
  }

  const prevTrack = () => {
    const idx = tracks.findIndex((t) => t.id === currentTrack.id)
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length]
    playTrack(prev)
  }

  const nextTrack = () => {
    const idx = tracks.findIndex((t) => t.id === currentTrack.id)
    const next = tracks[(idx + 1) % tracks.length]
    playTrack(next)
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "#1a1a1a" }}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex w-48 flex-shrink-0 flex-col p-3" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-white/10">
              <Search className="h-3 w-3 text-white/50" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="flex-1 bg-transparent text-[12px] text-white/80 outline-none placeholder:text-white/30"
            />
          </div>

          <div className="space-y-0.5">
            {SIDEBAR.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                  activeTab === item.label
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <ListMusic className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Playlists
          </div>
          <div className="mt-1 space-y-0.5">
            {["Favorites", "Recently Added", "Chill Vibes", "Workout Mix"].map((pl) => (
              <button
                key={pl}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-[12px] text-white/40 hover:text-white/60 hover:bg-white/5"
              >
                {pl}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Header */}
          <div className="mb-4 flex items-end gap-5">
            <div
              className="h-32 w-32 rounded-lg shadow-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${currentTrack.color} 0%, ${currentTrack.color}88 100%)` }}
            >
              <ListMusic className="h-12 w-12 text-white/60" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/40">Now Playing</div>
              <h2 className="text-[24px] font-bold text-white mt-1">{currentTrack.title}</h2>
              <p className="text-[14px] text-white/50">{currentTrack.artist} - {currentTrack.album}</p>
            </div>
          </div>

          {/* Track List */}
          <table className="w-full">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-white/30 border-b border-white/5">
                <th className="pb-2 pl-3 text-left w-8">#</th>
                <th className="pb-2 text-left">Title</th>
                <th className="pb-2 text-left">Album</th>
                <th className="pb-2 text-right pr-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, i) => (
                <tr
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={`group cursor-pointer text-[13px] transition-colors ${
                    currentTrack.id === track.id
                      ? "bg-white/5 text-white"
                      : "text-white/60 hover:bg-white/[0.03] hover:text-white/80"
                  }`}
                >
                  <td className="py-2 pl-3 rounded-l-md">
                    {currentTrack.id === track.id && isPlaying ? (
                      <div className="flex items-center gap-0.5">
                        <div className="h-3 w-0.5 animate-pulse rounded-full bg-[#fc3c44]" />
                        <div className="h-2 w-0.5 animate-pulse rounded-full bg-[#fc3c44]" style={{ animationDelay: "0.2s" }} />
                        <div className="h-3.5 w-0.5 animate-pulse rounded-full bg-[#fc3c44]" style={{ animationDelay: "0.4s" }} />
                      </div>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${track.color} 0%, ${track.color}88 100%)` }}
                      />
                      <div>
                        <div className={`font-medium ${currentTrack.id === track.id ? "text-[#fc3c44]" : ""}`}>{track.title}</div>
                        <div className="text-[11px] text-white/40">{track.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-white/40">{track.album}</td>
                  <td className="py-2 pr-3 rounded-r-md">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(track.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart className={`h-3.5 w-3.5 ${track.liked ? "fill-[#fc3c44] text-[#fc3c44]" : "text-white/40"}`} />
                      </button>
                      <span className="text-white/40">{track.duration}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Now Playing Bar */}
      <div className="flex h-16 flex-shrink-0 items-center gap-4 px-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(30,30,30,0.95)" }}>
        {/* Track Info */}
        <div className="flex items-center gap-3 w-52">
          <div
            className="h-10 w-10 rounded flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${currentTrack.color} 0%, ${currentTrack.color}88 100%)` }}
          />
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white truncate">{currentTrack.title}</div>
            <div className="text-[11px] text-white/40 truncate">{currentTrack.artist}</div>
          </div>
          <button onClick={() => toggleLike(currentTrack.id)}>
            <Heart className={`h-3.5 w-3.5 ${currentTrack.liked ? "fill-[#fc3c44] text-[#fc3c44]" : "text-white/30"}`} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button className="text-white/40 hover:text-white/70"><Shuffle className="h-3.5 w-3.5" /></button>
            <button onClick={prevTrack} className="text-white/60 hover:text-white"><SkipBack className="h-4 w-4 fill-current" /></button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="text-white/60 hover:text-white"><SkipForward className="h-4 w-4 fill-current" /></button>
            <button className="text-white/40 hover:text-white/70"><Repeat className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="text-[10px] text-white/30 w-8 text-right">{formatTime(progress)}</span>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = (e.clientX - rect.left) / rect.width
                setProgress(Math.floor(pct * currentTrack.durationSec))
              }}
            >
              <div
                className="h-full rounded-full bg-white/50"
                style={{ width: `${(progress / currentTrack.durationSec) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-white/30 w-8">{currentTrack.duration}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex w-32 items-center gap-2">
          <Volume2 className="h-3.5 w-3.5 text-white/40" />
          <input
            type="range"
            min="0"
            max="100"
            defaultValue={75}
            className="flex-1 accent-white h-1"
          />
        </div>
      </div>
    </div>
  )
}
