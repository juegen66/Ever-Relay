"use client"

import type { QueryClient } from "@tanstack/react-query"

import { filesApi } from "@/lib/api/modules/files"
import type { CreateFileParams, FileItem, UpdateFileParams } from "@/lib/api/modules/files"
import { filesQueryKeys, getCachedFileItems, setCachedFileItems } from "@/lib/query/files"

function patchFileItem(item: FileItem, params: UpdateFileParams): FileItem {
  return {
    ...item,
    name: params.name ?? item.name,
    parentId: params.parentId === undefined ? item.parentId : params.parentId,
    x: params.x ?? item.x,
    y: params.y ?? item.y,
    updatedAt: new Date().toISOString(),
  }
}

function collectNestedItemIds(items: FileItem[], rootId: string) {
  const ids = new Set<string>([rootId])
  let hasNew = true

  while (hasNew) {
    hasNew = false
    for (const item of items) {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id)
        hasNew = true
      }
    }
  }

  return ids
}

export async function fetchDesktopItems(queryClient: QueryClient) {
  await queryClient.fetchQuery({
    queryKey: filesQueryKeys.items,
    queryFn: () => filesApi.list(),
  })
}

export async function createDesktopItem(
  queryClient: QueryClient,
  params: CreateFileParams
) {
  const created = await filesApi.create(params)

  setCachedFileItems(queryClient, (items) => [...items, created])
  queryClient.setQueryData(filesQueryKeys.item(created.id), created)
  await queryClient.invalidateQueries({ queryKey: filesQueryKeys.items })

  return created
}

export function moveDesktopItemInCache(
  queryClient: QueryClient,
  id: string,
  x: number,
  y: number
) {
  setCachedFileItems(queryClient, (items) => {
    return items.map((item) => (item.id === id ? { ...item, x, y } : item))
  })
}

export async function updateDesktopItem(
  queryClient: QueryClient,
  id: string,
  params: UpdateFileParams
) {
  const previousItems = getCachedFileItems(queryClient)
  const previousItem = queryClient.getQueryData<FileItem>(filesQueryKeys.item(id))

  setCachedFileItems(queryClient, (items) => {
    return items.map((item) => (item.id === id ? patchFileItem(item, params) : item))
  })

  if (previousItem) {
    queryClient.setQueryData(filesQueryKeys.item(id), patchFileItem(previousItem, params))
  }

  try {
    const updated = await filesApi.update(id, params)
    setCachedFileItems(queryClient, (items) => {
      return items.map((item) => (item.id === updated.id ? updated : item))
    })
    queryClient.setQueryData(filesQueryKeys.item(updated.id), updated)
    await queryClient.invalidateQueries({ queryKey: filesQueryKeys.items })
    return updated
  } catch (error) {
    queryClient.setQueryData(filesQueryKeys.items, previousItems)
    if (previousItem) {
      queryClient.setQueryData(filesQueryKeys.item(id), previousItem)
    }
    throw error
  }
}

export async function deleteDesktopItem(queryClient: QueryClient, id: string) {
  const previousItems = getCachedFileItems(queryClient)
  const removedIds = [...collectNestedItemIds(previousItems, id)]
  const removedIdSet = new Set(removedIds)

  setCachedFileItems(queryClient, (items) => {
    return items.filter((item) => !removedIdSet.has(item.id))
  })

  for (const removedId of removedIds) {
    queryClient.removeQueries({ queryKey: filesQueryKeys.item(removedId) })
    queryClient.removeQueries({ queryKey: filesQueryKeys.content(removedId) })
  }

  try {
    await filesApi.remove(id)
    await queryClient.invalidateQueries({ queryKey: filesQueryKeys.items })
  } catch (error) {
    queryClient.setQueryData(filesQueryKeys.items, previousItems)
    throw error
  }
}
