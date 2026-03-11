"use client"

import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { dispatchSilentCopilotMessage } from "@/shared/copilot/silent"

export function SilentTriggerTestPanel() {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = message.trim()
    if (!text || sending) {
      return
    }

    setSending(true)
    dispatchSilentCopilotMessage({
      message: text,
      followUp: true,
      resetAfterRun: true,
    })
    setMessage("")
    setSending(false)
  }

  return (
    <div className="pointer-events-none fixed left-4 top-12 z-[10030] w-[min(420px,calc(100vw-2rem))]">
      <form
        onSubmit={onSubmit}
        className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/35 bg-black/30 p-2 backdrop-blur-md"
      >
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Silent Copilot message..."
          className="h-9 border-white/40 bg-white/95 text-black placeholder:text-black/60"
        />
        <Button type="submit" size="sm" disabled={sending || !message.trim()}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  )
}
