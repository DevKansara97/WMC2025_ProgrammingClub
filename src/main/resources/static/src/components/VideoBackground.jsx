
import DarkVeil from './DarkVeil'

export const VideoBackground = () => {
  return (
    <>
      <div className="video-background">
        <DarkVeil
          hueShift={15}
          noiseIntensity={0.03}
          scanlineIntensity={0.05}
          speed={0.3}
          scanlineFrequency={80}
          warpAmount={0.08}
          resolutionScale={1}
        />
      </div>
      <div className="video-overlay"></div>
    </>
  )
}
