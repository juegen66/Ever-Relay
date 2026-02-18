import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import Database from "better-sqlite3"
import { betterAuth } from "better-auth"
import { getMigrations } from "better-auth/db"

const authBaseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
  "http://localhost:3000"

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  "replace-this-with-a-secure-secret-at-least-32-characters"

const databasePath = join(process.cwd(), "data", "better-auth.db")
mkdirSync(dirname(databasePath), { recursive: true })

const sqlite = new Database(databasePath)
sqlite.pragma("journal_mode = WAL")

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const hasGoogleAuth = Boolean(googleClientId && googleClientSecret)

export const auth = betterAuth({
  baseURL: authBaseUrl,
  secret: authSecret,
  database: sqlite,
  trustedOrigins: [authBaseUrl],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  ...(hasGoogleAuth
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
          },
        },
      }
    : {}),
})

let migrationTask: Promise<void> | null = null

export function ensureAuthMigrations() {
  if (migrationTask) return migrationTask

  migrationTask = (async () => {
    const { runMigrations } = await getMigrations({
      ...auth.options,
      database: sqlite,
    })
    await runMigrations()
  })().catch((error) => {
    migrationTask = null
    throw error
  })

  return migrationTask
}

