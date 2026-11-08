import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Check, ChevronDown, ImagePlus, LockKeyhole, RefreshCw, Sparkles, Trash2, UploadCloud, X } from 'lucide-react'
import exampleUrl from './assets/example.svg'
import { backgrounds, dimensions, drawComposition, type Background, type FrameStyle, type Ratio, type Settings } from './render'

type Language = 'en' | 'zh'
const copy = {
  en: {
    tagline: 'A little polish goes a long way.',
    titleA: 'Beautiful screenshots,', titleB: 'made simple.',
    subtitle: 'Make your screenshots look beautiful in seconds.',
    free: 'Free forever', private: 'Private by design', watermark: 'No watermark',
    preview: 'LIVE PREVIEW', example: 'Example image', yourImage: 'Your image',
    drop: 'Drop a screenshot here', dropSub: 'or click to browse · PNG, JPG, WebP',
    paste: 'Tip: paste an image with ⌘V / Ctrl+V',
    upload: 'Upload image', replace: 'Replace image', remove: 'Remove image',
    design: 'Design your shot', designSub: 'A few simple touches make all the difference.',
    ratio: 'Canvas size', ratioSub: 'Made for wherever you share.',
    portrait: '3:4', portraitSub: 'Xiaohongshu', square: '1:1', squareSub: 'Square post', wide: '16:9', wideSub: 'X landscape',
    background: 'Background', backgroundSub: 'Pick your perfect backdrop.',
    ocean: 'Ocean Blue', sunset: 'Sunset Glow', purple: 'Purple Dream', mint: 'Mint Fresh', midnight: 'Midnight', white: 'Clean White',
    appearance: 'Appearance', appearanceSub: 'Fine tune the details.',
    padding: 'Padding', corners: 'Corners', shadow: 'Shadow', strength: 'Shadow strength',
    clean: 'Clean image', browser: 'Browser window', style: 'Image style',
    download: 'Download PNG', downloadSub: 'High quality · No watermark',
    downloaded: 'PNG is ready. Check your downloads.',
    privacy: 'Your images stay in your browser.', made: 'Made by AI & Mac Lab',
    tooLarge: 'This image is too large. Choose a file under 25 MB.',
    tooManyPixels: 'This image is too large to process. Try one under 36 megapixels and 12,000 pixels per side.',
    unsupported: 'Please choose a PNG, JPG, or WebP image.',
    broken: 'This image could not be opened. Please try another file.',
    exportError: 'Download failed. Try a smaller image or refresh the page.',
    noImage: 'Upload an image before downloading.',
  },
  zh: {
    tagline: '一点巧思，让截图更出彩。',
    titleA: '让普通截图，', titleB: '一键变成精美作品。',
    subtitle: '几秒钟，让你的截图焕然一新。',
    free: '永久免费', private: '隐私优先', watermark: '无水印',
    preview: '实时预览', example: '示例图片', yourImage: '你的图片',
    drop: '将截图拖到这里', dropSub: '或点击选择 · PNG、JPG、WebP',
    paste: '提示：可用 ⌘V / Ctrl+V 粘贴图片',
    upload: '上传图片', replace: '替换图片', remove: '删除图片',
    design: '美化你的截图', designSub: '只需几步，呈现更好的效果。',
    ratio: '画布尺寸', ratioSub: '适配不同的分享场景。',
    portrait: '3:4', portraitSub: '小红书竖版', square: '1:1', squareSub: '社交媒体方图', wide: '16:9', wideSub: 'X 横版配图',
    background: '背景', backgroundSub: '选择喜欢的背景。',
    ocean: '海洋蓝', sunset: '落日光', purple: '梦幻紫', mint: '薄荷绿', midnight: '午夜蓝', white: '纯净白',
    appearance: '外观', appearanceSub: '调整画面的细节。',
    padding: '四周边距', corners: '截图圆角', shadow: '阴影', strength: '阴影强度',
    clean: '简洁图片', browser: '浏览器窗口', style: '截图样式',
    download: '下载 PNG', downloadSub: '高清画质 · 无水印',
    downloaded: 'PNG 已生成，请查看下载文件夹。',
    privacy: '你的图片只留在浏览器中。', made: '由 AI & Mac Lab 制作',
    tooLarge: '图片太大，请选择小于 25 MB 的文件。',
    tooManyPixels: '图片尺寸过大。请使用低于 3600 万像素，且单边小于 12000 像素的图片。',
    unsupported: '请选择 PNG、JPG 或 WebP 图片。',
    broken: '无法打开这张图片，请尝试其他文件。',
    exportError: '下载失败，请尝试较小的图片或刷新页面。',
    noImage: '请先上传图片再下载。',
  },
} as const

const defaultSettings: Settings = { ratio: 'square', background: 'ocean', padding: 11, radius: 18, shadow: true, shadowStrength: 48, frame: 'browser' }
const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_PIXELS = 36_000_000
const MAX_EDGE = 12_000

function Slider({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  return <label className="slider-row">
    <span className="slider-heading"><span>{label}</span><span className="slider-value">{value}{unit}</span></span>
    <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties} />
  </label>
}

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const t = copy[language]
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [isExample, setIsExample] = useState(true)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const objectUrl = useRef<string | null>(null)
  const pendingUrls = useRef(new Set<string>())
  const loadSerial = useRef(0)

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'
  }, [language])

  useEffect(() => {
    let cancelled = false
    const serial = loadSerial.current
    const sample = new Image()
    sample.onload = () => { if (!cancelled && loadSerial.current === serial) setImage(sample) }
    sample.src = exampleUrl
    return () => {
      cancelled = true
      loadSerial.current++
      pendingUrls.current.forEach((url) => URL.revokeObjectURL(url))
      pendingUrls.current.clear()
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    }
  }, [])

  useEffect(() => {
    if (!canvas.current) return
    try { drawComposition(canvas.current, image, settings) }
    catch { setError(t.exportError) }
  }, [image, settings, t.exportError])

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((previous) => ({ ...previous, [key]: value }))

  const loadFile = useCallback((file: File) => {
    setError('')
    const serial = ++loadSerial.current
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError(copy[language].unsupported); return }
    if (file.size > MAX_FILE_BYTES) { setError(copy[language].tooLarge); return }
    const url = URL.createObjectURL(file)
    pendingUrls.current.add(url)
    const nextImage = new Image()
    nextImage.onload = () => {
      pendingUrls.current.delete(url)
      if (serial !== loadSerial.current) { URL.revokeObjectURL(url); return }
      if (!nextImage.naturalWidth || !nextImage.naturalHeight || nextImage.naturalWidth > MAX_EDGE || nextImage.naturalHeight > MAX_EDGE || nextImage.naturalWidth * nextImage.naturalHeight > MAX_PIXELS) {
        URL.revokeObjectURL(url)
        setError(copy[language].tooManyPixels)
        return
      }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = url
      setImage(nextImage)
      setIsExample(false)
    }
    nextImage.onerror = () => { pendingUrls.current.delete(url); URL.revokeObjectURL(url); if (serial === loadSerial.current) setError(copy[language].broken) }
    nextImage.src = url
  }, [language])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.items ?? []).find((item) => item.kind === 'file' && item.type.startsWith('image/'))?.getAsFile()
      if (file) { event.preventDefault(); loadFile(file) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [loadFile])

  const removeImage = () => {
    loadSerial.current++
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = null
    setImage(null)
    setIsExample(false)
    setError('')
    if (fileInput.current) fileInput.current.value = ''
  }

  const download = async () => {
    if (!image) { setError(t.noImage); return }
    setExporting(true)
    setError('')
    setDownloaded(false)
    try {
      const output = document.createElement('canvas')
      drawComposition(output, image, settings)
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob((result) => result ? resolve(result) : reject(new Error('PNG encoding failed')), 'image/png'))
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.href = url
      link.download = `screenshot-lab-${stamp}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setDownloaded(true)
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch { setError(t.exportError) }
    finally { setExporting(false) }
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) loadFile(file)
  }

  const ratioOptions: { id: Ratio; label: string; sub: string; shape: string }[] = [
    { id: 'portrait', label: t.portrait, sub: t.portraitSub, shape: 'portrait' },
    { id: 'square', label: t.square, sub: t.squareSub, shape: 'square' },
    { id: 'wide', label: t.wide, sub: t.wideSub, shape: 'wide' },
  ]
  const backgroundNames: Record<Background, string> = { ocean: t.ocean, sunset: t.sunset, purple: t.purple, mint: t.mint, midnight: t.midnight, white: t.white }
  const currentDimensions = dimensions[settings.ratio]

  return <div className="site-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Sparkles size={19} strokeWidth={2.4} /></span><span>Screenshot <strong>Lab</strong></span></div>
      <button className="language-switch" type="button" onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} aria-label={language === 'en' ? 'Switch to Chinese' : '切换为英文'}><span className={language === 'en' ? 'active' : ''}>EN</span><span className="language-divider">/</span><span className={language === 'zh' ? 'active' : ''}>中文</span></button>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-dot" /> {t.tagline}</div>
        <h1>{t.titleA}<br /><span>{t.titleB}</span></h1>
        <p>{t.subtitle}</p>
        <div className="hero-badges"><span><Check size={14} />{t.free}</span><span><LockKeyhole size={14} />{t.private}</span><span><Sparkles size={14} />{t.watermark}</span></div>
      </section>

      <div className="workspace">
        <section className="preview-card" aria-label={t.preview}>
          <div className="card-header preview-header"><div><span className="section-kicker">01 / {t.preview}</span><div className="preview-title">{isExample ? t.example : image ? t.yourImage : t.upload}</div></div><div className="resolution-pill">{currentDimensions.width} × {currentDimensions.height} <ChevronDown size={13} /></div></div>
          <div className={`preview-stage ${dragging ? 'dragging' : ''}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }} onDrop={onDrop}>
            <div className={`canvas-wrap ratio-${settings.ratio}`}>
              <canvas ref={canvas} aria-label={t.preview} />
              {!image && <button type="button" className="empty-overlay" onClick={() => fileInput.current?.click()}><span className="empty-icon"><ImagePlus size={28} /></span><strong>{t.drop}</strong><small>{t.dropSub}</small></button>}
              {dragging && <div className="drop-overlay"><UploadCloud size={32} /><strong>{t.drop}</strong></div>}
            </div>
          </div>
          <div className="preview-footer"><div className="upload-actions"><button type="button" className="soft-button" onClick={() => fileInput.current?.click()}>{image ? <RefreshCw size={16} /> : <ImagePlus size={16} />}{image ? t.replace : t.upload}</button>{image && <button type="button" className="icon-button" onClick={removeImage} aria-label={t.remove} title={t.remove}><Trash2 size={17} /></button>}</div><span className="paste-tip">{t.paste}</span></div>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) loadFile(file); event.target.value = '' }} />
        </section>

        <aside className="control-card">
          <div className="card-header control-header"><span className="section-kicker">02 / {t.design}</span><h2>{t.design}</h2><p>{t.designSub}</p></div>
          <div className="controls-scroll">
            <section className="control-section"><div className="control-section-heading"><div><h3>{t.ratio}</h3><p>{t.ratioSub}</p></div></div><div className="ratio-options">{ratioOptions.map((option) => <button key={option.id} type="button" className={`ratio-option ${settings.ratio === option.id ? 'selected' : ''}`} onClick={() => update('ratio', option.id)} aria-pressed={settings.ratio === option.id}><span className={`ratio-icon ${option.shape}`} /><strong>{option.label}</strong><small>{option.sub}</small></button>)}</div></section>
            <section className="control-section"><div className="control-section-heading"><div><h3>{t.background}</h3><p>{t.backgroundSub}</p></div></div><div className="background-grid">{backgrounds.map((background) => <button key={background.id} type="button" className={`background-choice ${settings.background === background.id ? 'selected' : ''}`} onClick={() => update('background', background.id)} aria-label={backgroundNames[background.id]} aria-pressed={settings.background === background.id}><span className="swatch" style={{ background: `linear-gradient(135deg, ${background.colors.join(', ')})` }}>{settings.background === background.id && <Check size={17} />}</span><span>{backgroundNames[background.id]}</span></button>)}</div></section>
            <section className="control-section appearance-section"><div className="control-section-heading"><div><h3>{t.appearance}</h3><p>{t.appearanceSub}</p></div></div><div className="style-segment" role="group" aria-label={t.style}><button type="button" className={settings.frame === 'clean' ? 'selected' : ''} onClick={() => update('frame', 'clean' as FrameStyle)}>{t.clean}</button><button type="button" className={settings.frame === 'browser' ? 'selected' : ''} onClick={() => update('frame', 'browser' as FrameStyle)}>{t.browser}</button></div><Slider label={t.padding} value={settings.padding} min={4} max={25} unit="%" onChange={(value) => update('padding', value)} /><Slider label={t.corners} value={settings.radius} min={0} max={36} unit="" onChange={(value) => update('radius', value)} /><label className="toggle-row"><span>{t.shadow}</span><input type="checkbox" checked={settings.shadow} onChange={(event) => update('shadow', event.target.checked)} /><span className="toggle-track" /></label>{settings.shadow && <Slider label={t.strength} value={settings.shadowStrength} min={0} max={100} unit="%" onChange={(value) => update('shadowStrength', value)} />}</section>
          </div>
          <div className="download-area"><button type="button" className="download-button" onClick={download} disabled={exporting || !image}><ArrowDownToLine size={19} />{t.download}</button><span>{t.downloadSub}</span></div>
        </aside>
      </div>
      {error && <div className="error-toast" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label={language === 'en' ? 'Dismiss' : '关闭'}><X size={17} /></button></div>}
      {downloaded && <div className="success-toast" role="status"><Check size={16} /><span>{t.downloaded}</span><button type="button" onClick={() => setDownloaded(false)} aria-label={language === 'en' ? 'Dismiss' : '关闭'}><X size={17} /></button></div>}
    </main>
    <footer><span><LockKeyhole size={14} /> {t.privacy}</span><span>{t.made}</span></footer>
  </div>
}

export default App
