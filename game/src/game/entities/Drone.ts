import { Container, Graphics, Text } from 'pixi.js'
import { GameConfig } from '../../utils/GameConfig'

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
    
    // Simple drone shape (will be replaced with sprite later)
    this.body.fill(0x4444ff)
    this.body.roundRect(-20, -10, 40, 20, 5)
    
    // Propellers
    this.body.fill(0x666666)
    this.body.rect(-25, -15, 10, 3)
    this.body.rect(15, -15, 10, 3)
    
    // Cabin window
    if (!this.isCrashing) {
      this.body.fill(0x88ccff)
      this.body.rect(-10, -5, 20, 10)
    }
  }

  update(deltaTime: number, keys: Record<string, boolean>): void {
    if (this.isCrashing) {
      this.updateCrash(deltaTime)
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
      this.ropeGraphics.stroke({ width: 2, color: 0x8B4513 })
      this.ropeGraphics.moveTo(0, 10)
      this.ropeGraphics.lineTo(0, 10 + this.ropeLength)
      
      // Rope end
      this.ropeGraphics.fill(0x444444)
      this.ropeGraphics.circle(0, 10 + this.ropeLength, 5)
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