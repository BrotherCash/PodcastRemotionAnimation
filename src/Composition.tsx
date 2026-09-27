import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { PodcastVideo } from "./PodcastVideo";
import { getAudioDuration } from "./lib/getAudioDuration";
import {
  captionsFileSchema,
  podcastVideoPropsSchema,
  scenesFileSchema,
  turnsFileSchema,
  type PodcastVideoProps,
} from "./schema";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const defaultProps: PodcastVideoProps = {
  episodeId: "sample",
  audioSrc: "audio/sample.mp3",
  scenesUrl: "data/sample.scenes.json",
  captionsUrl: "data/sample.captions.json",
  hosts: {
    host1: { label: "Ведущий", color: "#2f6fed", photoBase: "host1-turned" },
    host2: { label: "Ведущая", color: "#e0479e", photoBase: "host2-turned" },
  },
};

const calculateMetadata: CalculateMetadataFunction<PodcastVideoProps> = async ({ props }) => {
  const [scenesRes, captionsRes, turnsRes] = await Promise.all([
    fetch(staticFile(props.scenesUrl)),
    fetch(staticFile(props.captionsUrl)),
    props.turnsUrl ? fetch(staticFile(props.turnsUrl)) : Promise.resolve(null),
  ]);

  const scenes = scenesFileSchema.parse(await scenesRes.json());
  const captions = captionsFileSchema.parse(await captionsRes.json());
  const turns = turnsRes ? turnsFileSchema.parse(await turnsRes.json()) : undefined;

  let durationInSeconds: number;
  try {
    durationInSeconds = await getAudioDuration(staticFile(props.audioSrc));
  } catch {
    // No real recording placed yet (or unreadable) - fall back to the
    // scene list so Studio/preview still works during development.
    durationInSeconds = scenes.length > 0 ? scenes[scenes.length - 1].endMs / 1000 : 10;
  }

  return {
    durationInFrames: Math.max(1, Math.round(durationInSeconds * FPS)),
    props: {
      ...props,
      scenes,
      captions,
      turns,
      totalDurationMs: durationInSeconds * 1000,
    },
  };
};

const hyperframesEpisodeProps: PodcastVideoProps = {
  episodeId: "podcast_remotion_hyperframes",
  audioSrc: "audio/podcast_remotion_hyperframes.mp3",
  scenesUrl: "data/podcast_remotion_hyperframes.scenes.json",
  captionsUrl: "data/podcast_remotion_hyperframes.captions.json",
  turnsUrl: "data/podcast_remotion_hyperframes.turns.json",
  hosts: {
    host1: { label: "Ведущий", color: "#2f6fed", photoBase: "host1-turned" },
    host2: { label: "Ведущая", color: "#e0479e", photoBase: "host2-turned" },
  },
};

export const PodcastVideoComposition = () => {
  return (
    <>
      <Composition
        id="PodcastVideo"
        component={PodcastVideo}
        durationInFrames={300}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaultProps}
        schema={podcastVideoPropsSchema}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="PodcastVideo-hyperframes"
        component={PodcastVideo}
        durationInFrames={300}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={hyperframesEpisodeProps}
        schema={podcastVideoPropsSchema}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
