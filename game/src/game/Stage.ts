import { Container, Graphics, Rectangle } from 'pixi.js'
import { GameConfig } from '../utils/GameConfig.ts'

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
    
    // Beautiful gradient sky
    const gradientSteps = 10
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / (gradientSteps - 1)
      // Morning sky gradient
      const r = Math.floor(135 + t * 120) // 135 -> 255
      const g = Math.floor(206 + t * 20)  // 206 -> 226
      const b = Math.floor(235 - t * 100) // 235 -> 135
      const color = (r << 16) | (g << 8) | b
      
      sky.fill({ color: color })
      sky.rect(
        0, 
        (this.worldHeight / gradientSteps) * i, 
        this.worldWidth, 
        this.worldHeight / gradientSteps + 1
      )
    }
    
    // Clouds
    const cloudGraphics = new Graphics()
    const numClouds = 8 + Math.floor(Math.random() * 5)
    
    for (let i = 0; i < numClouds; i++) {
      const x = Math.random() * this.worldWidth
      const y = 50 + Math.random() * 200
      const scale = 0.5 + Math.random() * 1
      
      // Cloud puffs
      cloudGraphics.fill({ color: 0xFFFFFF, alpha: 0.7 })
      cloudGraphics.circle(x, y, 30 * scale)
      cloudGraphics.circle(x - 25 * scale, y + 5 * scale, 25 * scale)
      cloudGraphics.circle(x + 25 * scale, y + 5 * scale, 25 * scale)
      cloudGraphics.circle(x - 15 * scale, y - 10 * scale, 20 * scale)
      cloudGraphics.circle(x + 15 * scale, y - 10 * scale, 20 * scale)
      
      // Cloud shadow
      cloudGraphics.fill({ color: 0xE0E0E0, alpha: 0.3 })
      cloudGraphics.circle(x, y + 10 * scale, 28 * scale)
      cloudGraphics.circle(x - 23 * scale, y + 15 * scale, 23 * scale)
      cloudGraphics.circle(x + 23 * scale, y + 15 * scale, 23 * scale)
    }
    
    // Sun
    const sunGraphics = new Graphics()
    const sunX = this.worldWidth * 0.8
    const sunY = 100
    
    // Sun glow
    for (let i = 3; i >= 0; i--) {
      sunGraphics.fill({ color: 0xFFEB3B, alpha: 0.1 + i * 0.05 })
      sunGraphics.circle(sunX, sunY, 50 + i * 20)
    }
    
    // Sun core
    sunGraphics.fill({ color: 0xFFD54F })
    sunGraphics.circle(sunX, sunY, 40)
    sunGraphics.fill({ color: 0xFFEB3B })
    sunGraphics.circle(sunX - 5, sunY - 5, 35)
    
    // Birds (simple V shapes)
    const birdGraphics = new Graphics()
    birdGraphics.stroke({ width: 2, color: 0x424242 })
    
    for (let i = 0; i < 5; i++) {
      const bx = Math.random() * this.worldWidth
      const by = 50 + Math.random() * 150
      const size = 5 + Math.random() * 5
      
      birdGraphics.moveTo(bx - size, by)
      birdGraphics.lineTo(bx, by - size/2)
      birdGraphics.lineTo(bx + size, by)
    }
    
    this.backgroundLayer.addChild(sky)
    this.backgroundLayer.addChild(sunGraphics)
    this.backgroundLayer.addChild(cloudGraphics)
    this.backgroundLayer.addChild(birdGraphics)
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
    
    // Building shadow on ground
    graphics.fill({ color: 0x000000, alpha: 0.3 })
    graphics.beginPath()
    graphics.moveTo(building.x + 5, building.y)
    graphics.lineTo(building.x + building.width + 20, building.y)
    graphics.lineTo(building.x + building.width + 25, building.y + 15)
    graphics.lineTo(building.x + 10, building.y + 15)
    graphics.closePath()
    graphics.fill()
    
    // Building side (3D effect)
    const sideWidth = 20
    const sideDarkness = 0x151515
    graphics.fill({ color: building.color - sideDarkness })
    graphics.beginPath()
    graphics.moveTo(building.x + building.width, building.y - building.height)
    graphics.lineTo(building.x + building.width + sideWidth, building.y - building.height - sideWidth * 0.7)
    graphics.lineTo(building.x + building.width + sideWidth, building.y - sideWidth * 0.7)
    graphics.lineTo(building.x + building.width, building.y)
    graphics.closePath()
    graphics.fill()
    
    // Building front face
    graphics.fill({ color: building.color })
    graphics.rect(
      building.x, 
      building.y - building.height, 
      building.width, 
      building.height
    )
    
    // Vertical detail lines on building
    graphics.stroke({ width: 1, color: building.color - 0x0A0A0A, alpha: 0.5 })
    for (let x = building.x + 15; x < building.x + building.width; x += 30) {
      graphics.moveTo(x, building.y - building.height)
      graphics.lineTo(x, building.y)
    }
    
    // Windows with variety
    const windowWidth = 12
    const windowHeight = 16
    const windowSpacingX = 22
    const windowSpacingY = 25
    const marginX = 12
    const marginY = 15
    
    for (let y = building.y - building.height + marginY; y < building.y - marginY; y += windowSpacingY) {
      for (let x = building.x + marginX; x < building.x + building.width - marginX - windowWidth; x += windowSpacingX) {
        // Window frame
        graphics.fill({ color: 0x37474F })
        graphics.rect(x - 1, y - 1, windowWidth + 2, windowHeight + 2)
        
        // Window glass with random lighting
        const isLit = Math.random() > 0.4
        if (isLit) {
          // Different room lights
          const lightTypes = [
            { color: 0xFFEB3B, alpha: 0.8 }, // Yellow
            { color: 0xE3F2FD, alpha: 0.9 }, // Blue-white
            { color: 0xFFF3E0, alpha: 0.7 }, // Warm white
          ]
          const light = lightTypes[Math.floor(Math.random() * lightTypes.length)]
          graphics.fill(light)
        } else {
          graphics.fill({ color: 0x263238, alpha: 0.9 })
        }
        graphics.rect(x, y, windowWidth, windowHeight)
        
        // Window reflection/shine
        graphics.fill({ color: 0xFFFFFF, alpha: 0.3 })
        graphics.rect(x + 1, y + 1, windowWidth * 0.4, windowHeight * 0.4)
        
        // Window divider (cross)
        graphics.stroke({ width: 1, color: 0x37474F })
        graphics.moveTo(x + windowWidth / 2, y)
        graphics.lineTo(x + windowWidth / 2, y + windowHeight)
        graphics.moveTo(x, y + windowHeight / 2)
        graphics.lineTo(x + windowWidth, y + windowHeight / 2)
      }
    }
    
    // Building entrance
    const entranceWidth = Math.min(building.width * 0.4, 35)
    const entranceHeight = 40
    const entranceX = building.x + (building.width - entranceWidth) / 2
    
    // Entrance canopy
    graphics.fill({ color: building.color - 0x202020 })
    graphics.beginPath()
    graphics.moveTo(entranceX - 10, building.y - entranceHeight - 5)
    graphics.lineTo(entranceX + entranceWidth + 10, building.y - entranceHeight - 5)
    graphics.lineTo(entranceX + entranceWidth + 15, building.y - entranceHeight)
    graphics.lineTo(entranceX - 15, building.y - entranceHeight)
    graphics.closePath()
    graphics.fill()
    
    // Entrance frame
    graphics.fill({ color: 0x37474F })
    graphics.rect(entranceX - 3, building.y - entranceHeight - 3, entranceWidth + 6, entranceHeight + 3)
    
    // Glass doors
    graphics.fill({ color: 0x1E88E5, alpha: 0.8 })
    graphics.rect(entranceX, building.y - entranceHeight, entranceWidth / 2 - 1, entranceHeight)
    graphics.rect(entranceX + entranceWidth / 2 + 1, building.y - entranceHeight, entranceWidth / 2 - 1, entranceHeight)
    
    // Door handles
    graphics.fill({ color: 0x90A4AE })
    graphics.circle(entranceX + entranceWidth / 2 - 5, building.y - entranceHeight / 2, 2)
    graphics.circle(entranceX + entranceWidth / 2 + 5, building.y - entranceHeight / 2, 2)
    
    // Roof details
    if (building.hasRoof) {
      // Roof top
      graphics.fill({ color: building.color - 0x303030 })
      graphics.beginPath()
      graphics.moveTo(building.x - 5, building.y - building.height)
      graphics.lineTo(building.x + building.width + 5, building.y - building.height)
      graphics.lineTo(building.x + building.width + sideWidth + 5, building.y - building.height - sideWidth * 0.7)
      graphics.lineTo(building.x + sideWidth - 5, building.y - building.height - sideWidth * 0.7)
      graphics.closePath()
      graphics.fill()
      
      // Roof equipment (AC units, antennas)
      const numEquipment = 1 + Math.floor(Math.random() * 3)
      for (let i = 0; i < numEquipment; i++) {
        const eqX = building.x + 20 + Math.random() * (building.width - 40)
        const eqY = building.y - building.height - 5
        
        if (Math.random() > 0.5) {
          // AC unit
          graphics.fill({ color: 0x607D8B })
          graphics.rect(eqX, eqY - 8, 15, 8)
          graphics.fill({ color: 0x455A64 })
          graphics.rect(eqX + 2, eqY - 6, 11, 2)
          graphics.rect(eqX + 2, eqY - 3, 11, 2)
        } else {
          // Antenna
          graphics.fill({ color: 0x546E7A })
          graphics.rect(eqX, eqY - 25, 2, 25)
          // Blinking light
          const blink = Math.sin(Date.now() * 0.003 + i) * 0.5 + 0.5
          graphics.fill({ color: 0xFF5252, alpha: blink })
          graphics.circle(eqX + 1, eqY - 27, 3)
        }
      }
    }
    
    // Building sign/logo area
    if (Math.random() > 0.6 && building.height > 120) {
      const signY = building.y - building.height + 35
      const signWidth = building.width * 0.6
      const signX = building.x + (building.width - signWidth) / 2
      
      graphics.fill({ color: 0xECEFF1, alpha: 0.9 })
      graphics.rect(signX, signY, signWidth, 20)
      
      // Fake company text lines
      graphics.fill({ color: 0x37474F })
      graphics.rect(signX + 10, signY + 7, signWidth - 20, 2)
      graphics.rect(signX + 10, signY + 11, signWidth * 0.6, 2)
    }
    
    this.buildingLayer.addChild(graphics)
  }

  private drawGround(): void {
    this.groundLayer.clear()
    
    // Ground gradient (darker at bottom)
    const groundHeight = this.worldHeight - this.groundLevel
    const gradientSteps = 5
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps
      const color = 0x3E7C17 - Math.floor(t * 0x151515)
      this.groundLayer.fill({ color: color })
      this.groundLayer.rect(
        0, 
        this.groundLevel + (groundHeight / gradientSteps) * i,
        this.worldWidth,
        groundHeight / gradientSteps + 1
      )
    }
    
    // Grass texture
    this.groundLayer.stroke({ width: 1, color: 0x4E9F3D, alpha: 0.6 })
    for (let x = 0; x < this.worldWidth; x += 15) {
      const grassHeight = 5 + Math.random() * 8
      const sway = Math.sin(x * 0.05 + Date.now() * 0.0005) * 2
      
      this.groundLayer.moveTo(x, this.groundLevel)
      this.groundLayer.lineTo(x + sway, this.groundLevel - grassHeight)
    }
    
    // Small rocks and details
    for (let i = 0; i < 30; i++) {
      const rockX = Math.random() * this.worldWidth
      const rockY = this.groundLevel + 10 + Math.random() * 40
      const rockSize = 3 + Math.random() * 5
      
      this.groundLayer.fill({ color: 0x5D4037, alpha: 0.7 })
      this.groundLayer.circle(rockX, rockY, rockSize)
      this.groundLayer.fill({ color: 0x6D4C41, alpha: 0.5 })
      this.groundLayer.circle(rockX - 1, rockY - 1, rockSize * 0.7)
    }
    
    // Path/road texture
    this.groundLayer.fill({ color: 0x424242, alpha: 0.3 })
    this.groundLayer.rect(0, this.groundLevel, this.worldWidth, 15)
    
    // Road markings
    this.groundLayer.stroke({ width: 2, color: 0xFFFFFF, alpha: 0.4 })
    for (let x = 20; x < this.worldWidth; x += 80) {
      this.groundLayer.moveTo(x, this.groundLevel + 7)
      this.groundLayer.lineTo(x + 40, this.groundLevel + 7)
    }
  }

  private drawBase(): void {
    this.baseGraphics.clear()
    
    // Base shadow
    this.baseGraphics.fill({ color: 0x000000, alpha: 0.3 })
    this.baseGraphics.beginPath()
    this.baseGraphics.moveTo(this.baseX + 5, this.groundLevel)
    this.baseGraphics.lineTo(this.baseX + this.baseWidth + 10, this.groundLevel)
    this.baseGraphics.lineTo(this.baseX + this.baseWidth + 15, this.groundLevel + 10)
    this.baseGraphics.lineTo(this.baseX + 10, this.groundLevel + 10)
    this.baseGraphics.closePath()
    this.baseGraphics.fill()
    
    // Base building (3D effect)
    const sideWidth = 15
    this.baseGraphics.fill({ color: 0x388E3C })
    this.baseGraphics.beginPath()
    this.baseGraphics.moveTo(this.baseX + this.baseWidth, this.groundLevel - this.baseHeight)
    this.baseGraphics.lineTo(this.baseX + this.baseWidth + sideWidth, this.groundLevel - this.baseHeight - sideWidth * 0.5)
    this.baseGraphics.lineTo(this.baseX + this.baseWidth + sideWidth, this.groundLevel - sideWidth * 0.5)
    this.baseGraphics.lineTo(this.baseX + this.baseWidth, this.groundLevel)
    this.baseGraphics.closePath()
    this.baseGraphics.fill()
    
    // Base building front
    this.baseGraphics.fill({ color: 0x4CAF50 })
    this.baseGraphics.rect(
      this.baseX, 
      this.groundLevel - this.baseHeight, 
      this.baseWidth, 
      this.baseHeight
    )
    
    // Base detail stripes
    this.baseGraphics.fill({ color: 0x43A047 })
    for (let y = 0; y < 3; y++) {
      this.baseGraphics.rect(
        this.baseX,
        this.groundLevel - this.baseHeight + y * 25 + 10,
        this.baseWidth,
        5
      )
    }
    
    // Helipad on roof
    this.baseGraphics.fill({ color: 0x2E7D32 })
    this.baseGraphics.rect(
      this.baseX - 10, 
      this.groundLevel - this.baseHeight - 5, 
      this.baseWidth + 20, 
      5
    )
    
    // Helipad circle and H
    const helipadCenterX = this.baseX + this.baseWidth / 2
    const helipadCenterY = this.groundLevel - this.baseHeight - 3
    
    this.baseGraphics.stroke({ width: 3, color: 0xFFFFFF })
    this.baseGraphics.circle(helipadCenterX, helipadCenterY, 25)
    
    // H marking
    this.baseGraphics.fill({ color: 0xFFFFFF })
    this.baseGraphics.rect(helipadCenterX - 12, helipadCenterY - 10, 3, 20)
    this.baseGraphics.rect(helipadCenterX + 9, helipadCenterY - 10, 3, 20)
    this.baseGraphics.rect(helipadCenterX - 9, helipadCenterY - 2, 18, 3)
    
    // Control tower
    const towerX = this.baseX + this.baseWidth - 25
    const towerHeight = 40
    
    this.baseGraphics.fill({ color: 0x37474F })
    this.baseGraphics.rect(towerX, this.groundLevel - this.baseHeight - towerHeight, 20, towerHeight)
    
    // Tower windows
    this.baseGraphics.fill({ color: 0x81D4FA })
    this.baseGraphics.rect(towerX + 2, this.groundLevel - this.baseHeight - towerHeight + 5, 16, 10)
    
    // Rotating beacon on tower
    const beaconAngle = Date.now() * 0.002
    const beaconLength = 30
    this.baseGraphics.stroke({ width: 3, color: 0xFFEB3B, alpha: 0.8 })
    this.baseGraphics.moveTo(towerX + 10, this.groundLevel - this.baseHeight - towerHeight - 5)
    this.baseGraphics.lineTo(
      towerX + 10 + Math.cos(beaconAngle) * beaconLength,
      this.groundLevel - this.baseHeight - towerHeight - 5 + Math.sin(beaconAngle) * beaconLength * 0.3
    )
    
    // Base entrance (larger, more detailed)
    const entranceWidth = 40
    const entranceHeight = 50
    const entranceX = this.baseX + (this.baseWidth - entranceWidth) / 2
    
    // Entrance frame
    this.baseGraphics.fill({ color: 0x2E7D32 })
    this.baseGraphics.rect(entranceX - 5, this.groundLevel - entranceHeight - 5, entranceWidth + 10, entranceHeight + 5)
    
    // Glass entrance
    this.baseGraphics.fill({ color: 0x64B5F6, alpha: 0.8 })
    this.baseGraphics.rect(entranceX, this.groundLevel - entranceHeight, entranceWidth, entranceHeight)
    
    // Entrance dividers
    this.baseGraphics.stroke({ width: 2, color: 0x1976D2 })
    this.baseGraphics.moveTo(entranceX + entranceWidth / 3, this.groundLevel - entranceHeight)
    this.baseGraphics.lineTo(entranceX + entranceWidth / 3, this.groundLevel)
    this.baseGraphics.moveTo(entranceX + entranceWidth * 2 / 3, this.groundLevel - entranceHeight)
    this.baseGraphics.lineTo(entranceX + entranceWidth * 2 / 3, this.groundLevel)
    
    // Emergency sign above entrance
    this.baseGraphics.fill({ color: 0xF44336 })
    this.baseGraphics.rect(
      entranceX - 10, 
      this.groundLevel - entranceHeight - 25, 
      entranceWidth + 20, 
      18
    )
    
    // Cross symbol
    this.baseGraphics.fill({ color: 0xFFFFFF })
    this.baseGraphics.rect(entranceX + entranceWidth / 2 - 2, this.groundLevel - entranceHeight - 21, 4, 10)
    this.baseGraphics.rect(entranceX + entranceWidth / 2 - 5, this.groundLevel - entranceHeight - 18, 10, 4)
    
    // "RESCUE" text placeholder
    this.baseGraphics.fill({ color: 0xFFFFFF })
    this.baseGraphics.rect(entranceX + 5, this.groundLevel - entranceHeight - 18, 30, 2)
    this.baseGraphics.rect(entranceX + 8, this.groundLevel - entranceHeight - 14, 24, 2)
    
    // Landing lights
    for (let i = 0; i < 4; i++) {
      const lightX = this.baseX - 20 + i * 40
      const lightY = this.groundLevel - 5
      const lightOn = Math.sin(Date.now() * 0.003 + i) > 0
      
      this.baseGraphics.fill({ color: lightOn ? 0xFFEB3B : 0x424242 })
      this.baseGraphics.circle(lightX, lightY, 4)
      
      if (lightOn) {
        this.baseGraphics.fill({ color: 0xFFEB3B, alpha: 0.3 })
        this.baseGraphics.circle(lightX, lightY, 8)
      }
    }
  }

  private drawChargingPort(): void {
    this.chargingPortGraphics.clear()
    
    const cx = this.chargingPort.x + this.chargingPort.width / 2
    const cy = this.chargingPort.y - this.chargingPort.height / 2
    
    if (!this.chargingPort.used) {
      // Charging port platform
      this.chargingPortGraphics.fill({ color: 0x37474F })
      this.chargingPortGraphics.rect(
        this.chargingPort.x - 5, 
        this.chargingPort.y - 5, 
        this.chargingPort.width + 10, 
        5
      )
      
      // Port base with gradient effect
      this.chargingPortGraphics.fill({ color: 0x1976D2 })
      this.chargingPortGraphics.rect(
        this.chargingPort.x, 
        this.chargingPort.y - this.chargingPort.height, 
        this.chargingPort.width, 
        this.chargingPort.height
      )
      
      // Glowing edge
      this.chargingPortGraphics.stroke({ width: 2, color: 0x64B5F6 })
      this.chargingPortGraphics.rect(
        this.chargingPort.x, 
        this.chargingPort.y - this.chargingPort.height, 
        this.chargingPort.width, 
        this.chargingPort.height
      )
      
      // Energy field effect
      const pulseAlpha = Math.sin(Date.now() * 0.003) * 0.3 + 0.5
      this.chargingPortGraphics.fill({ color: 0x00E5FF, alpha: pulseAlpha })
      this.chargingPortGraphics.circle(cx, cy, 25)
      this.chargingPortGraphics.fill({ color: 0x00B8D4, alpha: pulseAlpha * 0.7 })
      this.chargingPortGraphics.circle(cx, cy, 20)
      
      // Lightning bolt (animated)
      const boltOffset = Math.sin(Date.now() * 0.005) * 2
      this.chargingPortGraphics.fill({ color: 0xFFEB3B })
      this.chargingPortGraphics.beginPath()
      this.chargingPortGraphics.moveTo(cx - 8 + boltOffset, cy - 12)
      this.chargingPortGraphics.lineTo(cx - 3, cy - 2)
      this.chargingPortGraphics.lineTo(cx + 1, cy - 4)
      this.chargingPortGraphics.lineTo(cx + 8 + boltOffset, cy + 12)
      this.chargingPortGraphics.lineTo(cx + 3, cy + 2)
      this.chargingPortGraphics.lineTo(cx - 1, cy + 4)
      this.chargingPortGraphics.closePath()
      this.chargingPortGraphics.fill()
      
      // Lightning glow
      this.chargingPortGraphics.fill({ color: 0xFFFFFF, alpha: 0.6 })
      this.chargingPortGraphics.circle(cx, cy - 5, 3)
      this.chargingPortGraphics.circle(cx, cy + 5, 3)
      
      // Energy particles
      for (let i = 0; i < 5; i++) {
        const angle = (Date.now() * 0.002 + i * Math.PI * 2 / 5) % (Math.PI * 2)
        const radius = 15 + Math.sin(Date.now() * 0.003 + i) * 5
        const px = cx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius
        
        this.chargingPortGraphics.fill({ color: 0x00E5FF, alpha: 0.8 })
        this.chargingPortGraphics.circle(px, py, 2)
      }
      
      // Charge level display (futuristic bar)
      const chargePercent = this.chargingPort.chargeAmount / 30
      const barWidth = this.chargingPort.width - 10
      const barHeight = 8
      const barY = this.chargingPort.y - 15
      
      // Bar background
      this.chargingPortGraphics.fill({ color: 0x263238 })
      this.chargingPortGraphics.rect(
        this.chargingPort.x + 5,
        barY,
        barWidth,
        barHeight
      )
      
      // Bar fill with gradient
      const chargeColor = chargePercent > 0.6 ? 0x4CAF50 : chargePercent > 0.3 ? 0xFFEB3B : 0xF44336
      this.chargingPortGraphics.fill({ color: chargeColor })
      this.chargingPortGraphics.rect(
        this.chargingPort.x + 5,
        barY,
        barWidth * chargePercent,
        barHeight
      )
      
      // Bar segments
      this.chargingPortGraphics.stroke({ width: 1, color: 0x000000, alpha: 0.3 })
      for (let i = 1; i < 5; i++) {
        const segX = this.chargingPort.x + 5 + (barWidth / 5) * i
        this.chargingPortGraphics.moveTo(segX, barY)
        this.chargingPortGraphics.lineTo(segX, barY + barHeight)
      }
      
      // Charge percentage text placeholder
      this.chargingPortGraphics.fill({ color: 0xFFFFFF })
      this.chargingPortGraphics.rect(cx - 15, barY - 12, 30, 2)
      this.chargingPortGraphics.rect(cx - 10, barY - 9, 20, 2)
      
    } else {
      // Used port (powered down)
      this.chargingPortGraphics.fill({ color: 0x37474F })
      this.chargingPortGraphics.rect(
        this.chargingPort.x - 5, 
        this.chargingPort.y - 5, 
        this.chargingPort.width + 10, 
        5
      )
      
      this.chargingPortGraphics.fill({ color: 0x455A64 })
      this.chargingPortGraphics.rect(
        this.chargingPort.x, 
        this.chargingPort.y - this.chargingPort.height, 
        this.chargingPort.width, 
        this.chargingPort.height
      )
      
      // Depleted symbol
      this.chargingPortGraphics.fill({ color: 0x607D8B })
      this.chargingPortGraphics.beginPath()
      this.chargingPortGraphics.moveTo(cx - 8, cy - 12)
      this.chargingPortGraphics.lineTo(cx - 3, cy - 2)
      this.chargingPortGraphics.lineTo(cx + 1, cy - 4)
      this.chargingPortGraphics.lineTo(cx + 8, cy + 12)
      this.chargingPortGraphics.lineTo(cx + 3, cy + 2)
      this.chargingPortGraphics.lineTo(cx - 1, cy + 4)
      this.chargingPortGraphics.closePath()
      this.chargingPortGraphics.fill()
      
      // "DEPLETED" indicator
      this.chargingPortGraphics.fill({ color: 0xF44336 })
      this.chargingPortGraphics.rect(cx - 20, this.chargingPort.y - 15, 40, 2)
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