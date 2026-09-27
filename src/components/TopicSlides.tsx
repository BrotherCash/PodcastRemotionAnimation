import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { HostConfig, Scene, SlideIllustrationCategory } from "../schema";

const NAVY = "#201a33";
const WHITE = "#ffffff";
const YELLOW = "#ffd166";
const PINK = "#e0479e";
const BOTH_ACCENT = "#7c6cf0";

function accentFor(speaker: Scene["activeSpeaker"], hosts: { host1: HostConfig; host2: HostConfig }): string {
  if (speaker === "host1") return hosts.host1.color;
  if (speaker === "host2") return hosts.host2.color;
  return BOTH_ACCENT;
}

// One hard offset "sticker" shadow shared by every illustration - simpler
// and more consistent than duplicating each shape by hand.
const IllustrationDefs: React.FC = () => (
  <defs>
    <filter id="stickerShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feOffset dx="6" dy="6" result="off" />
      <feFlood floodColor={NAVY} floodOpacity="1" result="color" />
      <feComposite in="color" in2="off" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// Every illustration shares a 300x250 viewBox so they drop into the same
// layout slot regardless of category. `accent` is the scene's speaker color
// (host1/host2/both) so the illustration re-tints itself per scene.
type IllustrationProps = { accent: string };

const IllustrationSpark: React.FC<IllustrationProps> = ({ accent }) => (
  <svg width={210} height={175} viewBox="0 0 300 250">
    <IllustrationDefs />
    <g filter="url(#stickerShadow)">
      <g transform="rotate(16 226 62)">
        <rect x="190" y="34" width="66" height="48" rx="10" fill={YELLOW} stroke={NAVY} strokeWidth={5} />
      </g>
      <g transform="rotate(-10 224 118)">
        <rect x="188" y="94" width="56" height="40" rx="9" fill={PINK} stroke={NAVY} strokeWidth={5} />
      </g>
      <rect x="60" y="60" width="150" height="110" rx="16" fill={WHITE} stroke={NAVY} strokeWidth={5} />
    </g>
    <rect x="76" y="76" width="118" height="66" rx="6" fill={accent} opacity={0.9} />
    <polygon points="128,96 128,122 152,109" fill={WHITE} />
    <rect x="118" y="172" width="30" height="8" rx="4" fill={NAVY} />
    <rect x="96" y="180" width="74" height="8" rx="4" fill={NAVY} />
    <circle cx="40" cy="40" r="7" fill={WHITE} stroke={NAVY} strokeWidth={3} />
    <circle cx="260" cy="180" r="6" fill={YELLOW} stroke={NAVY} strokeWidth={3} />
  </svg>
);

const IllustrationDataOverload: React.FC<IllustrationProps> = ({ accent }) => (
  <svg width={210} height={175} viewBox="0 0 300 250">
    <IllustrationDefs />
    <g filter="url(#stickerShadow)">
      <rect x="80" y="172" width="140" height="42" rx="10" fill={WHITE} stroke={NAVY} strokeWidth={5} />
      <rect x="80" y="128" width="140" height="42" rx="10" fill={WHITE} stroke={NAVY} strokeWidth={5} />
      <rect x="80" y="84" width="140" height="42" rx="10" fill={WHITE} stroke={NAVY} strokeWidth={5} />
    </g>
    <circle cx="100" cy="193" r="6" fill={accent} />
    <circle cx="100" cy="149" r="6" fill={YELLOW} stroke={NAVY} strokeWidth={2} />
    <circle cx="100" cy="105" r="6" fill={PINK} stroke={NAVY} strokeWidth={2} />
    <rect x="118" y="184" width="80" height="8" rx="4" fill={NAVY} opacity={0.5} />
    <rect x="118" y="140" width="80" height="8" rx="4" fill={NAVY} opacity={0.5} />
    <rect x="118" y="96" width="80" height="8" rx="4" fill={NAVY} opacity={0.5} />

    <g filter="url(#stickerShadow)" transform="rotate(-14 96 55)">
      <circle cx="96" cy="55" r="32" fill={PINK} stroke={NAVY} strokeWidth={5} />
    </g>
    <circle cx="96" cy="55" r="10" fill={WHITE} stroke={NAVY} strokeWidth={3} />
    <g filter="url(#stickerShadow)" transform="rotate(18 214 48)">
      <circle cx="214" cy="48" r="26" fill={YELLOW} stroke={NAVY} strokeWidth={5} />
    </g>
    <circle cx="214" cy="48" r="8" fill={WHITE} stroke={NAVY} strokeWidth={3} />

    <circle cx="255" cy="130" r="6" fill={WHITE} stroke={NAVY} strokeWidth={3} />
    <circle cx="50" cy="150" r="5" fill={accent} stroke={NAVY} strokeWidth={2} />
  </svg>
);

const IllustrationAiReads: React.FC<IllustrationProps> = ({ accent }) => (
  <svg width={210} height={175} viewBox="0 0 300 250">
    <IllustrationDefs />
    <g filter="url(#stickerShadow)">
      <circle cx="72" cy="120" r="38" fill={WHITE} stroke={NAVY} strokeWidth={5} />
    </g>
    <line x1="72" y1="82" x2="72" y2="66" stroke={NAVY} strokeWidth={4} />
    <circle cx="72" cy="60" r="6" fill={YELLOW} stroke={NAVY} strokeWidth={3} />
    <circle cx="60" cy="122" r="5" fill={NAVY} />
    <circle cx="84" cy="122" r="5" fill={NAVY} />
    <path d="M 58 138 Q 72 148 86 138" stroke={NAVY} strokeWidth={4} fill="none" strokeLinecap="round" />

    <g filter="url(#stickerShadow)">
      <rect x="128" y="76" width="150" height="96" rx="14" fill={accent} stroke={NAVY} strokeWidth={5} />
    </g>
    <rect x="144" y="130" width="6" height="26" fill={WHITE} />
    <rect x="156" y="118" width="6" height="38" fill={WHITE} />
    <rect x="168" y="108" width="6" height="48" fill={WHITE} />
    <rect x="180" y="122" width="6" height="34" fill={WHITE} />
    <rect x="192" y="132" width="6" height="24" fill={WHITE} />
    <rect x="144" y="92" width="90" height="8" rx="4" fill={WHITE} opacity={0.85} />
    <rect x="144" y="104" width="60" height="8" rx="4" fill={WHITE} opacity={0.6} />

    <g filter="url(#stickerShadow)" transform="rotate(10 246 188)">
      <circle cx="238" cy="180" r="24" fill="none" stroke={NAVY} strokeWidth={7} />
      <circle cx="238" cy="180" r="24" fill={WHITE} opacity={0.35} />
      <line x1="256" y1="198" x2="272" y2="214" stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
    </g>

    <circle cx="40" cy="60" r="6" fill={PINK} stroke={NAVY} strokeWidth={2} />
  </svg>
);

const IllustrationCodeBuilds: React.FC<IllustrationProps> = ({ accent }) => (
  <svg width={210} height={175} viewBox="0 0 300 250">
    <IllustrationDefs />
    <g filter="url(#stickerShadow)">
      <rect x="48" y="60" width="180" height="132" rx="14" fill={NAVY} stroke={NAVY} strokeWidth={5} />
    </g>
    <circle cx="68" cy="80" r="5" fill={PINK} />
    <circle cx="84" cy="80" r="5" fill={YELLOW} />
    <circle cx="100" cy="80" r="5" fill="#8ee08e" />
    <rect x="66" y="98" width="90" height="9" rx="4" fill={accent} />
    <rect x="66" y="116" width="130" height="9" rx="4" fill={PINK} />
    <rect x="82" y="134" width="100" height="9" rx="4" fill={YELLOW} />
    <rect x="82" y="152" width="70" height="9" rx="4" fill={WHITE} opacity={0.7} />
    <rect x="66" y="170" width="110" height="9" rx="4" fill={accent} />

    <g filter="url(#stickerShadow)" transform="rotate(-8 220 200)">
      <rect x="184" y="168" width="86" height="62" rx="12" fill={WHITE} stroke={NAVY} strokeWidth={5} />
    </g>
    <g transform="rotate(-8 220 200)">
      <polygon points="210,182 210,216 240,199" fill={accent} />
    </g>

    <circle cx="252" cy="52" r="6" fill={YELLOW} stroke={NAVY} strokeWidth={2} />
    <circle cx="34" cy="200" r="6" fill={PINK} stroke={NAVY} strokeWidth={2} />
  </svg>
);

const IllustrationRhythm: React.FC<IllustrationProps> = ({ accent }) => (
  <svg width={210} height={175} viewBox="0 0 300 250">
    <IllustrationDefs />
    <g filter="url(#stickerShadow)">
      <circle cx="100" cy="135" r="58" fill={WHITE} stroke={NAVY} strokeWidth={5} />
    </g>
    <circle cx="100" cy="135" r="15" fill={accent} stroke={NAVY} strokeWidth={4} />
    <circle cx="100" cy="135" r="4" fill={NAVY} />
    <g transform="rotate(35 100 135)">
      <line x1="100" y1="135" x2="150" y2="80" stroke={NAVY} strokeWidth={6} strokeLinecap="round" />
    </g>
    <circle cx="150" cy="80" r="7" fill={YELLOW} stroke={NAVY} strokeWidth={3} />

    <g filter="url(#stickerShadow)">
      <rect x="196" y="150" width="16" height="50" rx="6" fill={PINK} stroke={NAVY} strokeWidth={4} />
      <rect x="218" y="120" width="16" height="80" rx="6" fill={YELLOW} stroke={NAVY} strokeWidth={4} />
      <rect x="240" y="100" width="16" height="100" rx="6" fill={accent} stroke={NAVY} strokeWidth={4} />
      <rect x="262" y="130" width="16" height="70" rx="6" fill={PINK} stroke={NAVY} strokeWidth={4} />
    </g>

    <g filter="url(#stickerShadow)" transform="rotate(-12 66 210)">
      <rect x="30" y="196" width="72" height="34" rx="6" fill={WHITE} stroke={NAVY} strokeWidth={4} />
    </g>
    <g transform="rotate(-12 66 210)">
      <circle cx="42" cy="213" r="3.5" fill={NAVY} />
      <circle cx="42" cy="202" r="3.5" fill={NAVY} />
      <circle cx="90" cy="213" r="3.5" fill={NAVY} />
      <circle cx="90" cy="202" r="3.5" fill={NAVY} />
    </g>
  </svg>
);

const IllustrationComparison: React.FC<IllustrationProps> = ({ accent }) => (
  <svg width={210} height={175} viewBox="0 0 300 250">
    <IllustrationDefs />
    <rect x="144" y="90" width="12" height="90" fill={NAVY} />
    <polygon points="150,170 110,214 190,214" fill={NAVY} />
    <g filter="url(#stickerShadow)" transform="rotate(-6 150 92)">
      <rect x="60" y="86" width="180" height="12" rx="6" fill={WHITE} stroke={NAVY} strokeWidth={4} />
    </g>
    <circle cx="150" cy="92" r="10" fill={YELLOW} stroke={NAVY} strokeWidth={3} />

    <g transform="rotate(-6 150 92)">
      <line x1="72" y1="92" x2="60" y2="150" stroke={NAVY} strokeWidth={4} />
      <line x1="222" y1="92" x2="234" y2="150" stroke={NAVY} strokeWidth={4} />
    </g>
    <g filter="url(#stickerShadow)">
      <ellipse cx="58" cy="160" rx="34" ry="18" fill={WHITE} stroke={NAVY} strokeWidth={5} />
      <ellipse cx="236" cy="160" rx="34" ry="18" fill={WHITE} stroke={NAVY} strokeWidth={5} />
    </g>
    <circle cx="58" cy="152" r="16" fill={accent} stroke={NAVY} strokeWidth={4} />
    <rect x="222" y="138" width="28" height="28" rx="5" fill={PINK} stroke={NAVY} strokeWidth={4} />

    <circle cx="150" cy="30" r="6" fill={accent} stroke={NAVY} strokeWidth={2} />
  </svg>
);

const IllustrationSelfCheck: React.FC<IllustrationProps> = ({ accent }) => (
  <svg width={210} height={175} viewBox="0 0 300 250">
    <IllustrationDefs />
    <g filter="url(#stickerShadow)">
      <rect x="80" y="58" width="130" height="150" rx="14" fill={WHITE} stroke={NAVY} strokeWidth={5} />
    </g>
    <rect x="112" y="46" width="66" height="24" rx="8" fill={accent} stroke={NAVY} strokeWidth={4} />
    <path d="M 100 108 l 8 8 l 14 -16" stroke="#3fb26a" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="130" y="102" width="60" height="9" rx="4" fill={NAVY} opacity={0.55} />
    <path d="M 100 144 l 8 8 l 14 -16" stroke="#3fb26a" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="130" y="138" width="60" height="9" rx="4" fill={NAVY} opacity={0.55} />
    <circle cx="104" cy="176" r="9" fill="none" stroke={NAVY} strokeWidth={4} />
    <rect x="130" y="172" width="60" height="9" rx="4" fill={NAVY} opacity={0.3} />

    <g filter="url(#stickerShadow)" transform="rotate(8 236 196)">
      <circle cx="228" cy="188" r="26" fill={YELLOW} stroke={NAVY} strokeWidth={5} />
      <line x1="246" y1="206" x2="262" y2="222" stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
    </g>

    <path
      d="M 76 34 A 34 34 0 1 1 44 66"
      stroke={NAVY}
      strokeWidth={6}
      fill="none"
      strokeLinecap="round"
    />
    <polygon points="34,60 44,66 40,52" fill={NAVY} />
  </svg>
);

const IllustrationHumanAi: React.FC<IllustrationProps> = ({ accent }) => (
  <svg width={210} height={175} viewBox="0 0 300 250">
    <IllustrationDefs />
    <g filter="url(#stickerShadow)">
      <rect x="98" y="40" width="104" height="72" rx="12" fill={WHITE} stroke={NAVY} strokeWidth={5} />
    </g>
    <path d="M 132 78 l 10 10 l 20 -22" stroke="#3fb26a" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />

    <g filter="url(#stickerShadow)">
      <circle cx="78" cy="168" r="26" fill={PINK} stroke={NAVY} strokeWidth={5} />
    </g>
    <rect x="52" y="188" width="52" height="54" rx="18" fill={PINK} stroke={NAVY} strokeWidth={5} />
    <line x1="98" y1="204" x2="128" y2="176" stroke={NAVY} strokeWidth={9} strokeLinecap="round" />

    <g filter="url(#stickerShadow)">
      <rect x="196" y="150" width="52" height="46" rx="12" fill={accent} stroke={NAVY} strokeWidth={5} />
    </g>
    <rect x="206" y="196" width="32" height="46" rx="10" fill={accent} stroke={NAVY} strokeWidth={5} />
    <line x1="206" y1="176" x2="196" y2="160" stroke={NAVY} strokeWidth={4} />
    <circle cx="196" cy="156" r="5" fill={YELLOW} stroke={NAVY} strokeWidth={2} />
    <circle cx="212" cy="170" r="5" fill={NAVY} />
    <circle cx="232" cy="170" r="5" fill={NAVY} />
    <line x1="196" y1="176" x2="166" y2="150" stroke={NAVY} strokeWidth={9} strokeLinecap="round" />

    <polygon
      points="147,145 154,160 170,163 154,166 147,181 140,166 124,163 140,160"
      fill={YELLOW}
      stroke={NAVY}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  </svg>
);

const ILLUSTRATIONS: Record<SlideIllustrationCategory, React.FC<IllustrationProps>> = {
  spark: IllustrationSpark,
  dataOverload: IllustrationDataOverload,
  aiReads: IllustrationAiReads,
  codeBuilds: IllustrationCodeBuilds,
  rhythm: IllustrationRhythm,
  comparison: IllustrationComparison,
  selfCheck: IllustrationSelfCheck,
  humanAI: IllustrationHumanAi,
};

const COMIC_OUTLINE = [-2, 2].flatMap((dx) => [-2, 2].map((dy) => `${dx}px ${dy}px 0 ${NAVY}`)).join(", ");
const COMIC_OUTLINE_WIDE = [-3, 3].flatMap((dx) => [-3, 3].map((dy) => `${dx}px ${dy}px 0 ${NAVY}`)).join(", ");

// Scene boundaries are absolute (driven by the real audio duration via
// calculateMetadata), so @remotion/transitions' <TransitionSeries> can't be
// used here - it shortens the total timeline by the transition length,
// which would desync slides from captions/HostsRow. Instead each slide's
// own <Sequence> is widened by `t` frames on both ends and fades/slides
// itself in and out - adjacent slides simply overlap during that window.
const TRANSITION_MS = 450;

const TopicSlide: React.FC<{
  slide: Scene["slide"];
  accent: string;
  enterFrames: number;
  exitFrames: number;
  durationInFrames: number;
}> = ({ slide, accent, enterFrames, exitFrames, durationInFrames }) => {
  const frame = useCurrentFrame();

  const wrapperOpacity = interpolate(
    frame,
    [0, enterFrames, durationInFrames - exitFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const wrapperTranslateY = interpolate(
    frame,
    [0, enterFrames, durationInFrames - exitFrames, durationInFrames],
    [26, 0, 0, -26],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const illustrationScale = interpolate(frame, [0, enterFrames], [0.55, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.elastic(1.1),
  });
  const underlineWidth = interpolate(frame, [enterFrames, enterFrames + 16], [0, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const Illustration = ILLUSTRATIONS[slide.category];

  return (
    <AbsoluteFill style={{ background: accent, opacity: wrapperOpacity, overflow: "hidden" }}>
      {/* speed lines + halftone dots - static sticker-poster energy */}
      <svg width="100%" height="100%" viewBox="0 0 1080 960" style={{ position: "absolute", inset: 0 }}>
        <g stroke={NAVY} strokeWidth={6} strokeLinecap="round" opacity={0.16}>
          <line x1="900" y1="40" x2="1000" y2="10" />
          <line x1="930" y1="80" x2="1040" y2="55" />
          <line x1="940" y1="130" x2="1050" y2="115" />
        </g>
        <g fill={NAVY} opacity={0.13}>
          <circle cx="60" cy="780" r="5" />
          <circle cx="90" cy="800" r="5" />
          <circle cx="120" cy="820" r="5" />
          <circle cx="60" cy="820" r="5" />
          <circle cx="90" cy="840" r="5" />
          <circle cx="60" cy="860" r="5" />
        </g>
      </svg>

      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          padding: "34px 80px 0",
          translate: `0px ${wrapperTranslateY}px`,
        }}
      >
        <div style={{ scale: illustrationScale }}>
          <Illustration accent={accent} />
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 84,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 940,
            textShadow: COMIC_OUTLINE_WIDE,
          }}
        >
          {slide.title}
        </div>
        <div style={{ marginTop: 12, height: 6, width: underlineWidth, background: NAVY, borderRadius: 3 }} />

        <div style={{ marginTop: 16, width: "100%", maxWidth: 860, display: "flex", flexDirection: "column", gap: 10 }}>
          {slide.bullets.map((bullet, i) => {
            const start = enterFrames + 6 + i * 6;
            const end = start + 12;
            const bulletOpacity = interpolate(frame, [start, end], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const bulletTranslateX = interpolate(frame, [start, end], [-24, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            return (
              <div
                key={bullet}
                style={{
                  textAlign: "center",
                  opacity: bulletOpacity,
                  translate: `${bulletTranslateX}px 0px`,
                }}
              >
                <span
                  style={{
                    fontSize: 60,
                    fontWeight: 800,
                    color: "white",
                    lineHeight: 1.25,
                    textShadow: COMIC_OUTLINE,
                  }}
                >
                  {bullet}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TopicSlides: React.FC<{ scenes: Scene[]; hosts: { host1: HostConfig; host2: HostConfig } }> = ({
  scenes,
  hosts,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ height: "50%", background: NAVY, overflow: "hidden" }}>
      {scenes.map((scene, index) => {
        const rawFrom = Math.round((scene.startMs / 1000) * fps);
        const rawDuration = Math.max(1, Math.round(((scene.endMs - scene.startMs) / 1000) * fps));
        const isFirst = index === 0;
        const isLast = index === scenes.length - 1;
        const maxT = Math.max(1, Math.floor(rawDuration / 3));
        const t = Math.min(Math.round((TRANSITION_MS / 1000) * fps), maxT);
        // Every slide fades itself in/out over `t` local frames. Only the
        // start/end that actually has a neighbor to crossfade with shifts
        // `from`/duration outward - the first slide fades in from frame 0
        // instead of reaching back before the video starts, and likewise
        // for the last slide fading out past the video's end.
        const enterFrames = t;
        const exitFrames = t;
        const from = isFirst ? rawFrom : rawFrom - t;
        const durationInFrames = rawDuration + (isFirst ? 0 : t) + (isLast ? 0 : t);
        return (
          <Sequence key={scene.sceneId} from={from} durationInFrames={durationInFrames}>
            <TopicSlide
              slide={scene.slide}
              accent={accentFor(scene.activeSpeaker, hosts)}
              enterFrames={enterFrames}
              exitFrames={exitFrames}
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
