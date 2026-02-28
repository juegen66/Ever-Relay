"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Heart, ListMusic, Search, Music2 } from "lucide-react"
import { AudioEngine } from "@/lib/audio-engine"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  durationSec: number
  color: string
  liked: boolean
  genre: string
}

const TRACKS: Track[] = [
  { id: "1", title: "Sunset Dreams", artist: "Aurora Synth", album: "Golden Hour", duration: "0:45", durationSec: 45, color: "#f97316", liked: true, genre: "Ambient" },
  { id: "2", title: "Neon Lights", artist: "Retro Wave", album: "Night Drive", duration: "0:45", durationSec: 45, color: "#a855f7", liked: false, genre: "Synthwave" },
  { id: "3", title: "Ocean Waves", artist: "Nature Sound", album: "Calm Waters", duration: "0:50", durationSec: 50, color: "#06b6d4", liked: true, genre: "Ambient" },
  { id: "4", title: "City Pulse", artist: "Electro Beat", album: "Urban", duration: "0:40", durationSec: 40, color: "#ef4444", liked: false, genre: "Electronic" },
  { id: "5", title: "Starlight", artist: "Aurora Synth", album: "Cosmos", duration: "0:50", durationSec: 50, color: "#6366f1", liked: true, genre: "Ambient" },
  { id: "6", title: "Jazz Cafe", artist: "Smooth Keys", album: "Late Night", duration: "0:45", durationSec: 45, color: "#d97706", liked: false, genre: "Jazz" },
  { id: "7", title: "Pixel Journey", artist: "Chiptune Kid", album: "8-Bit World", duration: "0:40", durationSec: 40, color: "#22c55e", liked: false, genre: "Chiptune" },
  { id: "8", title: "Midnight Piano", artist: "Ivory Keys", album: "Nocturne", duration: "0:50", durationSec: 50, color: "#3b82f6", liked: true, genre: "Classical" },
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
  const [volume, setVolume] = useState(75)
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off")
  const [searchQuery, setSearchQuery] = useState("")
  const engineRef = useRef<AudioEngine | null>(null)
  const animRef = useRef<number>(0)

  // Initialize audio engine
  useEffect(() => {
    engineRef.current = new AudioEngine()
    return () => {
      engineRef.current?.destroy()
    }
  }, [])

  // Progress animation loop
  useEffect(() => {
    const tick = () => {
      if (engineRef.current?.isPlaying) {
        const t = engineRef.current.getCurrentTime()
        setProgress(t)

        // Auto-advance when track ends
        if (t >= currentTrack.durationSec) {
          nextTrack()
          return
        }
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, tracks, isShuffle, repeatMode])

  const toggleLike = (id: string) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, liked: !t.liked } : t)))
    if (currentTrack.id === id) {
      setCurrentTrack({ ...currentTrack, liked: !currentTrack.liked })
    }
  }

  const formatTime = (s: number) => {
    const sec = Math.floor(s)
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`
  }

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track)
    setProgress(0)
    setIsPlaying(true)
    engineRef.current?.play(track.id, 0)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      engineRef.current?.pause()
      setIsPlaying(false)
    } else {
      if (progress > 0 && progress < currentTrack.durationSec) {
        engineRef.current?.resume()
      } else {
        engineRef.current?.play(currentTrack.id, 0)
        setProgress(0)
      }
      setIsPlaying(true)
    }
  }, [isPlaying, progress, currentTrack])

  const prevTrack = useCallback(() => {
    // If more than 3 seconds in, restart. Otherwise go to previous
    if (progress > 3) {
      playTrack(currentTrack)
      return
    }
    const idx = tracks.findIndex((t) => t.id === currentTrack.id)
    if (isShuffle) {
      const rand = Math.floor(Math.random() * tracks.length)
      playTrack(tracks[rand])
    } else {
      playTrack(tracks[(idx - 1 + tracks.length) % tracks.length])
    }
  }, [tracks, currentTrack, isShuffle, progress, playTrack])

  const nextTrack = useCallback(() => {
    const idx = tracks.findIndex((t) => t.id === currentTrack.id)
    if (repeatMode === "one") {
      playTrack(currentTrack)
    } else if (isShuffle) {
      const rand = Math.floor(Math.random() * tracks.length)
      playTrack(tracks[rand])
    } else {
      playTrack(tracks[(idx + 1) % tracks.length])
    }
  }, [tracks, currentTrack, isShuffle, repeatMode, playTrack])

  const handleVolumeChange = (v: number) => {
    setVolume(v)
    engineRef.current?.setVolume(v / 100)
  }

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = pct * currentTrack.durationSec
    setProgress(newTime)
    if (isPlaying) {
      engineRef.current?.play(currentTrack.id, newTime)
    }
  }

  const filteredTracks = searchQuery
    ? tracks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.album.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tracks

  const likedTracks = tracks.filter((t) => t.liked)

  return (
    <div className="flex h-full flex-col select-none" style={{ background: "#1a1a1a" }}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex w-52 flex-shrink-0 flex-col p-3" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4 px-2 py-1.5 rounded-md" style={{ background: "rgba(255,255,255,0.06)" }}>
            <Search className="h-3.5 w-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-white/80 outline-none placeholder:text-white/30"
            />
          </div>

          <div className="space-y-0.5">
            {SIDEBAR.map((item) => (
              <button
                key={item.label}
                onClick={() => { setActiveTab(item.label); setSearchQuery("") }}
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
                onClick={() => setActiveTab(pl)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-[12px] transition-colors ${
                  activeTab === pl
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                {pl}
              </button>
            ))}
          </div>

          {/* Genre Tags */}
          <div className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Genres
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1 px-2">
            {["Ambient", "Synthwave", "Electronic", "Jazz", "Chiptune", "Classical"].map((g) => (
              <button
                key={g}
                onClick={() => { setActiveTab(g); setSearchQuery("") }}
                className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                  activeTab === g
                    ? "bg-[#fc3c44]/20 text-[#fc3c44]"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Hero / Now Playing */}
          <div className="mb-5 flex items-end gap-5">
            <div
              className="relative h-36 w-36 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${currentTrack.color} 0%, ${currentTrack.color}88 100%)` }}
            >
              {isPlaying ? (
                <div className="flex items-end gap-[3px] h-10">
                  <div className="w-1 rounded-full bg-white/70 eq-bar-1" style={{ height: "30%" }} />
                  <div className="w-1 rounded-full bg-white/70 eq-bar-2" style={{ height: "60%" }} />
                  <div className="w-1 rounded-full bg-white/70 eq-bar-3" style={{ height: "45%" }} />
                  <div className="w-1 rounded-full bg-white/70 eq-bar-1" style={{ height: "80%", animationDelay: "0.3s" }} />
                  <div className="w-1 rounded-full bg-white/70 eq-bar-2" style={{ height: "50%", animationDelay: "0.15s" }} />
                </div>
              ) : (
                <Music2 className="h-14 w-14 text-white/50" />
              )}
              <div className="absolute bottom-1.5 right-1.5 rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] text-white/70">
                {currentTrack.genre}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/40">Now Playing</div>
              <h2 className="text-[24px] font-bold text-white mt-1 leading-tight">{currentTrack.title}</h2>
              <p className="text-[14px] text-white/50 mt-0.5">{currentTrack.artist}</p>
              <p className="text-[12px] text-white/30">{currentTrack.album}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/50 hover:bg-white/10 flex items-center gap-1"
                >
                  <Heart className={`h-3 w-3 ${currentTrack.liked ? "fill-[#fc3c44] text-[#fc3c44]" : ""}`} />
                  {currentTrack.liked ? "Liked" : "Like"}
                </button>
                <span className="text-[11px] text-white/20">{currentTrack.duration}</span>
              </div>
            </div>
          </div>

          {/* Track List */}
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-white/60">
              {activeTab === "Favorites"
                ? "Favorite Tracks"
                : searchQuery
                  ? `Search: "${searchQuery}"`
                  : ["Ambient", "Synthwave", "Electronic", "Jazz", "Chiptune", "Classical"].includes(activeTab)
                    ? activeTab
                    : "All Tracks"
              }
            </h3>
            <span className="text-[11px] text-white/30">
              {(activeTab === "Favorites"
                ? likedTracks
                : ["Ambient", "Synthwave", "Electronic", "Jazz", "Chiptune", "Classical"].includes(activeTab)
                  ? tracks.filter((t) => t.genre === activeTab)
                  : filteredTracks
              ).length} tracks
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-white/30 border-b border-white/5">
                <th className="pb-2 pl-3 text-left w-8">#</th>
                <th className="pb-2 text-left">Title</th>
                <th className="pb-2 text-left">Album</th>
                <th className="pb-2 text-left w-20">Genre</th>
                <th className="pb-2 text-right pr-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "Favorites"
                ? likedTracks
                : ["Ambient", "Synthwave", "Electronic", "Jazz", "Chiptune", "Classical"].includes(activeTab)
                  ? tracks.filter((t) => t.genre === activeTab)
                  : filteredTracks
              ).map((track, i) => (
                <tr
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={`group cursor-pointer text-[13px] transition-colors ${
                    currentTrack.id === track.id
                      ? "bg-white/5 text-white"
                      : "text-white/60 hover:bg-white/[0.03] hover:text-white/80"
                  }`}
                >
                  <td className="py-2 pl-3 rounded-l-md w-8">
                    {currentTrack.id === track.id && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-3.5">
                        <div className="w-[3px] rounded-full bg-[#fc3c44] eq-bar-1" />
                        <div className="w-[3px] rounded-full bg-[#fc3c44] eq-bar-2" />
                        <div className="w-[3px] rounded-full bg-[#fc3c44] eq-bar-3" />
                      </div>
                    ) : (
                      <span className="text-white/30">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded flex-shrink-0 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${track.color} 0%, ${track.color}88 100%)` }}
                      >
                        <Music2 className="h-3.5 w-3.5 text-white/60" />
                      </div>
                      <div>
                        <div className={`font-medium ${currentTrack.id === track.id ? "text-[#fc3c44]" : ""}`}>{track.title}</div>
                        <div className="text-[11px] text-white/40">{track.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-white/40 text-[12px]">{track.album}</td>
                  <td className="py-2">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">{track.genre}</span>
                  </td>
                  <td className="py-2 pr-3 rounded-r-md">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(track.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart className={`h-3.5 w-3.5 ${track.liked ? "fill-[#fc3c44] text-[#fc3c44]" : "text-white/40"}`} />
                      </button>
                      <span className="text-white/40 text-[12px]">{track.duration}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Now Playing Bar */}
      <div className="flex h-[72px] flex-shrink-0 items-center gap-4 px-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(28,28,28,0.98)" }}>
        {/* Track Info */}
        <div className="flex items-center gap-3 w-56 flex-shrink-0">
          <div
            className="relative h-11 w-11 rounded flex-shrink-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${currentTrack.color} 0%, ${currentTrack.color}88 100%)` }}
          >
            {isPlaying && (
              <div className="flex items-end gap-[2px] h-4">
                <div className="w-[2px] rounded-full bg-white/80 eq-bar-1" />
                <div className="w-[2px] rounded-full bg-white/80 eq-bar-2" />
                <div className="w-[2px] rounded-full bg-white/80 eq-bar-3" />
              </div>
            )}
            {!isPlaying && <Music2 className="h-4 w-4 text-white/50" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-white truncate">{currentTrack.title}</div>
            <div className="text-[11px] text-white/40 truncate">{currentTrack.artist}</div>
          </div>
          <button onClick={() => toggleLike(currentTrack.id)} className="flex-shrink-0">
            <Heart className={`h-3.5 w-3.5 transition-colors ${currentTrack.liked ? "fill-[#fc3c44] text-[#fc3c44]" : "text-white/30 hover:text-white/50"}`} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition-colors ${isShuffle ? "text-[#fc3c44]" : "text-white/40 hover:text-white/70"}`}
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
            <button onClick={prevTrack} className="text-white/60 hover:text-white transition-colors">
              <SkipBack className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="text-white/60 hover:text-white transition-colors">
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={() => setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off")}
              className={`relative transition-colors ${repeatMode !== "off" ? "text-[#fc3c44]" : "text-white/40 hover:text-white/70"}`}
            >
              <Repeat className="h-3.5 w-3.5" />
              {repeatMode === "one" && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[7px] font-bold text-[#fc3c44]">1</span>
              )}
            </button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="text-[10px] text-white/30 w-8 text-right tabular-nums">{formatTime(progress)}</span>
            <div
              className="group relative flex-1 h-1 rounded-full bg-white/10 overflow-hidden cursor-pointer"
              onClick={seekTo}
            >
              <div
                className="h-full rounded-full transition-colors group-hover:bg-[#fc3c44]"
                style={{
                  width: `${Math.min(100, (progress / currentTrack.durationSec) * 100)}%`,
                  background: "rgba(255,255,255,0.5)",
                }}
              />
            </div>
            <span className="text-[10px] text-white/30 w-8 tabular-nums">{currentTrack.duration}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex w-32 items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleVolumeChange(volume === 0 ? 75 : 0)}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <div
            className="group relative flex-1 h-1 rounded-full bg-white/10 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
              handleVolumeChange(Math.round(pct * 100))
            }}
          >
            <div
              className="h-full rounded-full bg-white/40 group-hover:bg-white/60 transition-colors"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
