# Canvas Trash Dialog Design

## Overview
Replace the native `window.confirm` dialog in the canvas Toolbar with a shadcn/ui `AlertDialog` component to improve the UI and consistency.

## Target Component
`canvas_qdl/src/features/editor/components/Toolbar.tsx`

## Design Decisions
1. **Component**: Use the `AlertDialog` from `shadcn/ui` because it clearly communicates an important, irreversible action.
2. **Implementation Style**: Use the declarative, inline `AlertDialogTrigger` approach (wrapping the existing Trash button) rather than manually controlling state with `isOpen`/`setIsOpen`. This keeps the code cleaner and leverages the component's built-in accessibility and state management.

## Implementation Steps
1. Import the necessary components from `@/components/ui/alert-dialog`:
   - `AlertDialog`
   - `AlertDialogAction`
   - `AlertDialogCancel`
   - `AlertDialogContent`
   - `AlertDialogDescription`
   - `AlertDialogFooter`
   - `AlertDialogHeader`
   - `AlertDialogTitle`
   - `AlertDialogTrigger`
2. Remove the `handleClearCanvas` function that currently uses `window.confirm`.
3. Locate the existing Trash button in the Toolbar.
4. Wrap the Trash button with `<AlertDialog>`.
5. Change the Trash button to be an `<AlertDialogTrigger asChild>`. Keep its existing props (disabled state, variant, icon, etc.).
6. Add the `<AlertDialogContent>` structure below the trigger:
   - `<AlertDialogHeader>`
     - `<AlertDialogTitle>` containing "清空画布" (Clear Canvas).
     - `<AlertDialogDescription>` containing "确定要清空画布上的所有对象吗？该操作无法撤销。" (Are you sure you want to clear all objects? This action cannot be undone.).
   - `<AlertDialogFooter>`
     - `<AlertDialogCancel>` containing "取消" (Cancel).
     - `<AlertDialogAction>` containing "确定" (Confirm), with an `onClick` handler that calls `editor?.clearCanvas()`.
