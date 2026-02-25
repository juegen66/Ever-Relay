# Canvas Trash Dialog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the native `window.confirm` dialog in the canvas Toolbar with a shadcn/ui `AlertDialog` component.

**Architecture:** Use the `AlertDialog` inline approach, wrapping the existing Trash button as an `AlertDialogTrigger asChild`. Remove the old `handleClearCanvas` function and handle the action directly in the `AlertDialogAction`'s `onClick`.

**Tech Stack:** React, Next.js, shadcn/ui, Lucide React.

---

### Task 1: Replace native dialog with AlertDialog in Toolbar

**Files:**
- Modify: `canvas_qdl/src/features/editor/components/Toolbar.tsx`

**Step 1: Import AlertDialog components**

Add the import statement for the `AlertDialog` components from `@/components/ui/alert-dialog` in `Toolbar.tsx`.

```tsx
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

**Step 2: Remove old handleClearCanvas function**

Remove the following code from `Toolbar.tsx`:

```tsx
    const handleClearCanvas = () => {
        if (!editor) return
        const confirmClear = window.confirm("确定要清空画布上的所有对象吗？该操作无法撤销。")
        if (!confirmClear) return
        editor.clearCanvas()
    }
```

**Step 3: Update the Trash Button**

Locate the Trash button and wrap it with the `AlertDialog` components:

```tsx
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            size="icon"
                            title="清空画布"
                            disabled={!editor}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>清空画布</AlertDialogTitle>
                            <AlertDialogDescription>
                                确定要清空画布上的所有对象吗？该操作无法撤销。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => editor?.clearCanvas()}>
                                确定
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
```

**Step 4: Commit**

```bash
git add canvas_qdl/src/features/editor/components/Toolbar.tsx
git commit -m "feat: replace native confirm with shadcn AlertDialog in canvas Toolbar"
```

