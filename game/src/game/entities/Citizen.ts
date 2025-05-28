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
    
    const isRescued = this.state === CitizenState.RESCUED
    const baseColor = isRescued ? 0x4CAF50 : 0xFF6F00
    
    // Shadow
    this.body.fill({ color: 0x000000, alpha: 0.2 })
    this.body.ellipse(0, 8, 10, 4)
    
    // Head
    this.body.fill({ color: 0xFFB074 })
    this.body.circle(0, -12, 7)
    
    // Hair
    this.body.fill({ color: 0x5D4037 })
    this.body.beginPath()
    this.body.arc(0, -12, 8, Math.PI, 0, true)
    this.body.closePath()
    
    // Face details
    // Eyes
    this.body.fill({ color: 0x000000 })
    this.body.circle(-2, -12, 1)
    this.body.circle(2, -12, 1)
    
    // Mouth (happy when rescued)
    if (isRescued) {
      this.body.stroke({ width: 1, color: 0x000000 })
      this.body.beginPath()
      this.body.arc(0, -10, 3, 0, Math.PI, false)
    }
    
    // Body/Shirt
    this.body.fill({ color: baseColor })
    this.body.beginPath()
    this.body.moveTo(-6, -5)
    this.body.lineTo(-5, 5)
    this.body.lineTo(5, 5)
    this.body.lineTo(6, -5)
    this.body.closePath()
    
    // Shirt detail
    this.body.fill({ color: 0x000000, alpha: 0.2 })
    this.body.rect(-1, -3, 2, 6)
    
    // Pants
    this.body.fill({ color: 0x1565C0 })
    this.body.beginPath()
    this.body.moveTo(-5, 5)
    this.body.lineTo(-4, 10)
    this.body.lineTo(-1, 10)
    this.body.lineTo(0, 5)
    this.body.lineTo(1, 10)
    this.body.lineTo(4, 10)
    this.body.lineTo(5, 5)
    this.body.closePath()
    
    // Arms (waving animation for waiting citizens)
    if (this.state === CitizenState.WAITING) {
      const armAngle = Math.sin(this.animationTimer) * 0.5
      const waveAngle = Math.sin(this.animationTimer * 2) * 0.3
      
      // Left arm
      this.body.stroke({ width: 3, color: 0xFFB074 })
      this.body.moveTo(-6, -2)
      this.body.lineTo(-9, 2 + armAngle * 3)
      
      // Right arm (waving)
      this.body.moveTo(6, -2)
      this.body.lineTo(10 + waveAngle * 5, -8 - armAngle * 10)
      
      // Hand wave
      this.body.fill({ color: 0xFFB074 })
      this.body.circle(10 + waveAngle * 5, -8 - armAngle * 10, 3)
    } else {
      // Static arms
      this.body.stroke({ width: 3, color: 0xFFB074 })
      this.body.moveTo(-6, -2)
      this.body.lineTo(-8, 3)
      this.body.moveTo(6, -2)
      this.body.lineTo(8, 3)
      
      // Hands
      this.body.fill({ color: 0xFFB074 })
      this.body.circle(-8, 3, 2.5)
      this.body.circle(8, 3, 2.5)
    }
    
    // Shoes
    this.body.fill({ color: 0x424242 })
    this.body.ellipse(-2.5, 11, 3, 2)
    this.body.ellipse(2.5, 11, 3, 2)
    
    // Help indicator
    if (this.state === CitizenState.WAITING && !this.statusText) {
      // Speech bubble background
      const bubble = new Graphics()
      bubble.fill({ color: 0xFFFFFF })
      bubble.roundRect(-20, -40, 40, 20, 10)
      bubble.fill({ color: 0xFFFFFF })
      bubble.beginPath()
      bubble.moveTo(-5, -20)
      bubble.lineTo(0, -15)
      bubble.lineTo(5, -20)
      bubble.closePath()
      this.addChild(bubble)
      
      this.statusText = new Text({
        text: 'HELP!',
        style: {
          fontSize: 12,
          fill: 0xFF0000,
          fontWeight: 'bold',
          fontFamily: 'Arial'
        }
      })
      this.statusText.anchor.set(0.5)
      this.statusText.x = 0
      this.statusText.y = -30
      this.addChild(this.statusText)
    } else if (this.state !== CitizenState.WAITING && this.statusText) {
      // Remove bubble and text
      this.removeChildren()
      this.addChild(this.body)
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