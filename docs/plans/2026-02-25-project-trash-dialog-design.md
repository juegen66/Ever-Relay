# Project Trash Dialog Design

## Overview
Replace the native `window.confirm` dialog in the canvas projects hub with a shadcn/ui `AlertDialog` component to match the rest of the application's UI.

## Target Component
`components/canvas-manager/projects-hub.tsx`

## Design Decisions
1. **Component**: Use the `AlertDialog` from `shadcn/ui`.
2. **Implementation Style**: Use a controlled, state-based approach (`projectToDelete` state) rather than inline `<AlertDialogTrigger>`. This is necessary because the "Move to Trash" button lives inside a `<DropdownMenuItem>`. Wrapping a dropdown item directly in an alert dialog trigger often leads to accessibility issues, focus trapping bugs, or the dropdown closing prematurely before the alert dialog can open properly.

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
2. Add state to track which project is pending deletion: `const [projectToDelete, setProjectToDelete] = useState<string | null>(null)`.
3. Update the `handleDelete` function to simply set this state:
   ```typescript
   const handleDelete = (projectId: string) => {
     setProjectToDelete(projectId)
   }
   ```
4. Create a function to handle the actual deletion confirmation:
   ```typescript
   const confirmDelete = async () => {
     if (projectToDelete) {
       await deleteProject(projectToDelete)
       setProjectToDelete(null)
     }
   }
   ```
5. Add the `<AlertDialog>` component to the JSX tree (e.g., at the end of the `ProjectsHub` return statement, alongside the other dialogs):
   - The dialog is open when `projectToDelete !== null`.
   - `onOpenChange` handles closing the dialog by setting the state to `null`.
   - Title: "Move to Trash"
   - Description: "Are you sure you want to move this project to the trash? You can restore it later."
   - Cancel Action: Closes the dialog.
   - Confirm Action: Calls `confirmDelete`.
