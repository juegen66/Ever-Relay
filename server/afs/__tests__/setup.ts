import { vi } from "vitest"

// Mock 整个数据库模块，各测试文件内按需定义返回值
vi.mock("@/server/core/database", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      afsMemory: { findFirst: vi.fn() },
      afsHistory: { findFirst: vi.fn() },
    },
  },
}))
