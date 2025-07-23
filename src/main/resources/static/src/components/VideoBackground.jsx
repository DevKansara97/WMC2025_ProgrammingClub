
import DarkVeil from './DarkVeil'

export const VideoBackground = () => {
  return (
    <>
      <div className="video-background">
        <DarkVeil
          hueShift={245}
          noiseIntensity={0.03}
          scanlineIntensity={0.01}
          speed={0.5}
          scanlineFrequency={80}
          warpAmount={0.15}
          resolutionScale={1}
        />
      </div>
    </>
  )
}
