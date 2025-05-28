import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { GameConfig } from '../utils/GameConfig.ts'

export class StartScreen extends Container {
  private background: Graphics
  private titleText: Text
  private subtitleText: Text
  private startButton: Container
  private instructionsText: Text
  
  private onStart: (() => void) | null = null

  constructor() {
    super()
    
    // Create background
    this.background = new Graphics()
    this.background.fill({ color: 0x1a1a1a })
    this.background.rect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT)
    this.addChild(this.background)
    
    // Title text
    this.titleText = new Text({
      text: 'Drone Rescue:\nSky Guardian',
      style: new TextStyle({
        fontSize: 42,
        fill: 0x4CAF50,
        fontWeight: 'bold',
        align: 'center',
        lineHeight: 50
      })
    })
    this.titleText.anchor.set(0.5)
    this.titleText.x = GameConfig.GAME_WIDTH / 2
    this.titleText.y = GameConfig.GAME_HEIGHT * 0.25
    this.addChild(this.titleText)
    
    // Subtitle
    this.subtitleText = new Text({
      text: 'TypeScript + PixiJS版',
      style: new TextStyle({
        fontSize: 16,
        fill: 0x888888,
        align: 'center'
      })
    })
    this.subtitleText.anchor.set(0.5)
    this.subtitleText.x = GameConfig.GAME_WIDTH / 2
    this.subtitleText.y = GameConfig.GAME_HEIGHT * 0.35
    this.addChild(this.subtitleText)
    
    // Start button
    this.startButton = this.createButton('ゲーム開始', 0x4CAF50)
    this.startButton.x = GameConfig.GAME_WIDTH / 2
    this.startButton.y = GameConfig.GAME_HEIGHT * 0.5
    this.addChild(this.startButton)
    
    // Instructions
    const instructionsStyle = new TextStyle({
      fontSize: 14,
      fill: 0xcccccc,
      align: 'left',
      lineHeight: 20
    })
    
    this.instructionsText = new Text({
      text: '操作方法:\n' +
            '↑↓←→ または WASD: 移動\n' +
            'スペース: ハシゴで救助/投下\n' +
            '\n' +
            'ヒント:\n' +
            '・市民をホームポイントまで運ぼう\n' +
            '・バッテリーに注意\n' +
            '・充電ポートは1回のみ使用可能',
      style: instructionsStyle
    })
    this.instructionsText.anchor.set(0.5, 0)
    this.instructionsText.x = GameConfig.GAME_WIDTH / 2
    this.instructionsText.y = GameConfig.GAME_HEIGHT * 0.65
    this.addChild(this.instructionsText)
    
    // Add interactivity
    this.startButton.eventMode = 'static'
    this.startButton.cursor = 'pointer'
    this.startButton.on('pointerdown', () => {
      this.animateButtonPress()
      this.onStart?.()
    })
    
    // Hover effect
    this.startButton.on('pointerover', () => {
      this.startButton.scale.set(1.05)
    })
    this.startButton.on('pointerout', () => {
      this.startButton.scale.set(1)
    })
  }

  private createButton(text: string, color: number): Container {
    const button = new Container()
    
    // Button background
    const bg = new Graphics()
    bg.fill({ color: color })
    bg.roundRect(-120, -30, 240, 60, 15)
    button.addChild(bg)
    
    // Button text
    const buttonText = new Text({
      text: text,
      style: new TextStyle({
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: 'bold'
      })
    })
    buttonText.anchor.set(0.5)
    button.addChild(buttonText)
    
    return button
  }

  private animateButtonPress(): void {
    this.startButton.scale.set(0.95)
    setTimeout(() => {
      this.startButton.scale.set(1)
    }, 100)
  }

  setStartCallback(callback: () => void): void {
    this.onStart = callback
  }
}