"use client"

import { useFrontendTool } from "@copilotkit/react-core"

import { RENDER_ARTIFACT_PARAMS, toolOk } from "./types"
import { ShadowArtifact } from "../components/shadow-artifact"

export function useArtifactTools() {
  useFrontendTool(
    {
      name: "render_artifact",
      description:
        "Display a message HTML artifact inline in the chat. This is the rendering endpoint for message-html-builder style outputs, not image generation. You must write the full HTML code yourself and pass it in the 'html' parameter. Parameters: html (required, the complete HTML string), title (optional). Do NOT use prompt, size, or n — those are for image APIs.",
      followUp: true,
      parameters: RENDER_ARTIFACT_PARAMS,
      handler: async () =>
        toolOk(
          "Succeeded: HTML artifact is rendering inline in the chat (see the artifact card)."
        ),
      render: ({ status, args }) => (
        <ShadowArtifact
          html={String(args?.html ?? "")}
          title={String(args?.title ?? "Artifact")}
          status={status}
        />
      ),
    },
    []
  )
}
