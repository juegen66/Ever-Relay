import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import { filesApi } from "@/lib/api/modules/files"
import type {
  CreateFileParams,
  FileContentResponseData,
  FileItem,
  UpdateFileParams,
} from "@/lib/api/modules/files"

export const filesQueryKeys = {
  all: ["files"] as const,
  items: ["files", "items"] as const,
  item: (id: string) => ["files", "item", id] as const,
  content: (id: string) => ["files", "content", id] as const,
}

export function useDesktopItemsQuery() {
  return useQuery({
    queryKey: filesQueryKeys.items,
    queryFn: () => filesApi.list(),
  })
}

export function getCachedFileItems(queryClient: QueryClient) {
  return queryClient.getQueryData<FileItem[]>(filesQueryKeys.items) ?? []
}

export function setCachedFileItems(
  queryClient: QueryClient,
  updater: (items: FileItem[]) => FileItem[]
) {
  queryClient.setQueryData<FileItem[]>(filesQueryKeys.items, (current) => {
    return updater(current ?? [])
  })
}

function createOptimisticFileItem(params: CreateFileParams): FileItem {
  const now = new Date().toISOString()

  return {
    id: `optimistic-${Math.random().toString(36).slice(2)}`,
    userId: "optimistic-user",
    name: params.name,
    itemType: params.itemType,
    parentId: params.parentId ?? null,
    x: params.x,
    y: params.y,
    content: params.content ?? null,
    contentVersion: 1,
    fileSize: params.fileSize ?? null,
    mimeType: params.mimeType ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

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

interface CreateFileMutationContext {
  previousItems: FileItem[]
  optimisticId: string
}

export function useCreateFileMutation() {
  const queryClient = useQueryClient()

  return useMutation<FileItem, Error, CreateFileParams, CreateFileMutationContext>({
    mutationFn: (params) => filesApi.create(params),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: filesQueryKeys.items })

      const previousItems = getCachedFileItems(queryClient)
      const optimisticItem = createOptimisticFileItem(params)
      setCachedFileItems(queryClient, (items) => [...items, optimisticItem])

      return {
        previousItems,
        optimisticId: optimisticItem.id,
      }
    },
    onError: (_error, _params, context) => {
      queryClient.setQueryData(filesQueryKeys.items, context?.previousItems ?? [])
    },
    onSuccess: (createdItem, _params, context) => {
      setCachedFileItems(queryClient, (items) => {
        const withoutOptimistic = items.filter((item) => item.id !== context.optimisticId)
        return [...withoutOptimistic, createdItem]
      })
      queryClient.setQueryData(filesQueryKeys.item(createdItem.id), createdItem)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: filesQueryKeys.items })
    },
  })
}

interface UpdateFileMutationVariables {
  id: string
  params: UpdateFileParams
}

interface UpdateFileMutationContext {
  previousItems: FileItem[]
  previousItem?: FileItem
}

export function useUpdateFileMutation() {
  const queryClient = useQueryClient()

  return useMutation<FileItem, Error, UpdateFileMutationVariables, UpdateFileMutationContext>({
    mutationFn: ({ id, params }) => filesApi.update(id, params),
    onMutate: async ({ id, params }) => {
      await queryClient.cancelQueries({ queryKey: filesQueryKeys.items })
      await queryClient.cancelQueries({ queryKey: filesQueryKeys.item(id) })

      const previousItems = getCachedFileItems(queryClient)
      const previousItem = queryClient.getQueryData<FileItem>(filesQueryKeys.item(id))

      setCachedFileItems(queryClient, (items) => {
        return items.map((item) => (item.id === id ? patchFileItem(item, params) : item))
      })

      if (previousItem) {
        queryClient.setQueryData<FileItem>(
          filesQueryKeys.item(id),
          patchFileItem(previousItem, params)
        )
      }

      return { previousItems, previousItem }
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(filesQueryKeys.items, context?.previousItems ?? [])
      if (context?.previousItem) {
        queryClient.setQueryData(filesQueryKeys.item(variables.id), context.previousItem)
      }
    },
    onSuccess: (updatedItem) => {
      setCachedFileItems(queryClient, (items) => {
        return items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      })
      queryClient.setQueryData(filesQueryKeys.item(updatedItem.id), updatedItem)
    },
    onSettled: async (_result, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: filesQueryKeys.items }),
        queryClient.invalidateQueries({ queryKey: filesQueryKeys.item(variables.id) }),
      ])
    },
  })
}

interface DeleteFileMutationContext {
  previousItems: FileItem[]
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string, DeleteFileMutationContext>({
    mutationFn: async (id) => {
      await filesApi.remove(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: filesQueryKeys.items })

      const previousItems = getCachedFileItems(queryClient)
      const removedIds = [...collectNestedItemIds(previousItems, id)]

      setCachedFileItems(queryClient, (items) => {
        const removedIdSet = new Set(removedIds)
        return items.filter((item) => !removedIdSet.has(item.id))
      })

      for (const removedId of removedIds) {
        queryClient.removeQueries({ queryKey: filesQueryKeys.item(removedId) })
        queryClient.removeQueries({ queryKey: filesQueryKeys.content(removedId) })
      }

      return { previousItems }
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(filesQueryKeys.items, context?.previousItems ?? [])
    },
    onSettled: async (_result, _error, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: filesQueryKeys.items }),
        queryClient.invalidateQueries({ queryKey: filesQueryKeys.item(id) }),
      ])
    },
  })
}

interface UpdateFileContentMutationVariables {
  id: string
  content: string
  contentVersion: number
}

interface UpdateFileContentMutationContext {
  previousContent?: FileContentResponseData
}

export function useUpdateFileContentMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateFileContentMutationVariables, UpdateFileContentMutationContext>({
    mutationFn: async ({ id, content, contentVersion }) => {
      await filesApi.updateContent(id, content, contentVersion)
    },
    onMutate: async ({ id, content, contentVersion }) => {
      await queryClient.cancelQueries({ queryKey: filesQueryKeys.content(id) })

      const previousContent = queryClient.getQueryData<FileContentResponseData>(
        filesQueryKeys.content(id)
      )

      queryClient.setQueryData<FileContentResponseData>(
        filesQueryKeys.content(id),
        {
          content,
          contentVersion: contentVersion + 1,
        }
      )

      return { previousContent }
    },
    onError: (_error, variables, context) => {
      if (context?.previousContent) {
        queryClient.setQueryData(filesQueryKeys.content(variables.id), context.previousContent)
      }
    },
    onSettled: async (_result, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: filesQueryKeys.content(variables.id),
      })
    },
  })
}
