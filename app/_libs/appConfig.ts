export const APP_CONFIG = {
  recording: { maxDurationSec: 600 },
  upload: {
    maxMusicXmlBytes: 5 * 1024 * 1024,
    allowedExtensions: [".xml", ".musicxml", ".mxl"],
  },
} as const
