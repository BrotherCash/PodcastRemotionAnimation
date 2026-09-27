import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";

// Max duration of a caption page before it force-switches (short, so
// captions read like real subtitles rather than whole-paragraph blocks).
const MAX_PAGE_MS = 1200;
// Also break early on any natural pause, so pages align with phrase
// boundaries instead of an arbitrary fixed duration.
const BREAK_ON_SILENCE_MS = 250;
const HIGHLIGHT_COLOR = "#39E508";

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteTimeMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Dark plate behind the text - the backdrop changes (studio photo,
          slide), so this keeps captions readable regardless of what's
          underneath. */}
      <div
        style={{
          maxWidth: "90%",
          padding: "14px 32px",
          borderRadius: 16,
          background: "rgba(0,0,0,0.7)",
          border: "1.5px solid rgba(255,255,255,0.85)",
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 700, whiteSpace: "pre-wrap", textAlign: "center", lineHeight: 1.2 }}>
          {page.tokens.map((token, tokenIndex) => {
            const isActive = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
            return (
              <span key={`${token.fromMs}-${tokenIndex}`} style={{ color: isActive ? HIGHLIGHT_COLOR : "white" }}>
                {token.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CaptionsOverlay: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: MAX_PAGE_MS,
        breakOnSilenceAfterMilliseconds: BREAK_ON_SILENCE_MS,
      }),
    [captions],
  );

  return (
    <AbsoluteFill style={{ top: "40%", height: "20%" }}>
      {pages.map((page, index) => {
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const durationInFrames = Math.max(1, Math.round((page.durationMs / 1000) * fps));
        return (
          <Sequence key={index} from={startFrame} durationInFrames={durationInFrames}>
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
