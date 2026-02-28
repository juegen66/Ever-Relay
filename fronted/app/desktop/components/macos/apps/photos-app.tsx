"use client"

import { useState } from "react"
import { Image, Star, Clock, MapPin, Folder } from "lucide-react"

interface Photo {
  id: string
  color: string
  label: string
  date: string
  location: string
}

const PHOTOS: Photo[] = [
  { id: "1", color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", label: "Mountain Sunset", date: "Aug 15, 2024", location: "Swiss Alps" },
  { id: "2", color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", label: "Cherry Blossoms", date: "Apr 3, 2024", location: "Tokyo, Japan" },
  { id: "3", color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", label: "Ocean View", date: "Jul 22, 2024", location: "Maldives" },
  { id: "4", color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", label: "Forest Trail", date: "Sep 10, 2024", location: "Pacific NW" },
  { id: "5", color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", label: "Desert Dawn", date: "Oct 5, 2024", location: "Sahara" },
  { id: "6", color: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", label: "Lavender Field", date: "Jun 18, 2024", location: "Provence, France" },
  { id: "7", color: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)", label: "City Lights", date: "Dec 1, 2024", location: "New York, USA" },
  { id: "8", color: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)", label: "Northern Lights", date: "Jan 20, 2025", location: "Iceland" },
  { id: "9", color: "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)", label: "Autumn Leaves", date: "Nov 2, 2024", location: "Vermont, USA" },
  { id: "10", color: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", label: "Beach Sunset", date: "Aug 30, 2024", location: "Bali" },
  { id: "11", color: "linear-gradient(135deg, #96e6a1 0%, #d4fc79 100%)", label: "Spring Garden", date: "May 15, 2024", location: "Kyoto" },
  { id: "12", color: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", label: "Waterfall", date: "Jul 8, 2024", location: "Costa Rica" },
]

const SIDEBAR = [
  { name: "Library", icon: <Image className="h-4 w-4" /> },
  { name: "Recents", icon: <Clock className="h-4 w-4" /> },
  { name: "Favorites", icon: <Star className="h-4 w-4" /> },
  { name: "Places", icon: <MapPin className="h-4 w-4" /> },
  { name: "Albums", icon: <Folder className="h-4 w-4" /> },
]

export function PhotosApp() {
  const [activeTab, setActiveTab] = useState("Library")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className="flex w-40 flex-shrink-0 flex-col gap-0.5 p-2"
        style={{
          background: "rgba(236, 236, 236, 0.6)",
          borderRight: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#888]">
          Photos
        </div>
        {SIDEBAR.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              setActiveTab(item.name)
              setSelectedPhoto(null)
            }}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors ${
              activeTab === item.name
                ? "bg-[#0058d0] text-white"
                : "text-[#333] hover:bg-black/5"
            }`}
          >
            <span className={activeTab === item.name ? "text-white" : "text-[#6e6e6e]"}>
              {item.icon}
            </span>
            {item.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedPhoto ? (
          /* Photo Detail */
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-[13px] text-[#007aff] hover:underline"
              >
                {"Back to Library"}
              </button>
              <span className="text-[13px] font-medium text-[#333]">{selectedPhoto.label}</span>
              <span className="text-[11px] text-[#999]">{selectedPhoto.date}</span>
            </div>
            <div className="flex flex-1 items-center justify-center p-8">
              <div
                className="h-64 w-80 rounded-xl shadow-lg"
                style={{ background: selectedPhoto.color }}
              />
            </div>
            <div className="flex items-center justify-center gap-4 pb-4 text-[12px] text-[#666]">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedPhoto.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {selectedPhoto.date}
              </span>
            </div>
          </div>
        ) : (
          /* Photo Grid */
          <div className="p-4">
            <h2 className="mb-4 text-[15px] font-semibold text-[#333]">
              {activeTab} <span className="font-normal text-[#999]">({PHOTOS.length} photos)</span>
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {PHOTOS.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
                  style={{ background: photo.color }}
                >
                  <div className="absolute inset-x-0 bottom-0 p-2 text-left opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}
                  >
                    <span className="text-[11px] font-medium text-white">{photo.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
