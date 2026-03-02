export type BriefState = {
  brandName: string
  industryDomain: string
  targetAudience: string
  coreValues: string
  toneModernTraditional: string
  toneProfessionalFriendly: string
  toneMinimalRich: string
  toneSteadyEnergetic: string
  toneNotes: string
  preferredColors: string
  avoidColors: string
  avoidElements: string
  logoStyleReferences: string
  usageScenarios: string
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
