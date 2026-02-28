import { serverApp } from "@/server/app"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const handler = (request: Request) => serverApp.fetch(request)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
export const OPTIONS = handler
export const HEAD = handler

