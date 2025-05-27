import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { GameConfig } from '../utils/GameConfig'
import { GameStats } from '../game/GameState'

export class HUD extends Container {
  private batteryBar: Graphics
  private batteryFill: Graphics
  private batteryText: Text
  private drainText: Text
  
  private timeText: Text
  private stageText: Text
  private rescuedText: Text
  private capacityText: Text
  
  private backgroundBar: Graphics

  constructor() {
    super()
    
    // Create background for top bar
    this.backgroundBar = new Graphics()
    this.backgroundBar.fill(0x000000, 0.5)
    this.backgroundBar.rect(0, 0, GameConfig.GAME_WIDTH, 60)
    this.addChild(this.backgroundBar)
    
    // Initialize battery display
    this.batteryBar = new Graphics()
    this.batteryFill = new Graphics()
    this.batteryText = new Text({ text: '100%', style: this.createTextStyle() })
    this.drainText = new Text({ 
      text: '-0.2%/s', 
      style: this.createTextStyle(12, 0xFFD700) 
    })
    
    // Initialize status texts
    this.timeText = new Text({ text: '1:30', style: this.createTextStyle() })
    this.stageText = new Text({ text: 'Stage 1', style: this.createTextStyle() })
    this.rescuedText = new Text({ text: '0/5', style: this.createTextStyle() })
    this.capacityText = new Text({ text: '0/5', style: this.createTextStyle() })
    
    this.setupUI()
  }

  private createTextStyle(size: number = 16, color: number = 0xFFFFFF): Partial<TextStyle> {
    return {
      fontSize: size,
      fill: color,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    }
  }

  private setupUI(): void {
    // Battery bar background
    this.batteryBar.fill(0x333333)
    this.batteryBar.rect(10, 10, GameConfig.GAME_WIDTH - 20, 20)
    this.addChild(this.batteryBar)
    
    // Battery fill
    this.updateBattery(100, 0.2)
    this.addChild(this.batteryFill)
    
    // Battery text
    this.batteryText.x = GameConfig.GAME_WIDTH / 2 - 20
    this.batteryText.y = 12
    this.addChild(this.batteryText)
    
    // Drain rate text
    this.drainText.x = GameConfig.GAME_WIDTH / 2 + 40
    this.drainText.y = 14
    this.addChild(this.drainText)
    
    // Status bar items
    const statusY = 38
    const spacing = GameConfig.GAME_WIDTH / 5
    
    // Stage
    this.stageText.x = spacing * 0.5 - 30
    this.stageText.y = statusY
    this.addChild(this.stageText)
    
    // Time
    this.timeText.x = spacing * 1.5 - 20
    this.timeText.y = statusY
    this.addChild(this.timeText)
    
    // Rescued
    this.rescuedText.x = spacing * 2.5 - 20
    this.rescuedText.y = statusY
    this.addChild(this.rescuedText)
    
    // Capacity
    this.capacityText.x = spacing * 3.5 - 20
    this.capacityText.y = statusY
    this.addChild(this.capacityText)
  }

  updateBattery(percent: number, drainRate: number): void {
    // Update battery fill
    this.batteryFill.clear()
    const fillColor = percent < 20 ? 0xFF0000 : percent < 50 ? 0xFFAA00 : 0x00FF00
    this.batteryFill.fill(fillColor)
    this.batteryFill.rect(
      12, 
      12, 
      (GameConfig.GAME_WIDTH - 24) * (percent / 100), 
      16
    )
    
    // Update texts
    this.batteryText.text = `${Math.floor(percent)}%`
    this.drainText.text = `-${drainRate.toFixed(1)}%/s`
    
    // Update drain text color based on rate
    const drainColor = drainRate > 3.0 ? 0xFF0000 : drainRate > 1.5 ? 0xFFA500 : 0xFFD700
    this.drainText.style.fill = drainColor
  }

  updateStats(stats: GameStats): void {
    // Update stage
    this.stageText.text = `Stage ${stats.currentStage}`
    
    // Update time
    const remainingTime = Math.max(0, GameConfig.STAGE.TIME_LIMIT - stats.time)
    const minutes = Math.floor(remainingTime / 60)
    const seconds = Math.floor(remainingTime % 60)
    this.timeText.text = `${minutes}:${seconds.toString().padStart(2, '0')}`
    
    // Color time red when low
    this.timeText.style.fill = remainingTime < 30 ? 0xFF0000 : 0xFFFFFF
  }

  updateRescued(current: number, total: number): void {
    this.rescuedText.text = `${current}/${total}`
  }

  updateCapacity(current: number, max: number): void {
    this.capacityText.text = `${current}/${max}`
  }
}