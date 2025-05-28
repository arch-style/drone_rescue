import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { GameConfig } from '../utils/GameConfig.ts'
import type { GameStats } from '../game/GameState.ts'

export class GameOverScreen extends Container {
  private background: Graphics
  private titleText: Text
  private scoreText: Text
  private continueButton: Container
  private continueButtonText: Text
  private titleButton: Container
  private titleButtonText: Text
  
  private onContinue: (() => void) | null = null
  private onTitle: (() => void) | null = null

  constructor() {
    super()
    
    // Create semi-transparent background
    this.background = new Graphics()
    this.background.fill({ color: 0x000000, alpha: 0.7 })
    this.background.rect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT)
    this.addChild(this.background)
    
    // Title text
    this.titleText = new Text({
      text: 'ミッション失敗',
      style: new TextStyle({
        fontSize: 36,
        fill: 0xff6b6b,
        fontWeight: 'bold',
        align: 'center'
      })
    })
    this.titleText.anchor.set(0.5)
    this.titleText.x = GameConfig.GAME_WIDTH / 2
    this.titleText.y = GameConfig.GAME_HEIGHT * 0.3
    this.addChild(this.titleText)
    
    // Score text
    this.scoreText = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 20,
        fill: 0xffffff,
        align: 'center'
      })
    })
    this.scoreText.anchor.set(0.5)
    this.scoreText.x = GameConfig.GAME_WIDTH / 2
    this.scoreText.y = GameConfig.GAME_HEIGHT * 0.5
    this.addChild(this.scoreText)
    
    // Continue button
    this.continueButton = this.createButton('コンティニュー ($100)', 0x4CAF50)
    this.continueButton.x = GameConfig.GAME_WIDTH / 2
    this.continueButton.y = GameConfig.GAME_HEIGHT * 0.65
    this.continueButtonText = this.continueButton.getChildAt(1) as Text
    this.addChild(this.continueButton)
    
    // Title button
    this.titleButton = this.createButton('タイトルに戻る', 0x2196F3)
    this.titleButton.x = GameConfig.GAME_WIDTH / 2
    this.titleButton.y = GameConfig.GAME_HEIGHT * 0.75
    this.addChild(this.titleButton)
    
    // Add interactivity
    this.continueButton.eventMode = 'static'
    this.continueButton.cursor = 'pointer'
    this.continueButton.on('pointerdown', () => this.onContinue?.())
    
    this.titleButton.eventMode = 'static'
    this.titleButton.cursor = 'pointer'
    this.titleButton.on('pointerdown', () => this.onTitle?.())
  }

  private createButton(text: string, color: number): Container {
    const button = new Container()
    
    // Button background
    const bg = new Graphics()
    bg.fill({ color: color })
    bg.roundRect(-100, -25, 200, 50, 10)
    button.addChild(bg)
    
    // Button text
    const buttonText = new Text({
      text: text,
      style: new TextStyle({
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 'bold'
      })
    })
    buttonText.anchor.set(0.5)
    button.addChild(buttonText)
    
    return button
  }

  showGameOver(stats: GameStats, failureReason: string): void {
    this.titleText.text = 'ミッション失敗'
    this.titleText.style.fill = 0xff6b6b
    
    const scoreText = `${failureReason}\n\n` +
                     `ステージ ${stats.currentStage}\n` +
                     `救助人数: ${stats.rescuedCount}人\n` +
                     `所持金: $${stats.money}`
    this.scoreText.text = scoreText
    
    // Update continue button cost
    const continueCost = 50 * Math.pow(2, stats.continueCount)
    this.continueButtonText.text = `コンティニュー ($${continueCost})`
    
    // Disable continue button if not enough money
    if (stats.money < continueCost) {
      this.continueButton.alpha = 0.5
      this.continueButton.eventMode = 'none'
    } else {
      this.continueButton.alpha = 1
      this.continueButton.eventMode = 'static'
    }
  }

  showStageClear(stats: GameStats, reward: number): void {
    this.titleText.text = 'ミッション完了！'
    this.titleText.style.fill = 0x4CAF50
    
    // Calculate rank
    let rank = 'C'
    if (reward >= 80) rank = 'S'
    else if (reward >= 60) rank = 'A'
    else if (reward >= 40) rank = 'B'
    
    const scoreText = `ステージ ${stats.currentStage} クリア！\n\n` +
                     `救助人数: ${stats.rescuedCount}人\n` +
                     `クリア時間: ${Math.floor(stats.time / 60)}:${Math.floor(stats.time % 60).toString().padStart(2, '0')}\n` +
                     `\n評価: ${rank}\n` +
                     `報酬: $${reward}`
    this.scoreText.text = scoreText
    
    // Hide continue button for stage clear
    this.continueButton.visible = false
    // Title button remains as "タイトルに戻る" but will trigger next stage
  }

  setContinueCallback(callback: () => void): void {
    this.onContinue = callback
  }

  setTitleCallback(callback: () => void): void {
    this.onTitle = callback
  }
}