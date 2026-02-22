
export type ActiveTools =
    | "Select"
    | "Shapes"
    | "Text"
    | "Images"
    | "Draw"
    | "Fill"
    | "Stroke"
    | "StrokeStyle"
    | "Background"
    | "Opacity"
    | "Drag-Color"
    | "Drag-Vise"
    | "Font-Opacity"
    | "Filter"
    | "Settings"
    | "AI"
    | "Remove-BG"
    | "Templates";

export type StrokeStyle = "solid" | "dashed" | "dotted";
export const DEFAULT_STROKE_STYLE: StrokeStyle = "solid";

export const FILL_COLORS = "rgba(0,0,0,1)"
export const STROKE_COLORS = "rgba(0,0,0,1)"
export const STROKE_WIDTH = 2
export const OPACITY = 1

export const CIRCLE_OPTION = {
    radius: 120,
    originX: "center" as const,
    originY: "center" as const,
    fill: FILL_COLORS,
    stroke: STROKE_COLORS,
    strokeWidth: STROKE_WIDTH,
}

export const RECTANGLE_OPTION = {
    width: 240,
    height: 160,
    rx: 0,
    ry: 0,
    originX: "center" as const,
    originY: "center" as const,
    fill: FILL_COLORS,
    stroke: STROKE_COLORS,
    strokeWidth: STROKE_WIDTH,
}

export const TRIANGLE_OPTION = {

    width: 240,
    height: 200,
    originX: "center" as const,
    originY: "center" as const,
    fill: FILL_COLORS,
    stroke: STROKE_COLORS,
    strokeWidth: STROKE_WIDTH,
}


export const TEMPLATE_OPTIONS = {
    width: 240,
    height: 160,
    originX: "center" as const,
    originY: "center" as const,
    fill: FILL_COLORS,
    stroke: STROKE_COLORS,
    strokeWidth: STROKE_WIDTH,
}


export const DEFAULT_TEXT_VALUE = "Add some text";

export const TEXT_OPTION = {
    fontSize: 32,
    fontFamily: "Inter",
    fontWeight: "600",
    fill: "#2f4f2f",
    textAlign: "center" as const,
    lineHeight: 1.2,
    charSpacing: 0,
    originX: "center" as const,
    originY: "center" as const,
}

export type TextPresetId = "Heading" | "Subheading" | "Body";

export const TEXT_PRESETS: Record<TextPresetId, {
    label: string;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    lineHeight: number;
    charSpacing: number;
    textAlign: "left" | "center" | "right" | "justify";
}> = {
    Heading: {
        label: "Heading",
        text: "Add a heading",
        fontSize: 64,
        fontFamily: "Inter",
        fontWeight: "700",
        lineHeight: 1.05,
        charSpacing: 0,
        textAlign: "center",
    },
    Subheading: {
        label: "Subheading",
        text: "Add a subheading",
        fontSize: 40,
        fontFamily: "Inter",
        fontWeight: "600",
        lineHeight: 1.15,
        charSpacing: 0,
        textAlign: "center",
    },
    Body: {
        label: "Body Text",
        text: "Add body text",
        fontSize: 22,
        fontFamily: "Inter",
        fontWeight: "400",
        lineHeight: 1.4,
        charSpacing: 0,
        textAlign: "left",
    },
}

export const DIAMOND_POINTS = [
    { x: 0, y: -120 },
    { x: 120, y: 0 },
    { x: 0, y: 120 },
    { x: -120, y: 0 },
] as const

export const STAR_POINTS = [
    { x: 0, y: -130 },
    { x: 38, y: -40 },
    { x: 130, y: -40 },
    { x: 58, y: 16 },
    { x: 84, y: 110 },
    { x: 0, y: 60 },
    { x: -84, y: 110 },
    { x: -58, y: 16 },
    { x: -130, y: -40 },
    { x: -38, y: -40 },
] as const

export const HEART_PATH = "M 0 -120 C 60 -200, 160 -120, 0 120 C -160 -120, -60 -200, 0 -120 z"
