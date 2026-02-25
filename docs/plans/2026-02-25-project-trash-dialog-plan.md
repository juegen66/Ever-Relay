# Project Trash Dialog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the native `window.confirm` dialog in the canvas projects hub with a shadcn/ui `AlertDialog` component when moving a project to the trash.

**Architecture:** Use a controlled `AlertDialog` via a `projectToDelete` state variable. This avoids the nested interactive element issues that occur when placing an `AlertDialogTrigger` inside a `DropdownMenuItem`.

**Tech Stack:** React, Next.js, shadcn/ui.

---

### Task 1: Replace native dialog with AlertDialog in ProjectsHub

**Files:**
- Modify: `components/canvas-manager/projects-hub.tsx`

**Step 1: Import AlertDialog components**

Add the import statement for the `AlertDialog` components from `@/components/ui/alert-dialog` in `projects-hub.tsx`.

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
} from "@/components/ui/alert-dialog"
```

**Step 2: Add state for project pending deletion**

In the `ProjectsHub` component, add a new state variable:

```tsx
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
```

**Step 3: Update handleDelete and add confirmDelete functions**

Replace the existing `handleDelete` function with the following:

```tsx
  const handleDelete = (projectId: string) => {
    setProjectToDelete(projectId)
  }

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete)
      setProjectToDelete(null)
    }
  }
```

**Step 4: Add the AlertDialog component to the JSX**

Add the `<AlertDialog>` component at the end of the `ProjectsHub` return statement, right after the existing `<Dialog>` component for the trash:

```tsx
      <AlertDialog open={projectToDelete !== null} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent className="border-black/10 bg-white/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this project to the trash? You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

**Step 5: Commit**

```bash
git add components/canvas-manager/projects-hub.tsx
git commit -m "feat: replace native confirm with shadcn AlertDialog for project deletion"
```

