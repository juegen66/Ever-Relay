import { betterAuth } from "better-auth"
import { getMigrations } from "better-auth/db"
import { admin, emailOTP } from "better-auth/plugins"

import { pool } from "@/server/core/database"
import { serverConfig } from "@/server/core/config"
import { emailService } from "@/server/services/email/ses.service"

const { auth: authConfig, google } = serverConfig
const DEFAULT_USER_ROLE = "user"

export const auth = betterAuth({
  baseURL: authConfig.baseUrl,
  secret: authConfig.secret,
  database: pool,
  trustedOrigins: [authConfig.baseUrl],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    requireEmailVerification: true,
  },
  plugins: [
    admin({
      defaultRole: DEFAULT_USER_ROLE,
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === "email-verification") {
          console.log(`[OTP] Sending verification code to ${email}`)
          try {
            await emailService.sendVerificationCode(email, otp, "CloudOS")
            console.log(`[OTP] Verification code sent successfully to ${email}`)
          } catch (err) {
            console.error(`[OTP] Failed to send verification code to ${email}:`, err)
            throw err
          }
        }
      },
    }),
  ],
  ...(google.enabled
    ? {
        socialProviders: {
          google: {
            clientId: google.clientId!,
            clientSecret: google.clientSecret!,
          },
        },
      }
    : {}),
})

let migrationTask: Promise<void> | null = null

async function ensureDefaultUserRoleBackfill() {
  const result = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'user'
          AND column_name = 'role'
      ) AS "exists"
    `
  )

  if (!result.rows[0]?.exists) {
    return
  }

  await pool.query(
    `
      UPDATE "user"
      SET "role" = $1
      WHERE "role" IS NULL OR btrim("role") = ''
    `,
    [DEFAULT_USER_ROLE]
  )
}

export function ensureAuthMigrations() {
  if (migrationTask) return migrationTask

  migrationTask = (async () => {
    const { runMigrations } = await getMigrations({
      ...auth.options,
      database: pool,
    })
    await runMigrations()
    await ensureDefaultUserRoleBackfill()
  })().catch((error) => {
    migrationTask = null
    throw error
  })

  return migrationTask
}
