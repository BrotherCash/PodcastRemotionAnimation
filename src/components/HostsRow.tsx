import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getWaveformPortion, useWindowedAudioData } from "@remotion/media-utils";
import { HostAvatar } from "./HostAvatar";
import type { HostConfig, Scene, Turn } from "../schema";

type Props = {
  scenes: Scene[];
  turns?: Turn[];
  hosts: { host1: HostConfig; host2: HostConfig };
  audioSrc: string;
};

const findCurrentScene = (scenes: Scene[], ms: number): Scene | undefined => {
  return scenes.find((s) => ms >= s.startMs && ms < s.endMs) ?? scenes[scenes.length - 1];
};

// Turns can have brief gaps between them (the pause while one speaker
// finishes and the other starts). Since those gaps are typically well
// under a second, picking the next turn that hasn't ended yet keeps the
// highlight continuous instead of flickering to "nobody" for a moment.
const findCurrentTurn = (turns: Turn[], ms: number): Turn | undefined => {
  return turns.find((t) => t.endMs > ms) ?? turns[turns.length - 1];
};

export const HostsRow: React.FC<Props> = ({ scenes, turns, hosts, audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src: staticFile(audioSrc),
    frame,
    fps,
    windowInSeconds: 10,
  });

  let amplitude = 0;
  if (audioData) {
    const waveform = getWaveformPortion({
      audioData,
      startTimeInSeconds: Math.max(0, frame / fps - 0.05),
      durationInSeconds: 0.1,
      numberOfSamples: 2,
      dataOffsetInSeconds,
    });
    amplitude = waveform.length
      ? waveform.reduce((sum, w) => sum + w.amplitude, 0) / waveform.length
      : 0;
  }

  let activeSpeaker: "host1" | "host2" | "both" | undefined;
  let activeSinceFrame = 0;

  if (turns && turns.length > 0) {
    const currentTurn = findCurrentTurn(turns, currentMs);
    activeSpeaker = currentTurn?.speaker;
    activeSinceFrame = currentTurn ? (currentTurn.startMs / 1000) * fps : 0;
  } else {
    const currentScene = scenes.length > 0 ? findCurrentScene(scenes, currentMs) : undefined;
    activeSpeaker = currentScene?.activeSpeaker;
    activeSinceFrame = currentScene ? (currentScene.startMs / 1000) * fps : 0;
  }

  const host1Active = activeSpeaker === "host1" || activeSpeaker === "both";
  const host2Active = activeSpeaker === "host2" || activeSpeaker === "both";

  return (
    <AbsoluteFill
      style={{
        top: "50%",
        height: "50%",
        background: "#0e0e12",
      }}
    >
      <Img
        src={staticFile("backgrounds/bg_1.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 30%",
        }}
      />
      {/* Slight darken so the name pills / active-speaker ring keep reading
          over the photo, and the bottom half stays tonally close to the
          top half's dark navy slide background. */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
      <AbsoluteFill
        style={{
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexDirection: "row",
          paddingLeft: 56,
          paddingRight: 56,
        }}
      >
        <HostAvatar
          host={hosts.host1}
          isActive={host1Active}
          activeSinceFrame={activeSinceFrame}
          amplitude={host1Active ? amplitude : 0}
        />
        <HostAvatar
          host={hosts.host2}
          isActive={host2Active}
          activeSinceFrame={activeSinceFrame}
          amplitude={host2Active ? amplitude : 0}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
