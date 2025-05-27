export interface InputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  action: boolean
  pause: boolean
}

export class InputManager {
  private keys: Record<string, boolean> = {}
  private touches: Map<number, { x: number, y: number }> = new Map()
  private inputState: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    action: false,
    pause: false
  }
  
  // Touch control areas (for mobile)
  private touchAreas = {
    left: { x: 0, y: 0.5, width: 0.25, height: 0.5 },
    right: { x: 0.75, y: 0.5, width: 0.25, height: 0.5 },
    up: { x: 0.375, y: 0.25, width: 0.25, height: 0.25 },
    down: { x: 0.375, y: 0.75, width: 0.25, height: 0.25 },
    action: { x: 0.375, y: 0.5, width: 0.25, height: 0.25 }
  }

  constructor() {
    this.setupKeyboardListeners()
    this.setupTouchListeners()
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true
      
      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false
    })

    // Reset keys on window blur
    window.addEventListener('blur', () => {
      this.keys = {}
    })
  }

  private setupTouchListeners(): void {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.handleTouchStart(e)
    })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      this.handleTouchMove(e)
    })

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.handleTouchEnd(e)
    })

    canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      this.handleTouchEnd(e)
    })
  }

  private handleTouchStart(e: TouchEvent): void {
    Array.from(e.changedTouches).forEach(touch => {
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      })
    })
  }

  private handleTouchMove(e: TouchEvent): void {
    Array.from(e.changedTouches).forEach(touch => {
      if (this.touches.has(touch.identifier)) {
        this.touches.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY
        })
      }
    })
  }

  private handleTouchEnd(e: TouchEvent): void {
    Array.from(e.changedTouches).forEach(touch => {
      this.touches.delete(touch.identifier)
    })
  }

  update(): void {
    // Reset input state
    this.inputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      action: false,
      pause: false
    }

    // Keyboard input
    this.inputState.left = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']
    this.inputState.right = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']
    this.inputState.up = this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']
    this.inputState.down = this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']
    this.inputState.action = this.keys[' ']
    this.inputState.pause = this.keys['Escape'] || this.keys['p'] || this.keys['P']

    // Touch input
    if (this.touches.size > 0) {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        
        this.touches.forEach(touch => {
          const x = (touch.x - rect.left) / rect.width
          const y = (touch.y - rect.top) / rect.height
          
          // Check touch areas
          if (this.isInArea(x, y, this.touchAreas.left)) {
            this.inputState.left = true
          }
          if (this.isInArea(x, y, this.touchAreas.right)) {
            this.inputState.right = true
          }
          if (this.isInArea(x, y, this.touchAreas.up)) {
            this.inputState.up = true
          }
          if (this.isInArea(x, y, this.touchAreas.down)) {
            this.inputState.down = true
          }
          if (this.isInArea(x, y, this.touchAreas.action)) {
            this.inputState.action = true
          }
        })
      }
    }
  }

  private isInArea(x: number, y: number, area: { x: number, y: number, width: number, height: number }): boolean {
    return x >= area.x && x <= area.x + area.width &&
           y >= area.y && y <= area.y + area.height
  }

  getState(): Readonly<InputState> {
    return { ...this.inputState }
  }

  isKeyPressed(key: string): boolean {
    return this.keys[key] || false
  }

  isActionJustPressed(): boolean {
    // This would need frame tracking for proper implementation
    // For now, return current state
    return this.inputState.action
  }

  reset(): void {
    this.keys = {}
    this.touches.clear()
    this.inputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      action: false,
      pause: false
    }
  }
}