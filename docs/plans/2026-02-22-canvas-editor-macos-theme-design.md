# Canvas Editor macOS Theme Design

## Overview
This document outlines the design for migrating the current "Earthy/Nature" theme (sage greens, beige/cream) of the Canvas Editor to match the macOS system theme used in the `folder-viewer.tsx` component.

## Core Layout & Backgrounds
*   **Main Editor Area:** `bg-white` (or a very subtle light gray like `bg-gray-50/50`).
*   **Navbar, Sidebar & Toolbars:** `bg-white/80 backdrop-blur-xl saturate-150` (classic macOS translucency).
*   **Borders:** Replace heavy green borders (`border-[#8fa889]`) with subtle macOS style borders: `border-black/5` or `border-neutral-200/50`.

## Text, Icons & Interactive Elements
*   **Primary Text:** Neutral dark grays (`text-neutral-900` or `text-black`).
*   **Secondary/Muted Text:** `text-neutral-500` or `text-neutral-400`.
*   **Active States/Selection:** Replace the sage green (`#5f7d5f`) with the macOS system blue: `bg-blue-500` or `bg-[#0058d0]` for selected items and primary buttons.
*   **Hover States:** Subtle light gray backgrounds (`hover:bg-black/5` or `hover:bg-neutral-100`).
*   **Shadows:** Add standard drop shadows to floating toolbars (`shadow-lg shadow-black/5`).

## Implementation Approach
*   **Direct Tailwind Classes:** We will hardcode the specific hex colors and utility classes directly into the canvas editor components to exactly match the folder viewer.