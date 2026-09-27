import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { HostConfig } from "../schema";

type Props = {
  host: HostConfig;
  isActive: boolean;
  // Frame at which the current turn (and thus this activation) started.
  activeSinceFrame: number;
  // 0-1 volume amplitude, only meaningful while isActive.
  amplitude: number;
};

// AI-generated bust portraits (public/characters/) - see scripts/README.md
// for how these were produced.
const IMAGE_WIDTH = 418; // 190 * 2.2 (original size + 120%)
const IMAGE_HEIGHT = 519; // 236 * 2.2, matches the 161x200 source aspect ratio

// Brightness the inactive speaker dims down to - a "steps into shadow"
// effect. No frame/card around the portrait - it sits directly over the
// studio background, so nothing blocks the backdrop (e.g. the mic).
const DIM_BRIGHTNESS = 0.4;

export const HostAvatar: React.FC<Props> = ({ host, isActive, activeSinceFrame, amplitude }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activation = spring({
    frame: frame - activeSinceFrame,
    fps,
    config: { damping: 200 },
  });
  // Both hosts animate off the same activeSinceFrame (when the turn
  // switched), so the newly-active one brightens while the other dims in
  // the same motion - a spotlight handing off rather than two independent
  // fades.
  const brightness = isActive
    ? interpolate(activation, [0, 1], [DIM_BRIGHTNESS, 1])
    : interpolate(activation, [0, 1], [1, DIM_BRIGHTNESS]);

  // Raw waveform amplitude turned out to behave like a coarse voice-activity
  // gate on this (normalized, podcast-compressed) audio - it saturates near
  // 1 for the whole length of a phrase and near 0 for the whole length of a
  // pause, instead of tracking syllable-level loudness. Mapping mouth shape
  // straight from it made the mouth sit open (or shut) for a full second at
  // a time instead of flapping. So: use amplitude only as a voiced/silent
  // gate, and drive the actual mouth-shape cycling procedurally (two
  // out-of-phase sine waves, ~3-5 "syllables" per second) while voiced -
  // the same technique simple game/avatar lip-flap animation uses instead
  // of true audio-driven visemes.
  const VOICE_GATE = 0.05;
  const localFrame = frame - activeSinceFrame;
  const voiced = isActive && amplitude > VOICE_GATE;
  const t = voiced
    ? Math.min(
        1,
        Math.max(
          0,
          (Math.sin(localFrame * 0.9) * 0.5 + Math.sin(localFrame * 2.3 + 1.3) * 0.3 + Math.sin(localFrame * 0.37 + 0.5) * 0.2 + 1) / 2,
        ),
      )
    : 0;
  // Hard switch, not a crossfade: these are transparent-background PNGs,
  // and blending two semi-opaque alpha layers lets whatever is behind them
  // show through in the middle of the transition (up to ~25% at a 50/50
  // mix) - reads as the character flickering/dimming. Showing exactly one
  // fully-opaque layer at a time avoids that entirely, the same way
  // sprite-based mouth-flap animation swaps frames outright.
  const activeShape = t < 1 / 3 ? "closed" : t < 2 / 3 ? "half" : "open";
  const closedOpacity = activeShape === "closed" ? 1 : 0;
  const halfOpacity = activeShape === "half" ? 1 : 0;
  const openOpacity = activeShape === "open" ? 1 : 0;

  const closedSrc = staticFile(`characters/${host.photoBase}-closed.png`);
  const halfSrc = staticFile(`characters/${host.photoBase}-half.png`);
  const openSrc = staticFile(`characters/${host.photoBase}-open.png`);

  return (
    <div
      style={{
        position: "relative",
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        filter: `brightness(${brightness})`,
      }}
    >
      <Img
        src={closedSrc}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: closedOpacity }}
      />
      <Img
        src={halfSrc}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: halfOpacity }}
      />
      <Img
        src={openSrc}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: openOpacity }}
      />
    </div>
  );
};
