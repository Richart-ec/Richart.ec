import { Composition } from "remotion";
import { SonyScalaCumbaya } from "./SonyScalaCumbaya";
import { SonyScalaCumbayaB } from "./b/SonyScalaCumbayaB";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SonyScalaCumbaya"
        component={SonyScalaCumbaya}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SonyScalaCumbayaB"
        component={SonyScalaCumbayaB}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
