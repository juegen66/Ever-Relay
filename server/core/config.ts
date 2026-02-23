export const serverConfig = {
  database: {
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/postgres",
  },

  auth: {
    baseUrl:
      process.env.BETTER_AUTH_URL ??
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
      "http://localhost:3000",

    secret:
      process.env.BETTER_AUTH_SECRET ??
      "replace-this-with-a-secure-secret-at-least-32-characters",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    get enabled() {
      return Boolean(this.clientId && this.clientSecret)
    },
  },

  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    region: process.env.AWS_REGION ?? "ap-east-1",
    bucketName: process.env.AWS_S3_BUCKET_NAME ?? "",
    endpoint: process.env.AWS_S3_ENDPOINT,
    get enabled() {
      return Boolean(this.accessKeyId && this.secretAccessKey && this.bucketName)
    },
  },

  ses: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? "",
    region: process.env.AWS_SES_REGION ?? process.env.AWS_REGION ?? "ap-east-1",
    defaultFrom: process.env.AWS_SES_DEFAULT_FROM ?? "noreply@example.com",
    get enabled() {
      return Boolean(this.accessKeyId && this.secretAccessKey && this.defaultFrom)
    },
  },

  imageProcessing: {
    removeBgApiKey: process.env.REMOVE_BG_API_KEY ?? "",
    get enabled() {
      return Boolean(this.removeBgApiKey)
    },
  },
} as const
