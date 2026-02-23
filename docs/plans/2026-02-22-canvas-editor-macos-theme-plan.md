# Canvas Editor macOS Theme Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the Canvas Editor from its current "Earthy/Nature" theme (greens and creams) to a macOS-style "frosted glass" theme matching `folder-viewer.tsx`.

**Architecture:** We will replace hardcoded hex values (like `#f6f1e6`, `#8fa889`) with Tailwind utility classes that create the macOS look (`bg-white/80`, `backdrop-blur-xl`, `border-black/5`, standard blue accents).

**Tech Stack:** React, Tailwind CSS.

---

### Task 1: Update Main Container and Editor Background

**Files:**
- Modify: `components/canvas-editor/components/editor.tsx`
- Modify: `components/canvas-editor/components/backgroundcolor-sidebar.tsx`

**Step 1: Update the main editor background color**
In `editor.tsx`, find the main container and update its background.
Currently it might have an earthy background or a plain white. We want a very subtle gray or white to contrast with the floating panels.

**Step 2: Update default canvas background color**
In `backgroundcolor-sidebar.tsx`, change `DEFAULT_BACKGROUND` from `rgba(246, 241, 230, 1)` to white (`rgba(255, 255, 255, 1)` or `#ffffff`).

**Step 3: Commit**
```bash
git add components/canvas-editor/components/editor.tsx components/canvas-editor/components/backgroundcolor-sidebar.tsx
git commit -m "style: update main canvas editor background to macos style"
```

### Task 2: Update Navbar styling

**Files:**
- Modify: `components/canvas-editor/components/navbar.tsx`

**Step 1: Update container styling**
Replace `bg-[#f6f1e6]` and `border-[#8fa889]` with `bg-white/80 backdrop-blur-xl saturate-150 border-black/5 shadow-sm`.

**Step 2: Update text colors**
Replace `text-[#2f4f2f]` with `text-neutral-900`.

**Step 3: Update buttons and interactive elements**
Replace `bg-[#5f7d5f]` with `bg-blue-500` or `bg-[#0058d0]`.
Replace hover states like `hover:bg-[#e8efdf]` with `hover:bg-black/5` or `hover:bg-neutral-100`.

**Step 4: Commit**
```bash
git add components/canvas-editor/components/navbar.tsx
git commit -m "style: update canvas navbar to macos theme"
```

### Task 3: Update Main Sidebar styling

**Files:**
- Modify: `components/canvas-editor/components/sidebar.tsx`
- Modify: `components/canvas-editor/components/sidebar-item.tsx`

**Step 1: Update Sidebar container**
Ensure the sidebar uses `bg-white/80 backdrop-blur-xl saturate-150 border-black/5`.

**Step 2: Update Sidebar Items**
In `sidebar-item.tsx`, replace any custom green/cream colors or standard primary colors with macOS gray/blue.
Active state background: `bg-blue-500` or `bg-[#0058d0] text-white`.
Inactive hover state: `hover:bg-black/5`.

**Step 3: Commit**
```bash
git add components/canvas-editor/components/sidebar.tsx components/canvas-editor/components/sidebar-item.tsx
git commit -m "style: update canvas sidebar to macos theme"
```

### Task 4: Update Toolbars and Floating Panels

**Files:**
- Modify: `components/canvas-editor/components/Toolbar.tsx`
- Modify: `components/canvas-editor/components/shapetools-bar.tsx`
- Modify: All sidebars (`shapesiedebar.tsx`, `fillcolor-sidebar.tsx`, `strokecolor-sidebar.tsx`, `stroke-style-sidebar.tsx`, `opacity-sidebar.tsx`, `textsidebar.tsx`)

**Step 1: Update Toolbar containers**
In `Toolbar.tsx` and `shapetools-bar.tsx`, replace earthy backgrounds/borders with `bg-white/80 backdrop-blur-xl saturate-150 border border-black/5 shadow-lg shadow-black/5`.

**Step 2: Update specific sidebars**
For the property sidebars (fill color, stroke, text, etc.), ensure their backgrounds and borders follow the same `bg-white/80 backdrop-blur-xl` pattern. Update any active states to use macOS blue (`bg-blue-500`).

**Step 3: Commit**
```bash
git add components/canvas-editor/components/
git commit -m "style: update canvas toolbars and panels to macos theme"
```
