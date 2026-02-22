import {
    SendEmailCommand,
    SendTemplatedEmailCommand,
} from "@aws-sdk/client-ses"

import { sesClient } from "./ses.client"
import { serverConfig } from "@/server/core/config"
import type {
    SendEmailOptions,
    SendEmailResult,
    SendTemplatedEmailOptions,
} from "./ses.types"

const DEFAULT_FROM = serverConfig.ses.defaultFrom

function toArray(value: string | string[]): string[] {
    return Array.isArray(value) ? value : [value]
}

export class EmailService {
    /**
     * 发送邮件（支持纯文本和 HTML）
     */
    async send(options: SendEmailOptions): Promise<SendEmailResult> {
        const { to, subject, text, html, from, replyTo } = options

        const result = await sesClient.send(
            new SendEmailCommand({
                Source: from ?? DEFAULT_FROM,
                Destination: {
                    ToAddresses: toArray(to),
                },
                Message: {
                    Subject: { Data: subject, Charset: "UTF-8" },
                    Body: {
                        ...(text ? { Text: { Data: text, Charset: "UTF-8" } } : {}),
                        ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
                    },
                },
                ...(replyTo ? { ReplyToAddresses: replyTo } : {}),
            })
        )

        return { messageId: result.MessageId ?? "" }
    }

    /**
     * 使用 SES 模板发送邮件
     */
    async sendTemplated(
        options: SendTemplatedEmailOptions
    ): Promise<SendEmailResult> {
        const { to, templateName, templateData, from } = options

        const result = await sesClient.send(
            new SendTemplatedEmailCommand({
                Source: from ?? DEFAULT_FROM,
                Destination: {
                    ToAddresses: toArray(to),
                },
                Template: templateName,
                TemplateData: JSON.stringify(templateData),
            })
        )

        return { messageId: result.MessageId ?? "" }
    }

    /**
     * 发送验证码邮件（便捷方法）
     */
    async sendVerificationCode(
        to: string,
        code: string,
        appName = "Apple Browser"
    ): Promise<SendEmailResult> {
        const html = this.buildVerificationCodeHtml(code, appName)
        return this.send({
            to,
            subject: `【${appName}】您的验证码`,
            html,
        })
    }

    /**
     * 构建验证码邮件 HTML 模板
     */
    private buildVerificationCodeHtml(code: string, appName: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 440px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
          <!-- 顶部装饰条 -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #0071e3, #00c7be);"></td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <!-- 应用名称 -->
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #0071e3; letter-spacing: 0.5px;">
                ${this.escapeHtml(appName)}
              </p>
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 600; color: #1d1d1f;">
                邮箱验证码
              </h1>
              <p style="margin: 0 0 28px; font-size: 15px; color: #6e6e73; line-height: 1.6;">
                您正在进行验证操作，请输入以下验证码完成验证：
              </p>
              <!-- 验证码区块 -->
              <div style="background: linear-gradient(135deg, #f5f5f7 0%, #ebebed 100%); border: 1px solid rgba(0, 0, 0, 0.06); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d1d1f; font-variant-numeric: tabular-nums;">
                  ${this.escapeHtml(code)}
                </span>
              </div>
              <!-- 安全提示 -->
              <div style="background: #fff9e6; border-radius: 8px; padding: 16px; border-left: 4px solid #f5a623;">
                <p style="margin: 0; font-size: 13px; color: #8b6914; line-height: 1.5;">
                  ⏱ 验证码有效期为 <strong>10 分钟</strong>，请尽快完成验证。<br>
                  🔒 切勿将验证码分享给他人，我们不会以任何理由向您索要验证码。
                </p>
              </div>
              <!-- 页脚 -->
              <p style="margin: 28px 0 0; font-size: 12px; color: #86868b; line-height: 1.5;">
                如非您本人操作，请忽略此邮件。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
    }

    /** 转义 HTML 防止 XSS */
    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }
        return text.replace(/[&<>"']/g, (c) => map[c] ?? c)
    }
}

export const emailService = new EmailService()
