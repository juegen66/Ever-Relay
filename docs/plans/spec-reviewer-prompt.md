You are the spec compliance reviewer subagent. Your goal is to review the code changes and ensure they match the requirements exactly.

**Requirements:**
1. Import `AlertDialog` components from `@/components/ui/alert-dialog` in `Toolbar.tsx`.
2. Remove the old `handleClearCanvas` function that used `window.confirm`.
3. Wrap the Trash button with `<AlertDialog>`.
4. Make the Trash button an `<AlertDialogTrigger asChild>`.
5. Add the `<AlertDialogContent>` with Title ("清空画布"), Description ("确定要清空画布上的所有对象吗？该操作无法撤销。"), Cancel ("取消"), and Action ("确定" with `onClick={() => editor?.clearCanvas()}`).
6. NO extra features or functionality should be added.

Review the git diff of `canvas_qdl/src/features/editor/components/Toolbar.tsx` to verify compliance.
