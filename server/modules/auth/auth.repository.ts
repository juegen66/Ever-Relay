import { db } from "@/server/core/database"

/**
 * Auth repository — 预留扩展层
 *
 * better-auth 内部已管理 user / session 表的读写，
 * 如需在业务侧直接查询这些表（例如管理后台列出所有用户），
 * 可在此处添加方法。
 */

export const authRepository = {
  // example:
  // async findAppSetting(key: string) {
  //   return db.query.appSettings.findFirst({
  //     where: (table, { eq }) => eq(table.key, key),
  //   })
  // },
} as const

// 确保 db 引用可用（避免 tree-shake 掉 import）
void db
