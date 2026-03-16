import { config } from "dotenv"
import path from "path"

// Load .env for DATABASE_URL (no db mock - use real database)
config({ path: path.resolve(process.cwd(), ".env") })
config({ path: path.resolve(process.cwd(), "..", ".env") })

// Use separate test DB when DATABASE_TEST_URL is set
if (process.env.DATABASE_TEST_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_TEST_URL
}
