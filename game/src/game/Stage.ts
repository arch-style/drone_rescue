import { Container, Graphics, Rectangle } from 'pixi.js'
import { GameConfig } from '../utils/GameConfig'

export interface Building {
  x: number
  y: number
  width: number
  height: number
  color: number
  hasRoof: boolean
}

export interface ChargingPort {
  x: number
  y: number
  width: number
  height: number
  chargeAmount: number
  used: boolean
}

export class Stage extends Container {
  // World dimensions
  private worldWidth: number
  private worldHeight: number
  private stageNumber: number
  
  // Stage elements
  private groundLevel: number = GameConfig.STAGE.GROUND_LEVEL
  private buildings: Building[] = []
  private chargingPort: ChargingPort
  
  // Base (home point)
  private baseX: number = 50
  private baseWidth: number = 100
  private baseHeight: number = 80
  
  // Graphics layers
  private backgroundLayer: Container
  private buildingLayer: Container
  private groundLayer: Graphics
  private baseGraphics: Graphics
  private chargingPortGraphics: Graphics

  constructor(worldWidth: number, worldHeight: number, stageNumber: number) {
    super()
    
    this.worldWidth = worldWidth
    this.worldHeight = worldHeight
    this.stageNumber = stageNumber
    
    // Initialize layers
    this.backgroundLayer = new Container()
    this.buildingLayer = new Container()
    this.groundLayer = new Graphics()
    this.baseGraphics = new Graphics()
    this.chargingPortGraphics = new Graphics()
    
    // Add layers in order
    this.addChild(this.backgroundLayer)
    this.addChild(this.buildingLayer)
    this.addChild(this.groundLayer)
    this.addChild(this.baseGraphics)
    this.addChild(this.chargingPortGraphics)
    
    // Initialize charging port
    const chargeAmount = GameConfig.STAGE.CHARGE_AMOUNT_BASE - 
      Math.min(this.stageNumber * GameConfig.STAGE.CHARGE_AMOUNT_DECREASE, 20)
    
    this.chargingPort = {
      x: this.worldWidth * 0.7,
      y: this.groundLevel,
      width: 60,
      height: 40,
      chargeAmount: chargeAmount,
      used: false
    }
    
    // Generate stage
    this.generateStage()
  }

  private generateStage(): void {
    // Draw sky gradient
    this.drawSky()
    
    // Generate buildings
    this.generateBuildings()
    
    // Draw ground
    this.drawGround()
    
    // Draw base (home point)
    this.drawBase()
    
    // Draw charging port
    this.drawChargingPort()
  }

  private drawSky(): void {
    const sky = new Graphics()
    
    // Create gradient effect with multiple rectangles
    const colors = [0x87CEEB, 0x98D8E8, 0xB0E0E6]
    const steps = colors.length
    
    for (let i = 0; i < steps; i++) {
      sky.fill(colors[i])
      sky.rect(
        0, 
        (this.worldHeight / steps) * i, 
        this.worldWidth, 
        this.worldHeight / steps
      )
    }
    
    this.backgroundLayer.addChild(sky)
  }

  private generateBuildings(): void {
    // Clear existing buildings
    this.buildings = []
    
    // Building generation parameters based on stage
    const minBuildings = 5 + Math.floor(this.stageNumber / 2)
    const maxBuildings = 8 + this.stageNumber
    const buildingCount = Math.floor(Math.random() * (maxBuildings - minBuildings + 1)) + minBuildings
    
    // Available area for buildings (avoid base and charging port)
    const startX = this.baseX + this.baseWidth + 100
    const endX = this.chargingPort.x - 100
    const availableWidth = endX - startX
    
    for (let i = 0; i < buildingCount; i++) {
      const width = 60 + Math.random() * 80
      const height = 100 + Math.random() * 150
      const x = startX + (availableWidth / buildingCount) * i + Math.random() * 50
      const y = this.groundLevel
      
      // Building colors
      const colors = [0x808080, 0x696969, 0x778899, 0x708090]
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      const building: Building = {
        x,
        y,
        width,
        height,
        color,
        hasRoof: Math.random() > 0.3 // 70% chance of having a roof
      }
      
      this.buildings.push(building)
      this.drawBuilding(building)
    }
  }

  private drawBuilding(building: Building): void {
    const graphics = new Graphics()
    
    // Building body
    graphics.fill(building.color)
    graphics.rect(
      building.x, 
      building.y - building.height, 
      building.width, 
      building.height
    )
    
    // Windows
    graphics.fill(0xFFFF99)
    const windowSize = 10
    const windowSpacing = 20
    
    for (let y = building.y - building.height + 20; y < building.y - 20; y += windowSpacing) {
      for (let x = building.x + 10; x < building.x + building.width - 10; x += windowSpacing) {
        graphics.rect(x, y, windowSize, windowSize)
      }
    }
    
    // Roof indicator
    if (building.hasRoof) {
      graphics.fill(0x8B4513)
      graphics.rect(
        building.x - 5, 
        building.y - building.height - 5, 
        building.width + 10, 
        5
      )
    }
    
    this.buildingLayer.addChild(graphics)
  }

  private drawGround(): void {
    this.groundLayer.clear()
    
    // Ground
    this.groundLayer.fill(0x228B22)
    this.groundLayer.rect(0, this.groundLevel, this.worldWidth, this.worldHeight - this.groundLevel)
    
    // Ground texture lines
    this.groundLayer.stroke({ width: 1, color: 0x1F5F1F })
    for (let x = 0; x < this.worldWidth; x += 50) {
      this.groundLayer.moveTo(x, this.groundLevel)
      this.groundLayer.lineTo(x + 25, this.worldHeight)
    }
  }

  private drawBase(): void {
    this.baseGraphics.clear()
    
    // Base building
    this.baseGraphics.fill(0x4CAF50)
    this.baseGraphics.rect(
      this.baseX, 
      this.groundLevel - this.baseHeight, 
      this.baseWidth, 
      this.baseHeight
    )
    
    // Base roof
    this.baseGraphics.fill(0x388E3C)
    this.baseGraphics.moveTo(this.baseX - 10, this.groundLevel - this.baseHeight)
    this.baseGraphics.lineTo(this.baseX + this.baseWidth / 2, this.groundLevel - this.baseHeight - 30)
    this.baseGraphics.lineTo(this.baseX + this.baseWidth + 10, this.groundLevel - this.baseHeight)
    this.baseGraphics.closePath()
    
    // Base sign
    this.baseGraphics.fill(0xFFFFFF)
    this.baseGraphics.rect(
      this.baseX + this.baseWidth / 2 - 15, 
      this.groundLevel - this.baseHeight / 2 - 10, 
      30, 
      20
    )
    
    // "H" for Home
    this.baseGraphics.fill(0x000000)
    this.baseGraphics.rect(this.baseX + this.baseWidth / 2 - 8, this.groundLevel - this.baseHeight / 2 - 7, 3, 14)
    this.baseGraphics.rect(this.baseX + this.baseWidth / 2 + 5, this.groundLevel - this.baseHeight / 2 - 7, 3, 14)
    this.baseGraphics.rect(this.baseX + this.baseWidth / 2 - 5, this.groundLevel - this.baseHeight / 2 - 2, 10, 3)
  }

  private drawChargingPort(): void {
    this.chargingPortGraphics.clear()
    
    if (!this.chargingPort.used) {
      // Port base
      this.chargingPortGraphics.fill(0x2196F3)
      this.chargingPortGraphics.rect(
        this.chargingPort.x, 
        this.chargingPort.y - this.chargingPort.height, 
        this.chargingPort.width, 
        this.chargingPort.height
      )
      
      // Lightning symbol
      this.chargingPortGraphics.fill(0xFFEB3B)
      const cx = this.chargingPort.x + this.chargingPort.width / 2
      const cy = this.chargingPort.y - this.chargingPort.height / 2
      
      this.chargingPortGraphics.moveTo(cx - 8, cy - 10)
      this.chargingPortGraphics.lineTo(cx - 2, cy)
      this.chargingPortGraphics.lineTo(cx + 2, cy - 2)
      this.chargingPortGraphics.lineTo(cx + 8, cy + 10)
      this.chargingPortGraphics.lineTo(cx + 2, cy)
      this.chargingPortGraphics.lineTo(cx - 2, cy + 2)
      this.chargingPortGraphics.closePath()
      
      // Charge amount indicator
      this.chargingPortGraphics.fill(0x00FF00)
      this.chargingPortGraphics.rect(
        this.chargingPort.x + 5,
        this.chargingPort.y - 10,
        (this.chargingPort.width - 10) * (this.chargingPort.chargeAmount / 30),
        5
      )
    } else {
      // Used port (grayed out)
      this.chargingPortGraphics.fill(0x555555)
      this.chargingPortGraphics.rect(
        this.chargingPort.x, 
        this.chargingPort.y - this.chargingPort.height, 
        this.chargingPort.width, 
        this.chargingPort.height
      )
    }
  }

  // Public methods
  getGroundLevel(): number {
    return this.groundLevel
  }

  getBuildings(): Building[] {
    return this.buildings
  }

  getBase(): Rectangle {
    return new Rectangle(
      this.baseX,
      this.groundLevel - this.baseHeight,
      this.baseWidth,
      this.baseHeight
    )
  }

  getBaseCenter(): { x: number, y: number } {
    return {
      x: this.baseX + this.baseWidth / 2,
      y: this.groundLevel - this.baseHeight / 2
    }
  }

  getChargingPort(): ChargingPort {
    return this.chargingPort
  }

  useChargingPort(): void {
    this.chargingPort.used = true
    this.drawChargingPort()
  }

  isPointOnGround(x: number, y: number): boolean {
    return y >= this.groundLevel
  }

  isPointOnBuilding(x: number, y: number): Building | null {
    for (const building of this.buildings) {
      if (x >= building.x && 
          x <= building.x + building.width &&
          y <= building.y && 
          y >= building.y - building.height) {
        return building
      }
    }
    return null
  }

  getWorldBounds(): Rectangle {
    return new Rectangle(0, 0, this.worldWidth, this.worldHeight)
  }
}