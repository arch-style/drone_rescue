export enum GameStateType {
  MENU = 'menu',
  PLAYING = 'playing',
  GAME_OVER = 'gameover',
  FAILED = 'failed',
  PAUSED = 'paused'
}

export interface GameStats {
  score: number
  rescuedCount: number
  totalRescued: number
  time: number
  currentStage: number
  continueCount: number
  money: number
}

export class GameState {
  private state: GameStateType = GameStateType.MENU
  private stats: GameStats = {
    score: 0,
    rescuedCount: 0,
    totalRescued: 0,
    time: 0,
    currentStage: 1,
    continueCount: 0,
    money: 0
  }

  constructor() {
    this.reset()
  }

  getState(): GameStateType {
    return this.state
  }

  setState(newState: GameStateType): void {
    console.log(`Game state changed: ${this.state} -> ${newState}`)
    this.state = newState
  }

  getStats(): Readonly<GameStats> {
    return { ...this.stats }
  }

  updateStats(updates: Partial<GameStats>): void {
    this.stats = { ...this.stats, ...updates }
  }

  reset(): void {
    this.state = GameStateType.MENU
    this.stats = {
      score: 0,
      rescuedCount: 0,
      totalRescued: 0,
      time: 0,
      currentStage: 1,
      continueCount: 0,
      money: 0
    }
  }

  resetStage(): void {
    this.stats.rescuedCount = 0
    this.stats.time = 0
    this.stats.score = 0
  }

  addScore(points: number): void {
    this.stats.score += points
  }

  addRescued(count: number = 1): void {
    this.stats.rescuedCount += count
    this.stats.totalRescued += count
    this.addScore(count * 100)
  }

  updateTime(deltaTime: number): void {
    this.stats.time += deltaTime
  }

  nextStage(): void {
    this.stats.currentStage++
    this.resetStage()
  }

  canContinue(cost: number): boolean {
    return this.stats.money >= cost
  }

  doContinue(cost: number): boolean {
    if (this.canContinue(cost)) {
      this.stats.money -= cost
      this.stats.continueCount++
      return true
    }
    return false
  }
}