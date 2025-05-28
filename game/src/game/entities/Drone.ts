import { Container, Graphics, Text } from 'pixi.js'
import { GameConfig } from '../../utils/GameConfig.ts'

export interface DroneStats {
  battery: number
  passengers: any[] // TODO: Define Citizen type
  x: number
  y: number
  vx: number
  vy: number
}

export class Drone extends Container {
  // Position and physics
  private vx: number = 0
  private vy: number = 0
  
  // Drone properties
  private battery: number = 100
  private maxBattery: number = 100
  private passengers: any[] = []
  private maxCapacity: number = GameConfig.DRONE.MAX_CAPACITY
  
  // State flags
  private isRescuing: boolean = false
  private isCrashing: boolean = false
  private crashY: number = 0
  
  // Rope system
  private ropeLength: number = 0
  private maxRopeLength: number = GameConfig.DRONE.MAX_ROPE_LENGTH
  
  // Battery consumption tracking
  private currentDrainRate: number = 0
  private consumptionAmount: number = 0
  private showConsumptionTimer: number = 0
  
  // Graphics
  private body: Graphics
  private ropeGraphics: Graphics
  private consumptionText: Text | null = null
  
  // World bounds
  public worldWidth: number = 0

  constructor(startX: number, startY: number) {
    super()
    
    this.x = startX
    this.y = startY
    
    // Create drone body (temporary graphics)
    this.body = new Graphics()
    this.drawDrone()
    this.addChild(this.body)
    
    // Create rope graphics
    this.ropeGraphics = new Graphics()
    this.addChild(this.ropeGraphics)
  }

  private drawDrone(): void {
    this.body.clear()
    
    if (!this.isCrashing) {
      // Main body with gradient effect
      this.body.fill({ color: 0x2196F3 })
      this.body.roundRect(-25, -12, 50, 24, 12)
      
      // Body highlight
      this.body.fill({ color: 0x42A5F5 })
      this.body.roundRect(-23, -10, 46, 8, 6)
      
      // Cockpit window
      this.body.fill({ color: 0x1976D2 })
      this.body.beginPath()
      this.body.moveTo(-15, -8)
      this.body.lineTo(15, -8)
      this.body.lineTo(12, 0)
      this.body.lineTo(-12, 0)
      this.body.closePath()
      
      // Window shine
      this.body.fill({ color: 0x64B5F6, alpha: 0.6 })
      this.body.beginPath()
      this.body.moveTo(-10, -6)
      this.body.lineTo(5, -6)
      this.body.lineTo(3, -2)
      this.body.lineTo(-8, -2)
      this.body.closePath()
      
      // Propeller arms
      this.body.fill({ color: 0x37474F })
      this.body.rect(-30, -2, 8, 4)
      this.body.rect(22, -2, 8, 4)
      this.body.rect(-30, -16, 8, 4)
      this.body.rect(22, -16, 8, 4)
      
      // Propellers (animated)
      const propellerAngle = Date.now() * 0.02
      this.body.fill({ color: 0x90A4AE, alpha: 0.8 })
      
      // Front left propeller
      this.body.save()
      this.body.translate(-26, -14)
      this.body.rotate(propellerAngle)
      this.body.rect(-12, -1, 24, 2)
      this.body.rect(-1, -12, 2, 24)
      this.body.restore()
      
      // Front right propeller
      this.body.save()
      this.body.translate(26, -14)
      this.body.rotate(-propellerAngle)
      this.body.rect(-12, -1, 24, 2)
      this.body.rect(-1, -12, 2, 24)
      this.body.restore()
      
      // Back left propeller
      this.body.save()
      this.body.translate(-26, 0)
      this.body.rotate(-propellerAngle * 1.2)
      this.body.rect(-12, -1, 24, 2)
      this.body.rect(-1, -12, 2, 24)
      this.body.restore()
      
      // Back right propeller
      this.body.save()
      this.body.translate(26, 0)
      this.body.rotate(propellerAngle * 1.2)
      this.body.rect(-12, -1, 24, 2)
      this.body.rect(-1, -12, 2, 24)
      this.body.restore()
      
      // Landing gear
      this.body.stroke({ width: 2, color: 0x455A64 })
      this.body.moveTo(-15, 12)
      this.body.lineTo(-18, 16)
      this.body.moveTo(15, 12)
      this.body.lineTo(18, 16)
      
      // LED lights
      this.body.fill({ color: 0xFF5252 })
      this.body.circle(-20, 0, 2)
      this.body.fill({ color: 0x4CAF50 })
      this.body.circle(20, 0, 2)
      
      // Rescue hook attachment
      this.body.fill({ color: 0x607D8B })
      this.body.rect(-3, 10, 6, 4)
    } else {
      // Crashed drone
      this.body.fill({ color: 0x616161 })
      this.body.roundRect(-25, -12, 50, 24, 12)
      
      // Smoke effect
      this.body.fill({ color: 0x424242, alpha: 0.7 })
      this.body.circle(-10 + Math.random() * 20, -5 - Math.random() * 10, 5 + Math.random() * 3)
      this.body.circle(-5 + Math.random() * 10, -8 - Math.random() * 10, 4 + Math.random() * 3)
    }
  }

  update(deltaTime: number, keys: Record<string, boolean>): void {
    if (this.isCrashing) {
      this.updateCrash(deltaTime)
      this.drawDrone() // Redraw for smoke animation
      return
    }
    
    // Input handling
    this.handleInput(keys, deltaTime)
    
    // Apply physics
    this.applyPhysics(deltaTime)
    
    // Update battery
    this.updateBattery(deltaTime)
    
    // Update rope
    this.updateRope()
    
    // Update consumption display
    this.updateConsumptionDisplay(deltaTime)
    
    // Redraw drone for propeller animation
    this.drawDrone()
  }

  private handleInput(keys: Record<string, boolean>, deltaTime: number): void {
    const accel = GameConfig.DRONE.ACCELERATION
    
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      this.vx -= accel
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      this.vx += accel
    }
    
    // Vertical movement
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
      this.vy -= accel
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
      this.vy += accel
    }
  }

  private applyPhysics(deltaTime: number): void {
    // Apply gravity
    this.vy += GameConfig.GRAVITY
    
    // Apply deceleration
    this.vx *= GameConfig.DRONE.DECELERATION
    this.vy *= GameConfig.DRONE.DECELERATION
    
    // Limit speed
    this.vx = Math.max(-GameConfig.DRONE.MAX_SPEED_X, Math.min(GameConfig.DRONE.MAX_SPEED_X, this.vx))
    this.vy = Math.max(-GameConfig.DRONE.MAX_SPEED_Y, Math.min(GameConfig.DRONE.MAX_SPEED_Y, this.vy))
    
    // Update position
    this.x += this.vx
    this.y += this.vy
    
    // World bounds
    this.x = Math.max(20, Math.min(this.worldWidth - 20, this.x))
    this.y = Math.max(20, this.y)
  }

  private updateBattery(deltaTime: number): void {
    let drainRate = GameConfig.DRONE.BATTERY_DRAIN_BASE
    
    // Additional drain for movement
    if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
      drainRate += GameConfig.DRONE.BATTERY_DRAIN_MOVING
    }
    
    // Additional drain for ascending
    if (this.vy < -0.5) {
      drainRate += GameConfig.DRONE.BATTERY_DRAIN_ASCENDING
    }
    
    // Additional drain for carrying passengers
    drainRate += this.passengers.length * 0.1
    
    this.currentDrainRate = drainRate
    this.battery = Math.max(0, this.battery - drainRate * deltaTime)
  }

  private updateRope(): void {
    this.ropeGraphics.clear()
    
    if (this.isRescuing && this.ropeLength > 0) {
      // Rope cable with gradient effect
      this.ropeGraphics.stroke({ width: 3, color: 0x5D4037 })
      this.ropeGraphics.moveTo(0, 14)
      this.ropeGraphics.lineTo(0, 14 + this.ropeLength)
      
      // Secondary rope line for depth
      this.ropeGraphics.stroke({ width: 1, color: 0x8D6E63 })
      this.ropeGraphics.moveTo(-1, 14)
      this.ropeGraphics.lineTo(-1, 14 + this.ropeLength)
      
      // Ladder rungs
      const rungSpacing = 15
      const numRungs = Math.floor(this.ropeLength / rungSpacing)
      
      this.ropeGraphics.stroke({ width: 2, color: 0x6D4C41 })
      for (let i = 1; i <= numRungs; i++) {
        const y = 14 + i * rungSpacing
        this.ropeGraphics.moveTo(-8, y)
        this.ropeGraphics.lineTo(8, y)
      }
      
      // Rope end hook
      const endY = 14 + this.ropeLength
      
      // Hook base
      this.ropeGraphics.fill({ color: 0x455A64 })
      this.ropeGraphics.beginPath()
      this.ropeGraphics.moveTo(-6, endY - 2)
      this.ropeGraphics.lineTo(6, endY - 2)
      this.ropeGraphics.lineTo(4, endY + 8)
      this.ropeGraphics.lineTo(-4, endY + 8)
      this.ropeGraphics.closePath()
      
      // Hook curve
      this.ropeGraphics.stroke({ width: 3, color: 0x37474F })
      this.ropeGraphics.beginPath()
      this.ropeGraphics.moveTo(0, endY + 8)
      this.ropeGraphics.bezierCurveTo(-8, endY + 12, -8, endY + 18, 0, endY + 16)
      
      // Hook point
      this.ropeGraphics.fill({ color: 0x263238 })
      this.ropeGraphics.circle(0, endY + 16, 3)
      
      // Rescue radius indicator (pulsing)
      const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7
      this.ropeGraphics.stroke({ width: 1, color: 0x4CAF50, alpha: pulse * 0.5 })
      this.ropeGraphics.circle(0, endY, 30)
    }
  }

  private updateCrash(deltaTime: number): void {
    // Fall with gravity
    this.vy += GameConfig.GRAVITY * 2
    this.y += this.vy
    
    // Rotation during crash
    this.rotation += 0.1
  }

  private updateConsumptionDisplay(deltaTime: number): void {
    if (this.showConsumptionTimer > 0) {
      this.showConsumptionTimer -= deltaTime
      
      if (!this.consumptionText) {
        this.consumptionText = new Text({
          text: '',
          style: {
            fontSize: 14,
            fill: 0xff0000,
            fontWeight: 'bold'
          }
        })
        this.addChild(this.consumptionText)
      }
      
      this.consumptionText.text = `-${this.consumptionAmount.toFixed(1)}%`
      this.consumptionText.x = 30
      this.consumptionText.y = -10
      this.consumptionText.alpha = this.showConsumptionTimer / 2
    } else if (this.consumptionText) {
      this.removeChild(this.consumptionText)
      this.consumptionText = null
    }
  }

  // Public methods
  startRescue(): void {
    this.isRescuing = true
    this.ropeLength = 0
  }

  stopRescue(): void {
    this.isRescuing = false
    this.ropeLength = 0
  }

  extendRope(speed: number, deltaTime: number): void {
    if (this.isRescuing && this.ropeLength < this.maxRopeLength) {
      this.ropeLength += speed * deltaTime
    }
  }

  startCrash(): void {
    this.isCrashing = true
    this.crashY = this.y
  }

  showRopeConsumption(): void {
    this.showConsumptionTimer = 2
  }

  isNearGround(): boolean {
    return this.y > GameConfig.STAGE.GROUND_LEVEL - 100
  }

  // Getters
  getBattery(): number {
    return this.battery
  }

  setBattery(value: number): void {
    this.battery = Math.max(0, Math.min(this.maxBattery, value))
  }

  getPassengers(): any[] {
    return this.passengers
  }

  addPassenger(passenger: any): boolean {
    if (this.passengers.length < this.maxCapacity) {
      this.passengers.push(passenger)
      return true
    }
    return false
  }

  removeAllPassengers(): any[] {
    const removed = [...this.passengers]
    this.passengers = []
    return removed
  }

  getCurrentDrainRate(): number {
    return this.currentDrainRate
  }

  getRopeEndPosition(): { x: number, y: number } {
    return {
      x: this.x,
      y: this.y + 10 + this.ropeLength
    }
  }

  getIsRescuing(): boolean {
    return this.isRescuing
  }

  getIsCrashing(): boolean {
    return this.isCrashing
  }

  // Upgrade system support
  setMaxCapacity(value: number): void {
    this.maxCapacity = value
  }

  setMaxBattery(value: number): void {
    this.maxBattery = value
    // Proportionally adjust current battery
    this.battery = (this.battery / 100) * value
  }

  setMaxRopeLength(value: number): void {
    this.maxRopeLength = value
  }
}