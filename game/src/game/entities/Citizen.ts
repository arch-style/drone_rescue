import { Container, Graphics, Text } from 'pixi.js'

export enum CitizenType {
  GROUND = 'ground',
  ROOF = 'roof'
}

export enum CitizenState {
  WAITING = 'waiting',
  RESCUED = 'rescued',
  BOARDING = 'boarding',
  DELIVERED = 'delivered'
}

export class Citizen extends Container {
  private state: CitizenState = CitizenState.WAITING
  private type: CitizenType
  private buildingIndex: number = -1
  
  // Animation
  private animationTimer: number = 0
  private waveDirection: number = 1
  
  // Graphics
  private body: Graphics
  private statusText: Text | null = null
  
  constructor(x: number, y: number, type: CitizenType = CitizenType.GROUND) {
    super()
    
    this.x = x
    this.y = y
    this.type = type
    
    // Create citizen graphics
    this.body = new Graphics()
    this.drawCitizen()
    this.addChild(this.body)
  }

  private drawCitizen(): void {
    this.body.clear()
    
    const color = this.state === CitizenState.RESCUED ? 0x4CAF50 : 0xFFA726
    
    // Body
    this.body.fill(color)
    this.body.circle(0, -10, 8)
    
    // Simple body shape
    this.body.moveTo(-6, -5)
    this.body.lineTo(-4, 5)
    this.body.lineTo(4, 5)
    this.body.lineTo(6, -5)
    this.body.closePath()
    
    // Arms (waving animation for waiting citizens)
    if (this.state === CitizenState.WAITING) {
      const armAngle = Math.sin(this.animationTimer) * 0.5
      
      // Left arm
      this.body.stroke({ width: 2, color: color })
      this.body.moveTo(-5, -2)
      this.body.lineTo(-8, 2 + armAngle * 5)
      
      // Right arm (waving)
      this.body.moveTo(5, -2)
      this.body.lineTo(8 + armAngle * 3, -5 - armAngle * 8)
    } else {
      // Static arms
      this.body.stroke({ width: 2, color: color })
      this.body.moveTo(-5, -2)
      this.body.lineTo(-7, 3)
      this.body.moveTo(5, -2)
      this.body.lineTo(7, 3)
    }
    
    // Help indicator
    if (this.state === CitizenState.WAITING && !this.statusText) {
      this.statusText = new Text({
        text: 'HELP!',
        style: {
          fontSize: 12,
          fill: 0xFF0000,
          fontWeight: 'bold'
        }
      })
      this.statusText.x = -15
      this.statusText.y = -30
      this.addChild(this.statusText)
    } else if (this.state !== CitizenState.WAITING && this.statusText) {
      this.removeChild(this.statusText)
      this.statusText = null
    }
  }

  update(deltaTime: number): void {
    // Waving animation
    if (this.state === CitizenState.WAITING) {
      this.animationTimer += deltaTime * 3
      
      // Redraw every few frames for performance
      if (Math.floor(this.animationTimer) % 10 === 0) {
        this.drawCitizen()
      }
      
      // Floating help text
      if (this.statusText) {
        this.statusText.y = -30 + Math.sin(this.animationTimer * 0.5) * 3
      }
    }
    
    // Boarding animation
    if (this.state === CitizenState.BOARDING) {
      // Move towards drone (handled by drone)
      this.alpha = Math.max(0, this.alpha - deltaTime * 2)
      if (this.alpha <= 0) {
        this.visible = false
      }
    }
  }

  rescue(): void {
    if (this.state === CitizenState.WAITING) {
      this.state = CitizenState.RESCUED
      this.drawCitizen()
    }
  }

  board(): void {
    if (this.state === CitizenState.RESCUED) {
      this.state = CitizenState.BOARDING
    }
  }

  deliver(): void {
    this.state = CitizenState.DELIVERED
    this.visible = false
  }

  // Getters and setters
  getState(): CitizenState {
    return this.state
  }

  getType(): CitizenType {
    return this.type
  }

  setType(type: CitizenType): void {
    this.type = type
  }

  getBuildingIndex(): number {
    return this.buildingIndex
  }

  setBuildingIndex(index: number): void {
    this.buildingIndex = index
  }

  isWaiting(): boolean {
    return this.state === CitizenState.WAITING
  }

  isRescued(): boolean {
    return this.state === CitizenState.RESCUED
  }

  isDelivered(): boolean {
    return this.state === CitizenState.DELIVERED
  }

  getPosition(): { x: number, y: number } {
    return { x: this.x, y: this.y }
  }
}