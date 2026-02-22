"use client"

import { useState } from "react"
import { Search, MapPin, Navigation, Layers, ChevronRight } from "lucide-react"

const PLACES = [
  { name: "Apple Park", address: "One Apple Park Way, Cupertino, CA", lat: 37.334, lng: -122.009 },
  { name: "Golden Gate Bridge", address: "Golden Gate Bridge, San Francisco, CA", lat: 37.8199, lng: -122.4783 },
  { name: "Fisherman's Wharf", address: "Fisherman's Wharf, San Francisco, CA", lat: 37.808, lng: -122.4177 },
  { name: "Alcatraz Island", address: "Alcatraz Island, San Francisco, CA", lat: 37.8267, lng: -122.4233 },
  { name: "Union Square", address: "Union Square, San Francisco, CA", lat: 37.788, lng: -122.4074 },
]

export function MapsApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlace, setSelectedPlace] = useState<typeof PLACES[0] | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  const filtered = searchQuery
    ? PLACES.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : PLACES

  return (
    <div className="relative flex h-full overflow-hidden" style={{ background: "#1a1a2e" }}>
      {/* Map Background - Stylized Grid */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a2332 0%, #1e3a4f 30%, #1a3040 60%, #162030 100%)" }}>
        {/* Grid lines for map feel */}
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.1 }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={`${i * 25}`} x2="100%" y2={`${i * 25}`} stroke="white" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 40 }).map((_, i) => (
            <line key={`v-${i}`} x1={`${i * 25}`} y1="0" x2={`${i * 25}`} y2="100%" stroke="white" strokeWidth="0.5" />
          ))}
        </svg>

        {/* Stylized roads */}
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.15 }}>
          <path d="M0,200 Q200,180 400,220 T800,200" stroke="#4fc3f7" strokeWidth="3" fill="none" />
          <path d="M200,0 Q220,200 180,400 T200,800" stroke="#4fc3f7" strokeWidth="3" fill="none" />
          <path d="M0,350 Q300,330 600,380" stroke="#4fc3f7" strokeWidth="2" fill="none" />
          <path d="M350,0 C360,150 320,300 380,500" stroke="#4fc3f7" strokeWidth="2" fill="none" />
          <path d="M0,100 L800,500" stroke="#4fc3f7" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>

        {/* Water areas */}
        <div className="absolute top-0 right-0 w-1/3 h-2/3 opacity-10" style={{ background: "linear-gradient(135deg, transparent, #007aff 60%)", borderRadius: "0 0 0 60%" }} />

        {/* Location markers */}
        {PLACES.map((place, i) => (
          <button
            key={place.name}
            className="absolute group"
            style={{
              left: `${15 + i * 16}%`,
              top: `${25 + (i % 3) * 20}%`,
            }}
            onClick={() => setSelectedPlace(place)}
          >
            <div className="relative">
              <MapPin
                className={`h-7 w-7 drop-shadow-lg transition-transform group-hover:scale-125 ${
                  selectedPlace?.name === place.name ? "text-[#ff3b30]" : "text-[#007aff]"
                }`}
                fill="currentColor"
              />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {place.name}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search Panel */}
      <div className="relative z-10 m-3 flex w-72 flex-col">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(30,30,30,0.85)",
            backdropFilter: "blur(30px)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Search className="h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search Maps"
              className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/30"
            />
          </div>

          {/* Search Results or Place Detail */}
          {selectedPlace && !showSearch ? (
            <div className="p-3">
              <h3 className="text-[15px] font-semibold text-white">{selectedPlace.name}</h3>
              <p className="text-[12px] text-white/50 mt-1">{selectedPlace.address}</p>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-lg bg-[#007aff] py-1.5 text-[12px] font-medium text-white hover:bg-[#0066dd]">
                  Directions
                </button>
                <button className="flex-1 rounded-lg bg-white/10 py-1.5 text-[12px] font-medium text-white hover:bg-white/15">
                  Share
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-[12px] text-white/60">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-[280px] overflow-auto">
              {filtered.map((place) => (
                <button
                  key={place.name}
                  onClick={() => { setSelectedPlace(place); setShowSearch(false); setSearchQuery("") }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <MapPin className="h-4 w-4 text-[#007aff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white truncate">{place.name}</div>
                    <div className="text-[11px] text-white/40 truncate">{place.address}</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
          style={{ background: "rgba(30,30,30,0.85)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.1)" }}
          aria-label="My location"
        >
          <Navigation className="h-4 w-4 text-white/60" />
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
          style={{ background: "rgba(30,30,30,0.85)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.1)" }}
          aria-label="Map layers"
        >
          <Layers className="h-4 w-4 text-white/60" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute right-3 bottom-3 z-10 flex flex-col overflow-hidden rounded-xl shadow-lg"
        style={{ background: "rgba(30,30,30,0.85)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
        <button className="flex h-8 w-9 items-center justify-center text-white/60 hover:bg-white/10 text-[18px] font-light">+</button>
        <div className="h-px bg-white/10" />
        <button className="flex h-8 w-9 items-center justify-center text-white/60 hover:bg-white/10 text-[18px] font-light">-</button>
      </div>
    </div>
  )
}
