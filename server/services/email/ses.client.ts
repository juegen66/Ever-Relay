import { SESClient } from "@aws-sdk/client-ses"
import { serverConfig } from "@/server/core/config"

const { ses } = serverConfig

export const sesClient = new SESClient({
    region: ses.region,
    credentials: {
        accessKeyId: ses.accessKeyId,
        secretAccessKey: ses.secretAccessKey,
    },
})
