"use client"

import { create } from "zustand"

export interface DesktopNotificationItem {
  id: string
  app: string
  title: string
  message: string
  time: string
  iconColor: string
}

type DesktopNotificationInput = Omit<DesktopNotificationItem, "id">

interface DesktopNotificationStore {
  notifications: DesktopNotificationItem[]
  enqueueNotification: (notification: DesktopNotificationInput) => DesktopNotificationItem
  dismissNotification: (notificationId: string) => void
  clearNotifications: () => void
}

function createNotificationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useDesktopNotificationStore = create<DesktopNotificationStore>((set) => ({
  notifications: [],
  enqueueNotification: (notification) => {
    const nextNotification = {
      ...notification,
      id: createNotificationId(),
    }

    set((state) => ({
      notifications: [...state.notifications, nextNotification],
    }))

    return nextNotification
  },
  dismissNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== notificationId
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
