import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TopicSlides } from "./components/TopicSlides";
import { HostsRow } from "./components/HostsRow";
import { CaptionsOverlay } from "./components/CaptionsOverlay";
import type { PodcastVideoProps } from "./schema";

export const PodcastVideo: React.FC<PodcastVideoProps> = ({
  audioSrc,
  hosts,
  scenes,
  captions,
  turns,
}) => {
  const resolvedScenes = scenes ?? [];
  const resolvedCaptions = captions ?? [];

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <TopicSlides scenes={resolvedScenes} hosts={hosts} />
      <HostsRow scenes={resolvedScenes} turns={turns} hosts={hosts} audioSrc={audioSrc} />
      <CaptionsOverlay captions={resolvedCaptions} />
      <Audio src={staticFile(audioSrc)} />
    </AbsoluteFill>
  );
};
