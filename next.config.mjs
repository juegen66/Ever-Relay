/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "@ag-ui/mastra",
    "@mastra/client-js",
    "@mastra/core",
    "mastra",
  ],
}

export default nextConfig
