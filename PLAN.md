# 云端文件系统实施计划

     - 弹窗背景：米白 #f6f1e6
      - 边框/文字：绿色系 #8fa889 / #2f4f2f
      - 确认按钮：绿色底 #5f7d5f

## 目标
桌面上创建文件/文件夹时，元数据持久化到数据库，文件内容上传到 S3。实现云端文件系统。

## 现有资源
- S3 服务: `server/services/storage/s3.service.ts` (upload, presign, delete 全部就绪)
- 客户端上传: `lib/storage/upload.ts` (presigned URL 上传就绪)
- Drizzle ORM + PostgreSQL 已配置
- Zustand store: `lib/stores/desktop-items-store.ts` (纯内存，需改为 API 同步)

## 实施步骤 (5 步)

### Step 1: 数据库表 — `server/db/schema.ts`
新增 `desktopItems` 表:
- `id` (uuid, PK)
- `userId` (text, NOT NULL, 关联 better-auth user)
- `name` (text, NOT NULL)
- `itemType` (text, NOT NULL, folder/text/image/code/spreadsheet/generic)
- `parentId` (text, nullable, 自引用实现文件夹层级)
- `x`, `y` (integer, 桌面位置)
- `s3Key` (text, nullable, 文件夹没有 S3 key)
- `fileSize` (integer, nullable)
- `mimeType` (text, nullable)
- `createdAt`, `updatedAt` (timestamp)

然后运行 `pnpm drizzle-kit generate` 生成迁移。

### Step 2: 服务端 API — `server/modules/files/`
创建 3 个文件:
- `files.route.ts` — 注册路由到 Hono app
- `files.controller.ts` — 处理请求/响应
- `files.service.ts` — 数据库 CRUD 逻辑

API 端点 (全部需要 authMiddleware):
| Method | Path | 功能 |
|--------|------|------|
| GET | `/api/files` | 获取当前用户所有桌面项 |
| POST | `/api/files` | 创建文件/文件夹 (含 S3 key) |
| PATCH | `/api/files/:id` | 更新 (改名、移动位置、移入文件夹) |
| DELETE | `/api/files/:id` | 删除 (同时删 S3 文件) |

### Step 3: 注册路由 — `server/app.ts`
导入并注册 `registerFilesRoutes`。

### Step 4: 客户端 Store — `lib/stores/desktop-items-store.ts`
改造为 API 同步:
- 新增 `fetchItems()`: 启动时从 API 加载用户的所有桌面项
- `createFolder/createFile`: 先调 POST API，成功后更新本地状态
- `renameItem`: 调 PATCH API
- `moveItem`: 调 PATCH API
- `moveIntoFolder/moveItemToDesktop`: 调 PATCH API
- `deleteItem`: 调 DELETE API，服务端同时清理 S3
- 新增 `loading` 状态标记

### Step 5: Desktop 组件 — `app/desktop/components/macos/desktop.tsx`
- 在 `Desktop` 组件挂载时调用 `fetchItems()` 加载数据
