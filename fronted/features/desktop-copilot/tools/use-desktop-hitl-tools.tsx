"use client"

import { useCallback } from "react"

import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core"


import { toDesktopItemType } from "@/lib/desktop-items"
import { useDesktopItemsStore } from "@/lib/stores/desktop-items-store"
import { findMatchingDesktopItem } from "@/shared/copilot/desktop-item-identity"

import {
  CREATE_ITEM_PARAMS,
  DELETE_ITEM_PARAMS,
  RENAME_ITEM_PARAMS,
  toErrorMessage,
  toolErr,
  toolOk,
} from "./types"
import { ApprovalCard } from "../components/approval-card"

import type { ActionRenderPropsWait } from "@copilotkit/react-core"

export function useDesktopHitlTools() {
  const createItem = useDesktopItemsStore((state) => state.createItem)
  const renameItem = useDesktopItemsStore((state) => state.renameItem)
  const deleteItem = useDesktopItemsStore((state) => state.deleteItem)
  const fetchItems = useDesktopItemsStore((state) => state.fetchItems)

  const readDesktopFoldersFromCache = useCallback(() => {
    return useDesktopItemsStore.getState().desktopFolders
  }, [])

  const refreshDesktopItems = useCallback(async () => {
    await fetchItems()
  }, [fetchItems])

  const createDesktopItem = useCallback(
    async (args: { name: string; itemType?: string; parentId?: string }) => {
      const normalizedType = toDesktopItemType(args.itemType)
      const name = args.name.trim()
      const targetIdentity = {
        name,
        itemType: normalizedType,
        parentId: args.parentId ?? null,
      }

      if (!name) {
        return toolErr("Item name cannot be empty")
      }

      let existingItem = findMatchingDesktopItem(readDesktopFoldersFromCache(), targetIdentity)

      if (!existingItem) {
        await refreshDesktopItems()
        existingItem = findMatchingDesktopItem(readDesktopFoldersFromCache(), targetIdentity)
      }

      if (existingItem) {
        return toolOk(
          `Succeeded: desktop item already existed — reusing "${existingItem.name}" (${existingItem.id}).`,
          {
            created: false,
            alreadyExists: true,
            item: {
              id: existingItem.id,
              name: existingItem.name,
              itemType: existingItem.itemType ?? normalizedType,
            },
          }
        )
      }

      const item = await createItem({
        name,
        itemType: normalizedType,
        parentId: args.parentId || undefined,
      })
      if (!item) {
        return toolErr("Failed to create item")
      }

      await refreshDesktopItems()

      return toolOk(`Succeeded: created desktop item "${item.name}" (${item.id}).`, {
        created: true,
        alreadyExists: false,
        item: {
          id: item.id,
          name: item.name,
          itemType: item.itemType,
        },
      })
    },
    [createItem, readDesktopFoldersFromCache, refreshDesktopItems]
  )

  useFrontendTool(
    {
      name: "create_desktop_item",
      description:
        "Create a desktop item (file/folder) directly without approval. If the same name, itemType, and parentId already exist, return the existing item instead of creating a duplicate.",
      parameters: CREATE_ITEM_PARAMS,
      handler: async (args) => {
        try {
          return await createDesktopItem({
            name: String(args.name ?? ""),
            itemType: typeof args.itemType === "string" ? args.itemType : undefined,
            parentId: typeof args.parentId === "string" ? args.parentId : undefined,
          })
        } catch (error) {
          return toolErr(toErrorMessage(error))
        }
      },
    },
    [createDesktopItem]
  )

  useHumanInTheLoop(
    {
      name: "rename_desktop_item",
      description: "Rename a desktop item. Always requires user approval.",
      parameters: RENAME_ITEM_PARAMS,
      render: ({ status, args, respond, result }: ActionRenderPropsWait) => (
        <ApprovalCard
          title="Rename Desktop Item"
          summary={JSON.stringify(args ?? {}, null, 2)}
          status={status}
          result={result}
          onApprove={async () => {
            if (status !== "executing" || !respond) return

            try {
              const id = String(args.id ?? "")
              const name = String(args.name ?? "").trim()
              if (!id || !name) {
                respond(
                  toolErr("id and name are required", {
                    approved: false,
                  })
                )
                return
              }

              await renameItem(id, name)
              await refreshDesktopItems()
              const renamed = readDesktopFoldersFromCache().find((item) => item.id === id)
              if (!renamed || renamed.name !== name) {
                respond(
                  toolErr("Failed to rename item", {
                    approved: false,
                  })
                )
                return
              }

              respond(
                toolOk(`Succeeded: renamed item to "${renamed.name}".`, {
                  approved: true,
                  id: renamed.id,
                  name: renamed.name,
                })
              )
            } catch (error) {
              respond(
                toolErr(toErrorMessage(error), {
                  approved: false,
                })
              )
            }
          }}
          onReject={() => {
            if (status !== "executing" || !respond) return
            respond({
              approved: false,
              cancelled: true,
              ok: false,
              message: "Failed: user rejected the rename request",
            })
          }}
        />
      ),
    },
    [readDesktopFoldersFromCache, refreshDesktopItems, renameItem]
  )

  useHumanInTheLoop(
    {
      name: "delete_desktop_item",
      description: "Delete a desktop item. Always requires user approval.",
      parameters: DELETE_ITEM_PARAMS,
      render: ({ status, args, respond, result }: ActionRenderPropsWait) => (
        <ApprovalCard
          title="Delete Desktop Item"
          summary={JSON.stringify(args ?? {}, null, 2)}
          status={status}
          result={result}
          onApprove={async () => {
            if (status !== "executing" || !respond) return

            try {
              const id = String(args.id ?? "")
              if (!id) {
                respond(toolErr("id is required", { approved: false }))
                return
              }

              await deleteItem(id)
              await refreshDesktopItems()
              const deleted = !readDesktopFoldersFromCache().some((item) => item.id === id)
              if (!deleted) {
                respond(toolErr("Failed to delete item", { approved: false }))
                return
              }
              respond(
                toolOk(`Succeeded: deleted desktop item ${id}.`, {
                  approved: true,
                  id,
                })
              )
            } catch (error) {
              respond(
                toolErr(toErrorMessage(error), {
                  approved: false,
                })
              )
            }
          }}
          onReject={() => {
            if (status !== "executing" || !respond) return
            respond({
              approved: false,
              cancelled: true,
              ok: false,
              message: "Cancelled: user declined the delete request",
            })
          }}
        />
      ),
    },
    [deleteItem, readDesktopFoldersFromCache, refreshDesktopItems]
  )
}
