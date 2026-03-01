export type BriefState = {
  brandName: string
  industry: string
  targetAudience: string
  brandValues: string
  brandPersonality: string
  colorPreferences: string
  avoidColors: string
  stylePreference: string
  additionalNotes: string
}

export interface LogoWorkspaceProjectCard {
  id: string
  title: string
  subtitle: string
  stageLabel: string
  status: string
  previewImageUrl?: string
}

export interface LogoWorkspaceRecentItem {
  id: string
  title: string
  subtitle: string
  stageLabel: string
  status: string
  previewImageUrl?: string
}
