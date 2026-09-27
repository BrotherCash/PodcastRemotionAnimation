import { ALL_FORMATS, Input, UrlSource } from "mediabunny";

export const getAudioDuration = async (src: string): Promise<number> => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src),
  });

  return input.computeDuration();
};
