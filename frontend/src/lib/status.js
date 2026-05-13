export const STATUS_MAP = {
  DRAFT: { label: "Draft", tone: "secondary" },
  SCRIPTING: { label: "Scripting…", tone: "default" },
  SCRIPT_READY: { label: "Script ready", tone: "default" },
  VOICING: { label: "Generating voice…", tone: "default" },
  AVATAR_RENDERING: { label: "Avatar render…", tone: "default" },
  RENDERING: { label: "Final render…", tone: "default" },
  RENDERED: { label: "Ready", tone: "outline" },
  FAILED: { label: "Failed", tone: "destructive" },
};

export const statusLabel = (s) => STATUS_MAP[s]?.label || s;
export const statusTone = (s) => STATUS_MAP[s]?.tone || "secondary";

export const STEP_ORDER = ["SCRIPT", "VOICE", "AVATAR", "RENDER"];
export const STEP_LABELS = {
  SCRIPT: "AI Script",
  VOICE: "Voice (mocked)",
  AVATAR: "Avatar (mocked)",
  RENDER: "Final Render (mocked)",
};
