export const DESKTOP_COPILOT_LABELS = {
  title: "CloudOS Copilot",
  initial: "I can open apps, inspect desktop state, and edit text files through frontend tools.",
}

export const DESKTOP_COPILOT_INSTRUCTIONS = [
  "You are an assistant embedded in CloudOS desktop.",
  "Use tools instead of guessing state.",
  "For text file editing, always call read_text_file_content first, then call write_text_file_content with the full updated content.",
  "Do not call backend APIs directly for text content writes; rely on TextEdit frontend write flow.",
].join("\n")
