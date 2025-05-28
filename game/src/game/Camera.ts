import { Container } from 'pixi.js'
import { GameConfig } from '../utils/GameConfig.ts'

export class Camera {
  private x: number = 0
  private y: number = 0
  private targetX: number = 0
  private targetY: number = 0
  
  // Camera bounds
  private worldWidth: number
  private worldHeight: number
  private viewWidth: number = GameConfig.GAME_WIDTH
  private viewHeight: number = GameConfig.GAME_HEIGHT
  
  // Smoothing
  private smoothing: number = 0.1
  
  // Shake effect
  private shakeIntensity: number = 0
  private shakeTimer: number = 0
  private shakeOffsetX: number = 0
  private shakeOffsetY: number = 0

  constructor(worldWidth: number, worldHeight: number) {
    this.worldWidth = worldWidth
    this.worldHeight = worldHeight
  }

  follow(target: { x: number, y: number }): void {
    // Center camera on target
    this.targetX = target.x - this.viewWidth / 2
    this.targetY = target.y - this.viewHeight / 2
    
    // Clamp to world bounds
    this.targetX = Math.max(0, Math.min(this.worldWidth - this.viewWidth, this.targetX))
    this.targetY = Math.max(0, Math.min(this.worldHeight - this.viewHeight, this.targetY))
  }

  update(deltaTime: number): void {
    // Smooth camera movement
    this.x += (this.targetX - this.x) * this.smoothing
    this.y += (this.targetY - this.y) * this.smoothing
    
    // Update shake effect
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity
      
      // Reduce intensity over time
      this.shakeIntensity *= 0.9
      
      if (this.shakeTimer <= 0) {
        this.shakeOffsetX = 0
        this.shakeOffsetY = 0
        this.shakeIntensity = 0
      }
    }
  }

  applyTo(container: Container): void {
    // Apply camera transform to container
    container.x = -this.x + this.shakeOffsetX
    container.y = -this.y + this.shakeOffsetY
  }

  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity
    this.shakeTimer = duration
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenX: number, screenY: number): { x: number, y: number } {
    return {
      x: screenX + this.x,
      y: screenY + this.y
    }
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX: number, worldY: number): { x: number, y: number } {
    return {
      x: worldX - this.x,
      y: worldY - this.y
    }
  }

  // Check if a point is visible on screen
  isVisible(x: number, y: number, margin: number = 50): boolean {
    return x >= this.x - margin && 
           x <= this.x + this.viewWidth + margin &&
           y >= this.y - margin && 
           y <= this.y + this.viewHeight + margin
  }

  // Check if a rectangle is visible on screen
  isRectVisible(x: number, y: number, width: number, height: number, margin: number = 50): boolean {
    return x + width >= this.x - margin &&
           x <= this.x + this.viewWidth + margin &&
           y + height >= this.y - margin &&
           y <= this.y + this.viewHeight + margin
  }

  // Getters
  getX(): number {
    return this.x
  }

  getY(): number {
    return this.y
  }

  getViewBounds(): { x: number, y: number, width: number, height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.viewWidth,
      height: this.viewHeight
    }
  }

  // Setters
  setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
    this.targetX = x
    this.targetY = y
  }

  setWorldBounds(width: number, height: number): void {
    this.worldWidth = width
    this.worldHeight = height
  }

  setSmoothing(value: number): void {
    this.smoothing = Math.max(0.01, Math.min(1, value))
  }
}