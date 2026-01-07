declare module 'leader-line' {
  export interface LeaderLineOptions {
    color?: string
    path?: 'straight' | 'arc' | 'fluid' | 'magnet' | 'cubic'
    startPlug?: 'disc' | 'square' | 'arrow1' | 'arrow2' | 'arrow3' | 'behind'
    endPlug?: 'disc' | 'square' | 'arrow1' | 'arrow2' | 'arrow3' | 'behind'
    size?: number
    startSocket?: 'top' | 'right' | 'bottom' | 'left' | 'auto'
    endSocket?: 'top' | 'right' | 'bottom' | 'left' | 'auto'
    dash?: boolean | { len: number; gap: number; animation?: boolean }
    gradient?: boolean | { startColor: string; endColor: string }
    dropShadow?: boolean | { dx: number; dy: number; blur: number; color: string }
    hide?: boolean
    show?: boolean
  }

  export default class LeaderLine {
    constructor(startElement: HTMLElement | string, endElement: HTMLElement | string, options?: LeaderLineOptions)
    position(): void
    remove(): void
    show(): void
    hide(): void
    setOptions(options: LeaderLineOptions): void
  }
}

