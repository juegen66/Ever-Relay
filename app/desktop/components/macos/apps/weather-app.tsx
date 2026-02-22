"use client"

import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, Wind, Droplets, Eye, Thermometer, Gauge } from "lucide-react"
import { useState } from "react"

interface HourlyForecast {
  time: string
  temp: number
  icon: React.ReactNode
}

interface DailyForecast {
  day: string
  high: number
  low: number
  icon: React.ReactNode
  condition: string
}

const HOURLY: HourlyForecast[] = [
  { time: "Now", temp: 18, icon: <Sun className="h-5 w-5 text-yellow-300" /> },
  { time: "1PM", temp: 19, icon: <Sun className="h-5 w-5 text-yellow-300" /> },
  { time: "2PM", temp: 20, icon: <Cloud className="h-5 w-5 text-white/70" /> },
  { time: "3PM", temp: 19, icon: <Cloud className="h-5 w-5 text-white/70" /> },
  { time: "4PM", temp: 17, icon: <CloudDrizzle className="h-5 w-5 text-blue-200" /> },
  { time: "5PM", temp: 16, icon: <CloudRain className="h-5 w-5 text-blue-200" /> },
  { time: "6PM", temp: 15, icon: <CloudRain className="h-5 w-5 text-blue-200" /> },
  { time: "7PM", temp: 14, icon: <Cloud className="h-5 w-5 text-white/70" /> },
  { time: "8PM", temp: 13, icon: <Cloud className="h-5 w-5 text-white/60" /> },
]

const DAILY: DailyForecast[] = [
  { day: "Today", high: 20, low: 12, icon: <Sun className="h-5 w-5 text-yellow-300" />, condition: "Sunny" },
  { day: "Tue", high: 18, low: 11, icon: <Cloud className="h-5 w-5 text-white/70" />, condition: "Cloudy" },
  { day: "Wed", high: 15, low: 9, icon: <CloudRain className="h-5 w-5 text-blue-200" />, condition: "Rain" },
  { day: "Thu", high: 14, low: 8, icon: <CloudRain className="h-5 w-5 text-blue-200" />, condition: "Rain" },
  { day: "Fri", high: 17, low: 10, icon: <Sun className="h-5 w-5 text-yellow-300" />, condition: "Sunny" },
  { day: "Sat", high: 19, low: 11, icon: <Sun className="h-5 w-5 text-yellow-300" />, condition: "Clear" },
  { day: "Sun", high: 16, low: 9, icon: <CloudSnow className="h-5 w-5 text-blue-100" />, condition: "Snow" },
]

const CITIES = ["San Francisco", "New York", "London", "Tokyo", "Sydney"]

export function WeatherApp() {
  const [city] = useState("San Francisco")

  return (
    <div
      className="flex h-full flex-col overflow-auto"
      style={{
        background: "linear-gradient(180deg, #4a90d9 0%, #357abd 40%, #2a6cb0 100%)",
        color: "white",
      }}
    >
      {/* City Selector */}
      <div className="flex items-center gap-2 px-4 pt-3">
        {CITIES.map((c) => (
          <span
            key={c}
            className={`text-[11px] rounded-full px-2 py-0.5 transition-colors ${
              c === city ? "bg-white/20 text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Current Weather */}
      <div className="flex flex-col items-center pt-4 pb-3">
        <div className="text-[14px] text-white/80">{city}</div>
        <div className="text-[72px] font-extralight leading-none mt-1" style={{ letterSpacing: "-4px" }}>
          {"18\u00B0"}
        </div>
        <div className="text-[16px] text-white/80 mt-1">Mostly Sunny</div>
        <div className="flex items-center gap-3 mt-1 text-[14px]">
          <span className="text-white/60">{"H:20\u00B0"}</span>
          <span className="text-white/60">{"L:12\u00B0"}</span>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="mx-4 rounded-xl bg-white/10 p-3 mb-3" style={{ backdropFilter: "blur(10px)" }}>
        <div className="text-[11px] text-white/50 mb-2 uppercase tracking-wider font-medium">Hourly Forecast</div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {HOURLY.map((h) => (
            <div key={h.time} className="flex flex-col items-center gap-1 min-w-[40px]">
              <span className="text-[12px] text-white/70">{h.time}</span>
              {h.icon}
              <span className="text-[14px] font-medium">{h.temp}{"\u00B0"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="mx-4 rounded-xl bg-white/10 p-3 mb-3" style={{ backdropFilter: "blur(10px)" }}>
        <div className="text-[11px] text-white/50 mb-2 uppercase tracking-wider font-medium">7-Day Forecast</div>
        <div className="space-y-2">
          {DAILY.map((d) => (
            <div key={d.day} className="flex items-center gap-3 text-[13px]">
              <span className="w-10 text-white/80">{d.day}</span>
              {d.icon}
              <span className="text-[11px] text-white/50 w-16">{d.condition}</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-white/50 text-[12px]">{d.low}{"\u00B0"}</span>
                <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${((d.high - d.low) / 15) * 100}%`,
                      marginLeft: `${((d.low - 5) / 20) * 100}%`,
                      background: `linear-gradient(90deg, #4dc9f6, #f7e746, #f88e53)`,
                    }}
                  />
                </div>
                <span className="text-white text-[12px]">{d.high}{"\u00B0"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="mx-4 grid grid-cols-2 gap-3 pb-4">
        {[
          { label: "UV Index", value: "5", sub: "Moderate", icon: <Sun className="h-4 w-4" /> },
          { label: "Wind", value: "12 km/h", sub: "NW", icon: <Wind className="h-4 w-4" /> },
          { label: "Humidity", value: "62%", sub: "Moderate", icon: <Droplets className="h-4 w-4" /> },
          { label: "Visibility", value: "16 km", sub: "Clear", icon: <Eye className="h-4 w-4" /> },
          { label: "Feels Like", value: "17\u00B0", sub: "Similar", icon: <Thermometer className="h-4 w-4" /> },
          { label: "Pressure", value: "1015 hPa", sub: "Normal", icon: <Gauge className="h-4 w-4" /> },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/10 p-3" style={{ backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-1.5 text-[11px] text-white/50 uppercase tracking-wider mb-1">
              {item.icon}
              {item.label}
            </div>
            <div className="text-[20px] font-medium">{item.value}</div>
            <div className="text-[11px] text-white/50">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
