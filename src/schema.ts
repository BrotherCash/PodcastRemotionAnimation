import { z } from "zod";

// Contract produced by the "Transcript-First" scene generation step (see
// scripts/README.md). A Claude Code task reads the normalized transcript
// and writes one of these per episode to public/data/<episodeId>.scenes.json.
export const speakerSchema = z.enum(["host1", "host2", "both"]);
export type Speaker = z.infer<typeof speakerSchema>;

// One hand-drawn sticker-style illustration per category, reused across
// every scene that falls into it (see TopicSlides.tsx) - a full custom
// illustration per scene isn't practical at 32 scenes, so scenes group by
// theme instead.
export const slideIllustrationCategorySchema = z.enum([
  "spark",
  "dataOverload",
  "aiReads",
  "codeBuilds",
  "rhythm",
  "comparison",
  "selfCheck",
  "humanAI",
]);
export type SlideIllustrationCategory = z.infer<typeof slideIllustrationCategorySchema>;

export const sceneSchema = z.object({
  sceneId: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  activeSpeaker: speakerSchema,
  slide: z.object({
    title: z.string(),
    bullets: z.array(z.string()),
    // Name of a lucide-react icon component, e.g. "Rocket", "Brain".
    // Kept for reference/fallback; TopicSlides.tsx renders `category`'s
    // illustration instead.
    icon: z.string(),
    category: slideIllustrationCategorySchema,
  }),
});
export type Scene = z.infer<typeof sceneSchema>;

export const scenesFileSchema = z.array(sceneSchema);
export type ScenesFile = z.infer<typeof scenesFileSchema>;

// Merged consecutive same-speaker words from the diarized transcript.
// Drives per-turn (not per-scene) active-speaker highlighting in
// HostsRow, since real speaker turns switch every ~5-15s - much finer
// than the 15-30s scenes.
export const turnSchema = z.object({
  speaker: z.enum(["host1", "host2"]),
  startMs: z.number(),
  endMs: z.number(),
});
export type Turn = z.infer<typeof turnSchema>;
export const turnsFileSchema = z.array(turnSchema);
export type TurnsFile = z.infer<typeof turnsFileSchema>;

export const hostConfigSchema = z.object({
  label: z.string(),
  color: z.string(),
  // Loads public/characters/<photoBase>-closed.png and <photoBase>-open.png
  // (AI-generated bust portraits, mouth-closed / mouth-open variants).
  photoBase: z.string(),
});
export type HostConfig = z.infer<typeof hostConfigSchema>;

// Mirrors the `Caption` type from `@remotion/captions` (kept separate so
// this file has no runtime dependency on that package).
export const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
  pageBreakAfter: z.boolean().optional(),
});
export type CaptionData = z.infer<typeof captionSchema>;
export const captionsFileSchema = z.array(captionSchema);

export const podcastVideoPropsSchema = z.object({
  episodeId: z.string(),
  audioSrc: z.string(),
  scenesUrl: z.string(),
  captionsUrl: z.string(),
  // Optional: per-turn speaker timing for fine-grained HostsRow
  // highlighting. Falls back to scene-level activeSpeaker if absent.
  turnsUrl: z.string().optional(),
  hosts: z.object({
    host1: hostConfigSchema,
    host2: hostConfigSchema,
  }),
  // Populated by calculateMetadata; absent in defaultProps.
  scenes: scenesFileSchema.optional(),
  captions: captionsFileSchema.optional(),
  turns: turnsFileSchema.optional(),
  totalDurationMs: z.number().optional(),
});
export type PodcastVideoProps = z.infer<typeof podcastVideoPropsSchema>;
