import { Application, Container } from 'pixi.js'
import { GameConfig } from '../utils/GameConfig'

export class Game {
  private app: Application
  private gameContainer: Container
  private isInitialized: boolean = false

  constructor() {
    this.app = new Application()
    this.gameContainer = new Container()
  }

  async init(): Promise<void> {
    // Initialize PixiJS application
    await this.app.init({
      width: GameConfig.GAME_WIDTH,
      height: GameConfig.GAME_HEIGHT,
      backgroundColor: 0x87CEEB, // Sky blue
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    })

    // Add canvas to DOM
    const gameElement = document.getElementById('game')
    if (gameElement) {
      gameElement.appendChild(this.app.canvas as HTMLCanvasElement)
    }

    // Add game container to stage
    this.app.stage.addChild(this.gameContainer)

    // Handle resize
    window.addEventListener('resize', () => this.handleResize())
    this.handleResize()

    this.isInitialized = true
    console.log('Game initialized successfully')
  }

  private handleResize(): void {
    if (!this.app.renderer) return

    const parent = this.app.canvas.parentElement
    if (!parent) return

    const parentWidth = parent.clientWidth
    const parentHeight = parent.clientHeight
    
    // Calculate scale to fit game in parent while maintaining aspect ratio
    const scale = Math.min(
      parentWidth / GameConfig.GAME_WIDTH,
      parentHeight / GameConfig.GAME_HEIGHT
    )

    // Resize renderer
    this.app.renderer.resize(
      GameConfig.GAME_WIDTH * scale,
      GameConfig.GAME_HEIGHT * scale
    )

    // Scale the stage
    this.app.stage.scale.set(scale)
  }

  start(): void {
    if (!this.isInitialized) {
      console.error('Game not initialized. Call init() first.')
      return
    }

    // Start game loop
    this.app.ticker.add((time) => {
      this.update(time.deltaTime)
    })
  }

  private update(deltaTime: number): void {
    // Game update logic will go here
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: true })
  }
}