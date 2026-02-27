export interface ApprovalInput {
  approved?: boolean
  operation: string
  destructive?: boolean
}

export function assertOperationApproved(input: ApprovalInput) {
  if (!input.destructive) {
    return {
      ok: true as const,
    }
  }

  if (input.approved) {
    return {
      ok: true as const,
    }
  }

  return {
    ok: false as const,
    error: `Operation "${input.operation}" requires approval. Retry with approved=true.`,
  }
}

