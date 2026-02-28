"use client"

import { useState } from "react"
import {
  Folder,
  File,
  Image,
  Music,
  Film,
  Download,
  Star,
  Clock,
  HardDrive,
  ChevronRight,
} from "lucide-react"

interface FileItem {
  name: string
  icon: React.ReactNode
  type: "folder" | "file"
  size?: string
  modified?: string
}

const SIDEBAR_ITEMS = [
  { name: "Recents", icon: <Clock className="h-4 w-4" /> },
  { name: "Favorites", icon: <Star className="h-4 w-4" /> },
  { name: "Desktop", icon: <HardDrive className="h-4 w-4" /> },
  { name: "Documents", icon: <Folder className="h-4 w-4" /> },
  { name: "Downloads", icon: <Download className="h-4 w-4" /> },
  { name: "Pictures", icon: <Image className="h-4 w-4" /> },
  { name: "Music", icon: <Music className="h-4 w-4" /> },
  { name: "Movies", icon: <Film className="h-4 w-4" /> },
]

const FILES: Record<string, FileItem[]> = {
  Desktop: [
    { name: "Projects", icon: <Folder className="h-5 w-5 text-blue-500" />, type: "folder", size: "--", modified: "Today" },
    { name: "Notes.txt", icon: <File className="h-5 w-5 text-gray-500" />, type: "file", size: "4 KB", modified: "Yesterday" },
    { name: "Screenshot.png", icon: <Image className="h-5 w-5 text-green-500" />, type: "file", size: "2.3 MB", modified: "Jan 15" },
  ],
  Documents: [
    { name: "Work", icon: <Folder className="h-5 w-5 text-blue-500" />, type: "folder", size: "--", modified: "Dec 20" },
    { name: "Personal", icon: <Folder className="h-5 w-5 text-blue-500" />, type: "folder", size: "--", modified: "Nov 8" },
    { name: "Resume.pdf", icon: <File className="h-5 w-5 text-red-500" />, type: "file", size: "156 KB", modified: "Oct 30" },
    { name: "Budget.xlsx", icon: <File className="h-5 w-5 text-green-600" />, type: "file", size: "89 KB", modified: "Sep 12" },
  ],
  Downloads: [
    { name: "installer.dmg", icon: <File className="h-5 w-5 text-gray-500" />, type: "file", size: "245 MB", modified: "Today" },
    { name: "photo-album.zip", icon: <File className="h-5 w-5 text-yellow-600" />, type: "file", size: "1.2 GB", modified: "Yesterday" },
    { name: "presentation.key", icon: <File className="h-5 w-5 text-blue-500" />, type: "file", size: "38 MB", modified: "Jan 10" },
  ],
  Recents: [
    { name: "Notes.txt", icon: <File className="h-5 w-5 text-gray-500" />, type: "file", size: "4 KB", modified: "Today" },
    { name: "installer.dmg", icon: <File className="h-5 w-5 text-gray-500" />, type: "file", size: "245 MB", modified: "Today" },
  ],
  Favorites: [
    { name: "Projects", icon: <Folder className="h-5 w-5 text-blue-500" />, type: "folder", size: "--", modified: "Today" },
  ],
  Pictures: [
    { name: "Vacation", icon: <Folder className="h-5 w-5 text-blue-500" />, type: "folder", size: "--", modified: "Aug 15" },
    { name: "wallpaper.jpg", icon: <Image className="h-5 w-5 text-green-500" />, type: "file", size: "5.8 MB", modified: "Jul 20" },
  ],
  Music: [
    { name: "Playlists", icon: <Folder className="h-5 w-5 text-blue-500" />, type: "folder", size: "--", modified: "Jun 5" },
    { name: "favorite-song.mp3", icon: <Music className="h-5 w-5 text-pink-500" />, type: "file", size: "8.2 MB", modified: "May 30" },
  ],
  Movies: [
    { name: "movie-clip.mp4", icon: <Film className="h-5 w-5 text-purple-500" />, type: "file", size: "1.4 GB", modified: "Apr 10" },
  ],
}

export function FinderApp() {
  const [activeTab, setActiveTab] = useState("Desktop")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const files = FILES[activeTab] || []

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className="flex w-44 flex-shrink-0 flex-col gap-0.5 p-2"
        style={{
          background: "rgba(236, 236, 236, 0.6)",
          borderRight: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#888]">
          Favorites
        </div>
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              setActiveTab(item.name)
              setSelectedFile(null)
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
      <div className="flex flex-1 flex-col">
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-1 px-4 py-2 text-[12px] text-[#666]"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <span className="text-[#999]">Macintosh HD</span>
          <ChevronRight className="h-3 w-3 text-[#999]" />
          <span>{activeTab}</span>
        </div>

        {/* Files List */}
        <div className="flex-1 p-1">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] font-medium text-[#888]" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <th className="pb-1 pl-4">Name</th>
                <th className="pb-1">Size</th>
                <th className="pb-1">Modified</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.name}
                  onClick={() => setSelectedFile(file.name)}
                  onDoubleClick={() => {
                    if (file.type === "folder") setActiveTab(file.name)
                  }}
                  className={`cursor-default transition-colors ${
                    selectedFile === file.name
                      ? "bg-[#0058d0] text-white"
                      : "hover:bg-black/[0.04] text-[#333]"
                  }`}
                >
                  <td className="flex items-center gap-2 py-1.5 pl-4">
                    <span className={selectedFile === file.name ? "text-white" : ""}>
                      {file.icon}
                    </span>
                    {file.name}
                  </td>
                  <td className="py-1.5">{file.size}</td>
                  <td className="py-1.5">{file.modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {files.length === 0 && (
            <div className="flex h-40 items-center justify-center text-[13px] text-[#999]">
              This folder is empty
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div
          className="flex items-center justify-between px-4 py-1.5 text-[11px] text-[#888]"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <span>{files.length} items</span>
          <span>200 GB available</span>
        </div>
      </div>
    </div>
  )
}
