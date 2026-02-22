export interface EmailAddress {
    name?: string
    email: string
}

export interface SendEmailOptions {
    to: string | string[]
    subject: string
    /** 纯文本内容 */
    text?: string
    /** HTML 内容 */
    html?: string
    /** 发件人（不传则使用默认发件人） */
    from?: string
    /** 回复地址 */
    replyTo?: string[]
}

export interface SendEmailResult {
    messageId: string
}

export interface SendTemplatedEmailOptions {
    to: string | string[]
    templateName: string
    templateData: Record<string, string>
    from?: string
}
