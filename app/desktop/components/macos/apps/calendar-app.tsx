"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

interface CalendarEvent {
  id: string
  title: string
  date: number
  time: string
  color: string
}

export function CalendarApp() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState(today.getDate())
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "1", title: "Team Standup", date: today.getDate(), time: "9:00 AM", color: "#007aff" },
    { id: "2", title: "Lunch with Sarah", date: today.getDate(), time: "12:30 PM", color: "#34c759" },
    { id: "3", title: "Design Review", date: today.getDate() + 1, time: "2:00 PM", color: "#ff9500" },
    { id: "4", title: "Gym", date: today.getDate() + 1, time: "6:00 PM", color: "#ff3b30" },
    { id: "5", title: "Coffee Meeting", date: today.getDate() + 3, time: "10:00 AM", color: "#5856d6" },
    { id: "6", title: "Project Deadline", date: today.getDate() + 5, time: "5:00 PM", color: "#ff3b30" },
  ])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState("")

  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()

  const calendarDays: { day: number; isCurrentMonth: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true })
  }
  const remaining = 42 - calendarDays.length
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false })
  }

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const selectedEvents = events.filter((e) => e.date === selectedDate)

  const addEvent = () => {
    if (newEventTitle.trim()) {
      const colors = ["#007aff", "#34c759", "#ff9500", "#ff3b30", "#5856d6"]
      setEvents([
        ...events,
        {
          id: String(Date.now()),
          title: newEventTitle,
          date: selectedDate,
          time: "12:00 PM",
          color: colors[Math.floor(Math.random() * colors.length)],
        },
      ])
      setNewEventTitle("")
      setShowAddEvent(false)
    }
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear()

  return (
    <div className="flex h-full" style={{ background: "#fff" }}>
      {/* Calendar Grid */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="rounded-md p-1 hover:bg-black/5" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4 text-[#666]" />
            </button>
            <h2 className="text-[17px] font-semibold text-[#333]">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="rounded-md p-1 hover:bg-black/5" aria-label="Next month">
              <ChevronRight className="h-4 w-4 text-[#666]" />
            </button>
          </div>
          <button
            onClick={() => {
              setCurrentMonth(today.getMonth())
              setCurrentYear(today.getFullYear())
              setSelectedDate(today.getDate())
            }}
            className="rounded-md px-3 py-1 text-[13px] text-[#007aff] hover:bg-blue-50"
          >
            Today
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-[#e5e5ea]">
          {DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-[11px] font-semibold text-[#999]">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid flex-1 grid-cols-7 grid-rows-6">
          {calendarDays.map((item, i) => {
            const hasEvents = item.isCurrentMonth && events.some((e) => e.date === item.day)
            const isSelected = item.isCurrentMonth && item.day === selectedDate
            return (
              <button
                key={i}
                onClick={() => item.isCurrentMonth && setSelectedDate(item.day)}
                className={`relative flex flex-col items-center pt-1.5 border-b border-r border-[#f0f0f0] transition-colors text-[13px] ${
                  !item.isCurrentMonth ? "text-[#ccc]" : isSelected ? "bg-blue-50" : "text-[#333] hover:bg-black/[0.02]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${
                    isToday(item.day) && item.isCurrentMonth
                      ? "bg-[#007aff] text-white font-semibold"
                      : ""
                  }`}
                >
                  {item.day}
                </span>
                {hasEvents && (
                  <div className="mt-0.5 flex gap-0.5">
                    {events
                      .filter((e) => e.date === item.day)
                      .slice(0, 3)
                      .map((e) => (
                        <div key={e.id} className="h-1 w-1 rounded-full" style={{ background: e.color }} />
                      ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Events Sidebar */}
      <div className="flex w-56 flex-shrink-0 flex-col" style={{ borderLeft: "1px solid rgba(0,0,0,0.06)", background: "rgba(250,250,250,0.95)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-[14px] font-semibold text-[#333]">
            {MONTHS[currentMonth]} {selectedDate}
          </h3>
          <button onClick={() => setShowAddEvent(!showAddEvent)} className="rounded-md p-1 hover:bg-black/5" aria-label="Add event">
            <Plus className="h-4 w-4 text-[#007aff]" />
          </button>
        </div>

        {showAddEvent && (
          <div className="border-b border-[#e5e5ea] p-3">
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEvent()}
              placeholder="New Event"
              className="w-full rounded-md border border-[#e5e5ea] px-3 py-1.5 text-[13px] text-[#333] outline-none focus:border-[#007aff]"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button onClick={addEvent} className="flex-1 rounded-md bg-[#007aff] py-1 text-[12px] text-white hover:bg-[#0066dd]">
                Add
              </button>
              <button onClick={() => setShowAddEvent(false)} className="flex-1 rounded-md bg-[#e5e5ea] py-1 text-[12px] text-[#333] hover:bg-[#d5d5da]">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <div key={event.id} className="flex gap-2.5 rounded-lg bg-white p-2.5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
                <div className="mt-0.5 h-full w-0.5 rounded-full" style={{ background: event.color, minHeight: "32px" }} />
                <div>
                  <div className="text-[13px] font-medium text-[#333]">{event.title}</div>
                  <div className="text-[11px] text-[#999]">{event.time}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-20 items-center justify-center text-[13px] text-[#bbb]">
              No events
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
