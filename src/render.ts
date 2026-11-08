export type Ratio = 'portrait' | 'square' | 'wide'
export type Background = 'ocean' | 'sunset' | 'purple' | 'mint' | 'midnight' | 'white'
export type FrameStyle = 'clean' | 'browser'

export interface Settings {
  ratio: Ratio
  background: Background
  padding: number
  radius: number
  shadow: boolean
  shadowStrength: number
  frame: FrameStyle
}

export const dimensions: Record<Ratio, { width: number; height: number }> = {
  portrait: { width: 1200, height: 1600 },
  square: { width: 1200, height: 1200 },
  wide: { width: 1600, height: 900 },
}

export const backgrounds: { id: Background; colors: [string, string, string] }[] = [
  { id: 'ocean', colors: ['#a8dcfa', '#6a92e9', '#4546a2'] },
  { id: 'sunset', colors: ['#ffe1bd', '#f6a99e', '#cc80b5'] },
  { id: 'purple', colors: ['#d9c9ff', '#a8a2f4', '#6975ca'] },
  { id: 'mint', colors: ['#d6f8e7', '#95ddcc', '#66bfc4'] },
  { id: 'midnight', colors: ['#343d68', '#20294d', '#101a33'] },
  { id: 'white', colors: ['#ffffff', '#f5f7fb', '#e9eef7'] },
]

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

export function drawComposition(canvas: HTMLCanvasElement, image: HTMLImageElement | null, settings: Settings) {
  const { width, height } = dimensions[settings.ratio]
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable')

  const palette = backgrounds.find((item) => item.id === settings.background)!.colors
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, palette[0])
  gradient.addColorStop(0.53, palette[1])
  gradient.addColorStop(1, palette[2])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // A subtle local highlight gives the gradient depth without any remote assets.
  if (settings.background !== 'white') {
    const glow = ctx.createRadialGradient(width * 0.12, height * 0.07, 0, width * 0.12, height * 0.07, width * 0.88)
    glow.addColorStop(0, 'rgba(255,255,255,0.29)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, width, height)
  }
  if (!image) return

  const inset = Math.round(Math.min(width, height) * settings.padding / 100)
  const availableWidth = Math.max(100, width - inset * 2)
  const availableHeight = Math.max(100, height - inset * 2)
  const barHeight = settings.frame === 'browser' ? 54 : 0
  const scale = Math.min(availableWidth / image.naturalWidth, (availableHeight - barHeight) / image.naturalHeight)
  const imageWidth = image.naturalWidth * scale
  const imageHeight = image.naturalHeight * scale
  const frameWidth = imageWidth
  const frameHeight = imageHeight + barHeight
  const x = (width - frameWidth) / 2
  const y = (height - frameHeight) / 2
  const radius = Math.min(settings.radius * 2.2, frameWidth / 8, frameHeight / 8)

  ctx.save()
  if (settings.shadow) {
    ctx.shadowColor = 'rgba(22, 30, 73, 0.38)'
    ctx.shadowBlur = 20 + settings.shadowStrength * 1.25
    ctx.shadowOffsetY = 10 + settings.shadowStrength * 0.55
  }
  roundedRect(ctx, x, y, frameWidth, frameHeight, radius)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  ctx.save()
  roundedRect(ctx, x, y, frameWidth, frameHeight, radius)
  ctx.clip()
  if (settings.frame === 'browser') {
    ctx.fillStyle = '#f8f9fc'
    ctx.fillRect(x, y, frameWidth, barHeight)
    ctx.strokeStyle = '#e4e8f0'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y + barHeight - 0.5)
    ctx.lineTo(x + frameWidth, y + barHeight - 0.5)
    ctx.stroke()
    const dots = ['#ff6b69', '#ffbd4b', '#55c969']
    dots.forEach((color, index) => {
      ctx.beginPath()
      ctx.arc(x + 27 + index * 22, y + barHeight / 2, 7, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    })
    if (frameWidth > 320) {
      const addressWidth = Math.min(frameWidth * 0.47, 330)
      roundedRect(ctx, x + (frameWidth - addressWidth) / 2, y + 12, addressWidth, 30, 7)
      ctx.fillStyle = '#eef0f5'
      ctx.fill()
    }
  }
  ctx.drawImage(image, x, y + barHeight, imageWidth, imageHeight)
  ctx.restore()
}
