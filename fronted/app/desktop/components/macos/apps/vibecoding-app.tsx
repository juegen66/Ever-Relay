"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  Code2,
  ExternalLink,
  Eye,
  FolderOpen,
  Loader2,
  RefreshCcw,
  Sparkles,
  Wand2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type AppView = "dashboard" | "workspace"
type WorkspaceTab = "preview" | "code"

interface Project {
  id: string
  name: string
  updatedAt: string
  description: string
}

interface ProjectFragment {
  id: string
  title: string
  html: string
  files: Record<string, string>
}

interface ChatMessage {
  id: string
  role: "assistant" | "user"
  kind: "text" | "result"
  content: string
  fragmentId?: string
  time: string
}

const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Landing Relaunch",
    updatedAt: "2m ago",
    description: "Conversion-first homepage with high-contrast hero and social proof.",
  },
  {
    id: "p2",
    name: "Creator Studio",
    updatedAt: "19m ago",
    description: "Workspace layout for prompt-driven page generation.",
  },
  {
    id: "p3",
    name: "Product Intro",
    updatedAt: "1h ago",
    description: "Feature storytelling page with modular cards and CTA flow.",
  },
]

function buildHtml(title: string, subtitle: string, accent: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root { --accent: ${accent}; --bg: #f6f7fb; --ink: #0f172a; --muted: #64748b; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--ink); }
      .wrap { max-width: 1040px; margin: 0 auto; padding: 40px 24px 80px; }
      .hero { border-radius: 24px; padding: 36px; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; }
      .hero h1 { margin: 0 0 8px; font-size: 42px; }
      .hero p { margin: 0; color: rgba(255,255,255,.82); font-size: 16px; line-height: 1.6; }
      .chips { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
      .chip { background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.24); padding: 6px 10px; border-radius: 999px; font-size: 12px; }
      .grid { margin-top: 18px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
      .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 18px; }
      .badge { display: inline-flex; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 15%, white); color: var(--accent); font-size: 11px; font-weight: 700; }
      .cta { margin-top: 18px; border-radius: 16px; background: var(--accent); color: white; border: none; padding: 11px 16px; font-weight: 700; }
      @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } .hero h1 { font-size: 32px; } }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <div class="chips">
          <span class="chip">Fast Iteration</span>
          <span class="chip">Prompt Driven</span>
          <span class="chip">Production Look</span>
        </div>
      </section>
      <section class="grid">
        <article class="card">
          <span class="badge">Section A</span>
          <h3>Hero Narrative</h3>
          <p>Focus on promise and user value in one concise screen.</p>
        </article>
        <article class="card">
          <span class="badge">Section B</span>
          <h3>Feature Story</h3>
          <p>Three key capabilities with direct outcomes.</p>
        </article>
        <article class="card">
          <span class="badge">Section C</span>
          <h3>Action Block</h3>
          <p>Single call to action with low-friction next step.</p>
        </article>
      </section>
      <button class="cta">Continue Editing</button>
    </main>
  </body>
</html>`
}

const PROJECT_CONTENT: Record<string, { fragments: ProjectFragment[]; seedMessages: ChatMessage[] }> = {
  p1: {
    fragments: [
      {
        id: "p1-f1",
        title: "Hero-first layout",
        html: buildHtml("Launch Faster", "A focused landing page structure inspired by Lovable workflows.", "#0ea5e9"),
        files: {
          "app/page.tsx": `export default function Page() {
  return <main>Landing Relaunch</main>
}`,
          "app/globals.css": `.hero { border-radius: 24px; }`,
        },
      },
    ],
    seedMessages: [
      {
        id: "p1-m1",
        role: "assistant",
        kind: "text",
        content: "I prepared a clean first pass with hero, feature cards, and CTA flow.",
        time: "09:21",
      },
      {
        id: "p1-m2",
        role: "assistant",
        kind: "result",
        content: "Open this version",
        fragmentId: "p1-f1",
        time: "09:21",
      },
    ],
  },
  p2: {
    fragments: [
      {
        id: "p2-f1",
        title: "Workspace shell",
        html: buildHtml("Build With Prompts", "Left prompt workflow + right preview shell for rapid iteration.", "#22c55e"),
        files: {
          "components/workspace.tsx": `export function Workspace() {
  return <div>Workspace Shell</div>
}`,
          "styles/workspace.css": `.workspace { display: grid; }`,
        },
      },
    ],
    seedMessages: [
      {
        id: "p2-m1",
        role: "assistant",
        kind: "text",
        content: "I created the base workspace look. We can iterate section by section.",
        time: "08:58",
      },
      {
        id: "p2-m2",
        role: "assistant",
        kind: "result",
        content: "Open generated workspace",
        fragmentId: "p2-f1",
        time: "08:58",
      },
    ],
  },
  p3: {
    fragments: [
      {
        id: "p3-f1",
        title: "Product intro page",
        html: buildHtml("Tell The Product Story", "Benefit-led structure with sections that map directly to user intent.", "#8b5cf6"),
        files: {
          "app/product/page.tsx": `export default function ProductIntro() {
  return <section>Product Intro</section>
}`,
          "app/product/sections.ts": `export const sections = ["hero", "features", "cta"]`,
        },
      },
    ],
    seedMessages: [
      {
        id: "p3-m1",
        role: "assistant",
        kind: "text",
        content: "Here is a product intro baseline with a stronger narrative arc.",
        time: "07:42",
      },
      {
        id: "p3-m2",
        role: "assistant",
        kind: "result",
        content: "Open intro preview",
        fragmentId: "p3-f1",
        time: "07:42",
      },
    ],
  },
}

const PROMPT_SUGGESTIONS = [
  "Make hero section bolder and more premium",
  "Use a cleaner feature grid with larger cards",
  "Add stronger CTA wording for conversion",
  "Improve spacing for mobile screens",
]

function nowLabel() {
  const now = new Date()
  return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export function VibecodingApp() {
  const [view, setView] = useState<AppView>("dashboard")
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [fragments, setFragments] = useState<ProjectFragment[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeFragmentId, setActiveFragmentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("preview")
  const [prompt, setPrompt] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const replyTimerRef = useRef<number | null>(null)
  const messageBottomRef = useRef<HTMLDivElement>(null)

  const activeProject = useMemo(() => {
    return PROJECTS.find((project) => project.id === activeProjectId) ?? null
  }, [activeProjectId])

  const activeFragment = useMemo(() => {
    return fragments.find((fragment) => fragment.id === activeFragmentId) ?? null
  }, [fragments, activeFragmentId])

  useEffect(() => {
    messageBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isThinking])

  useEffect(() => {
    const filePaths = activeFragment ? Object.keys(activeFragment.files) : []
    setSelectedFilePath(filePaths[0] ?? null)
  }, [activeFragmentId, activeFragment])

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current)
      }
    }
  }, [])

  const openProject = (projectId: string) => {
    const content = PROJECT_CONTENT[projectId]
    if (!content) return

    setActiveProjectId(projectId)
    setFragments(content.fragments)
    setMessages(content.seedMessages)
    setActiveFragmentId(content.fragments[0]?.id ?? null)
    setActiveTab("preview")
    setPrompt("")
    setIsThinking(false)
    setPreviewKey((value) => value + 1)
    setView("workspace")
  }

  const handleSendPrompt = () => {
    const userInput = prompt.trim()
    if (!userInput || isThinking) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      kind: "text",
      content: userInput,
      time: nowLabel(),
    }

    setMessages((prev) => [...prev, userMessage])
    setPrompt("")
    setIsThinking(true)

    replyTimerRef.current = window.setTimeout(() => {
      const fragmentId = `f-${Date.now()}`
      const fragmentTitle = `${userInput.split(" ").slice(0, 4).join(" ")}`
      const accentPalette = ["#0ea5e9", "#8b5cf6", "#22c55e", "#f97316"]
      const accent = accentPalette[fragments.length % accentPalette.length]

      const generatedFragment: ProjectFragment = {
        id: fragmentId,
        title: fragmentTitle || "Generated iteration",
        html: buildHtml("Generated Iteration", userInput, accent),
        files: {
          "app/page.tsx": `export default function Page() {
  return <main>${userInput.replace(/</g, "&lt;")}</main>
}`,
          "styles/section.css": `.section { padding: 24px; border-radius: 16px; }`,
        },
      }

      const assistantText: ChatMessage = {
        id: `assistant-text-${Date.now()}`,
        role: "assistant",
        kind: "text",
        content: "Updated. I generated a new variation using your prompt.",
        time: nowLabel(),
      }
      const assistantResult: ChatMessage = {
        id: `assistant-result-${Date.now() + 1}`,
        role: "assistant",
        kind: "result",
        content: "Open generated version",
        fragmentId,
        time: nowLabel(),
      }

      setFragments((prev) => [...prev, generatedFragment])
      setMessages((prev) => [...prev, assistantText, assistantResult])
      setActiveFragmentId(fragmentId)
      setActiveTab("preview")
      setPreviewKey((value) => value + 1)
      setIsThinking(false)
      replyTimerRef.current = null
    }, 900)
  }

  const activeCode = useMemo(() => {
    if (!activeFragment || !selectedFilePath) return ""
    return activeFragment.files[selectedFilePath] ?? ""
  }, [activeFragment, selectedFilePath])

  if (view === "dashboard") {
    return (
      <div className="h-full overflow-auto bg-[#f5f7fb] text-slate-900">
        <div className="mx-auto max-w-6xl p-5">
          <header className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-sm font-bold text-white">
                V
              </div>
              <div>
                <h2 className="text-lg font-semibold">vibecoding</h2>
                <p className="text-sm text-slate-500">Lovable-style prompt to UI workspace</p>
              </div>
              <div className="ml-auto">
                <Button onClick={() => openProject(PROJECTS[0].id)}>
                  <Wand2 />
                  Open Workspace
                </Button>
              </div>
            </div>
          </header>

          <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {PROJECTS.map((project) => (
              <article key={project.id} className="rounded-xl border border-black/5 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{project.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{project.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {project.updatedAt}
                  </span>
                </div>
                <Button className="mt-4 w-full" variant="secondary" onClick={() => openProject(project.id)}>
                  <FolderOpen />
                  Open Project
                </Button>
              </article>
            ))}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#f8f9fb]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={22} className="min-h-0 border-r border-black/5 bg-white">
          <div className="flex h-full min-h-0 flex-col">
            <header className="flex items-center gap-2 border-b border-black/5 px-3 py-2">
              <Button size="sm" variant="ghost" onClick={() => setView("dashboard")}>
                <ArrowLeft />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{activeProject?.name ?? "Project"}</p>
                <p className="truncate text-xs text-slate-500">Prompt-driven builder</p>
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
              <div className="space-y-4">
                {messages.map((message) => {
                  if (message.role === "user") {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
                          {message.content}
                        </div>
                      </div>
                    )
                  }

                  const linkedFragment = message.fragmentId
                    ? fragments.find((fragment) => fragment.id === message.fragmentId) ?? null
                    : null

                  return (
                    <div key={message.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold text-white">
                          V
                        </div>
                        <span className="font-medium text-slate-700">vibecoding</span>
                        <span>{message.time}</span>
                      </div>
                      <p className="pl-7 text-sm text-slate-700">{message.content}</p>
                      {message.kind === "result" && linkedFragment && (
                        <button
                          onClick={() => {
                            setActiveFragmentId(linkedFragment.id)
                            setActiveTab("preview")
                            setPreviewKey((value) => value + 1)
                          }}
                          className={cn(
                            "ml-7 flex w-[calc(100%-1.75rem)] items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                            activeFragmentId === linkedFragment.id
                              ? "border-sky-500 bg-sky-50 text-sky-700"
                              : "border-black/10 bg-slate-50 hover:bg-slate-100",
                          )}
                        >
                          <Code2 className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{linkedFragment.title}</p>
                            <p className="text-xs opacity-80">Preview</p>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                })}

                {isThinking && (
                  <div className="flex items-center gap-2 pl-7 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking and generating...
                  </div>
                )}

                <div ref={messageBottomRef} />
              </div>
            </div>

            <div className="border-t border-black/5 p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="rounded-full border border-black/10 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-2">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      event.preventDefault()
                      handleSendPrompt()
                    }
                  }}
                  placeholder="Describe what you want to build..."
                  rows={2}
                  className="w-full resize-none border-none bg-transparent p-1 text-sm outline-none"
                />
                <div className="flex items-center justify-between px-1 pt-1">
                  <p className="text-[10px] text-slate-400">Cmd/Ctrl + Enter to submit</p>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={isThinking || !prompt.trim()}
                    onClick={handleSendPrompt}
                  >
                    {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={65} minSize={45} className="min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as WorkspaceTab)}
            className="flex h-full min-h-0 flex-col gap-0"
          >
            <div className="flex items-center gap-2 border-b border-black/5 bg-white px-2 py-2">
              <TabsList className="h-8 p-0">
                <TabsTrigger value="preview" className="h-8 gap-1 rounded-md">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="h-8 gap-1 rounded-md">
                  <Code2 className="h-4 w-4" />
                  Code
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreviewKey((value) => value + 1)}>
                  <RefreshCcw />
                </Button>
                <Button size="sm" onClick={() => setActiveTab("preview")}>
                  Continue editing
                </Button>
              </div>
            </div>

            <TabsContent value="preview" className="mt-0 flex-1 min-h-0">
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex items-center gap-2 border-b border-black/5 bg-white px-3 py-2 text-xs text-slate-600">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-medium">{activeFragment?.title ?? "No fragment selected"}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-7 px-2 text-xs"
                    disabled={!activeFragment}
                    onClick={() => {
                      if (!activeFragment) return
                      const blobUrl = URL.createObjectURL(new Blob([activeFragment.html], { type: "text/html" }))
                      window.open(blobUrl, "_blank")
                      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </Button>
                </div>

                <div className="flex-1 min-h-0 bg-white">
                  {activeFragment ? (
                    <iframe
                      key={`${activeFragment.id}-${previewKey}`}
                      className="h-full w-full"
                      sandbox="allow-forms allow-scripts allow-same-origin"
                      srcDoc={activeFragment.html}
                      title={activeFragment.title}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Select a generated result to preview.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-0 flex-1 min-h-0">
              <div className="grid h-full min-h-0 grid-cols-[220px_minmax(0,1fr)]">
                <aside className="overflow-y-auto border-r border-black/5 bg-white p-2">
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Files</p>
                  <div className="space-y-1">
                    {activeFragment && Object.keys(activeFragment.files).map((filePath) => (
                      <button
                        key={filePath}
                        onClick={() => setSelectedFilePath(filePath)}
                        className={cn(
                          "w-full truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                          selectedFilePath === filePath
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        {filePath}
                      </button>
                    ))}
                  </div>
                </aside>

                <section className="min-h-0 overflow-auto bg-[#0f172a] p-4">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-100">
                    {activeCode || "// No file selected"}
                  </pre>
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
