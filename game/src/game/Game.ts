import { Application, Container } from 'pixi.js'
import { GameConfig } from '../utils/GameConfig'
import { GameState, GameStateType } from './GameState'
import { InputManager } from './InputManager'
import { Stage } from './Stage'
import { Camera } from './Camera'
import { Drone } from './entities/Drone'
import { Citizen, CitizenType } from './entities/Citizen'
import { CollisionSystem } from './systems/CollisionSystem'
import { HUD } from '../ui/HUD'

export class Game {
  private app: Application
  private gameContainer: Container
  private worldContainer: Container
  private uiContainer: Container
  private isInitialized: boolean = false
  
  // Game systems
  private gameState: GameState
  private inputManager: InputManager
  private camera: Camera
  
  // Game entities
  private stage: Stage | null = null
  private drone: Drone | null = null
  private citizens: Citizen[] = []
  
  // UI
  private hud: HUD
  
  // Game properties
  private worldWidth: number = GameConfig.WORLD_WIDTH_BASE
  private lastTime: number = 0

  constructor() {
    this.app = new Application()
    this.gameContainer = new Container()
    this.worldContainer = new Container()
    this.uiContainer = new Container()
    
    this.gameState = new GameState()
    this.inputManager = new InputManager()
    this.camera = new Camera(this.worldWidth, GameConfig.GAME_HEIGHT)
    this.hud = new HUD()
  }

  async init(): Promise<void> {
    // Initialize PixiJS application
    await this.app.init({
      width: GameConfig.GAME_WIDTH,
      height: GameConfig.GAME_HEIGHT,
      backgroundColor: 0x87CEEB, // Sky blue
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    })

    // Add canvas to DOM
    const gameElement = document.getElementById('game')
    if (gameElement) {
      gameElement.appendChild(this.app.canvas as HTMLCanvasElement)
    }

    // Setup container hierarchy
    this.gameContainer.addChild(this.worldContainer)
    this.gameContainer.addChild(this.uiContainer)
    this.app.stage.addChild(this.gameContainer)
    
    // Add HUD to UI container
    this.uiContainer.addChild(this.hud)

    // Handle resize
    window.addEventListener('resize', () => this.handleResize())
    this.handleResize()

    this.isInitialized = true
    console.log('Game initialized successfully')
    
    // Start with a test stage
    this.startNewStage()
  }

  private handleResize(): void {
    if (!this.app.renderer) return

    const parent = this.app.canvas.parentElement
    if (!parent) return

    const parentWidth = parent.clientWidth
    const parentHeight = parent.clientHeight
    
    // Calculate scale to fit game in parent while maintaining aspect ratio
    const scale = Math.min(
      parentWidth / GameConfig.GAME_WIDTH,
      parentHeight / GameConfig.GAME_HEIGHT
    )

    // Resize renderer
    this.app.renderer.resize(
      GameConfig.GAME_WIDTH * scale,
      GameConfig.GAME_HEIGHT * scale
    )

    // Scale the stage
    this.app.stage.scale.set(scale)
  }

  private startNewStage(): void {
    // Clear previous stage
    this.worldContainer.removeChildren()
    this.citizens = []
    
    // Update world size based on stage
    const stats = this.gameState.getStats()
    this.worldWidth = GameConfig.WORLD_WIDTH_BASE + 
      (stats.currentStage - 1) * GameConfig.WORLD_WIDTH_INCREMENT
    
    // Create new stage
    this.stage = new Stage(this.worldWidth, GameConfig.GAME_HEIGHT, stats.currentStage)
    this.worldContainer.addChild(this.stage)
    
    // Create drone at base
    const baseCenter = this.stage.getBaseCenter()
    this.drone = new Drone(baseCenter.x, baseCenter.y - 50)
    this.drone.worldWidth = this.worldWidth
    this.worldContainer.addChild(this.drone)
    
    // Generate citizens
    this.generateCitizens()
    
    // Update camera
    this.camera.setWorldBounds(this.worldWidth, GameConfig.GAME_HEIGHT)
    this.camera.setPosition(0, 0)
    
    // Set game state to playing
    this.gameState.setState(GameStateType.PLAYING)
    this.gameState.resetStage()
  }

  private generateCitizens(): void {
    if (!this.stage) return
    
    const stats = this.gameState.getStats()
    const citizenCount = Math.min(5 + Math.floor((stats.currentStage - 1) / 2), 10)
    
    // Ground citizens
    const groundCount = Math.floor(citizenCount * 0.6)
    for (let i = 0; i < groundCount; i++) {
      const x = 200 + Math.random() * (this.worldWidth - 400)
      const y = this.stage.getGroundLevel()
      const citizen = new Citizen(x, y, CitizenType.GROUND)
      this.citizens.push(citizen)
      this.worldContainer.addChild(citizen)
    }
    
    // Roof citizens
    const buildings = this.stage.getBuildings()
    const roofCount = citizenCount - groundCount
    const selectedBuildings = buildings
      .filter(b => b.hasRoof)
      .sort(() => Math.random() - 0.5)
      .slice(0, roofCount)
    
    selectedBuildings.forEach((building, index) => {
      const x = building.x + building.width / 2
      const y = building.y - building.height
      const citizen = new Citizen(x, y, CitizenType.ROOF)
      citizen.setBuildingIndex(buildings.indexOf(building))
      this.citizens.push(citizen)
      this.worldContainer.addChild(citizen)
    })
  }

  start(): void {
    if (!this.isInitialized) {
      console.error('Game not initialized. Call init() first.')
      return
    }

    // Start game loop
    this.lastTime = performance.now()
    this.app.ticker.add(() => {
      const currentTime = performance.now()
      const deltaTime = (currentTime - this.lastTime) / 1000
      this.lastTime = currentTime
      this.update(deltaTime)
    })
  }

  private update(deltaTime: number): void {
    // Update input
    this.inputManager.update()
    const inputState = this.inputManager.getState()
    
    // Update based on game state
    const currentState = this.gameState.getState()
    
    if (currentState === GameStateType.PLAYING) {
      // Update game time
      this.gameState.updateTime(deltaTime)
      
      // Update drone
      if (this.drone && this.stage) {
        // Convert input state to keys format for drone
        const keys: Record<string, boolean> = {
          'ArrowLeft': inputState.left,
          'ArrowRight': inputState.right,
          'ArrowUp': inputState.up,
          'ArrowDown': inputState.down,
          ' ': inputState.action
        }
        
        // Handle action button
        if (inputState.action && !this.drone.getIsRescuing()) {
          this.handleRescueAction()
        } else if (!inputState.action && this.drone.getIsRescuing()) {
          this.drone.stopRescue()
        }
        
        this.drone.update(deltaTime, keys)
        
        // Update camera to follow drone
        this.camera.follow(this.drone)
        
        // Check collisions and interactions
        this.checkInteractions()
      }
      
      // Update citizens
      this.citizens.forEach(citizen => citizen.update(deltaTime))
      
      // Update camera
      this.camera.update(deltaTime)
      this.camera.applyTo(this.worldContainer)
      
      // Update HUD
      this.updateHUD()
      
      // Check win/lose conditions
      this.checkGameConditions()
    }
  }
  
  private updateHUD(): void {
    if (!this.drone) return
    
    const stats = this.gameState.getStats()
    
    // Update battery
    this.hud.updateBattery(this.drone.getBattery(), this.drone.getCurrentDrainRate())
    
    // Update stats
    this.hud.updateStats(stats)
    
    // Update rescued count
    this.hud.updateRescued(stats.rescuedCount, this.citizens.length)
    
    // Update capacity
    this.hud.updateCapacity(this.drone.getPassengers().length, 5)
  }
  
  private handleRescueAction(): void {
    if (!this.drone || !this.stage) return
    
    // Start rescue
    this.drone.startRescue()
    
    // Consume battery for rope deployment
    const ropeConsumption = GameConfig.DRONE.BATTERY_DRAIN_ROPE
    this.drone.setBattery(this.drone.getBattery() - ropeConsumption)
    this.drone.showRopeConsumption()
  }
  
  private checkInteractions(): void {
    if (!this.drone || !this.stage) return
    
    // Rope rescue check
    if (this.drone.getIsRescuing()) {
      // Extend rope
      this.drone.extendRope(GameConfig.DRONE.ROPE_SPEED, 1/60)
      
      // Check for citizen rescue
      const rescuableCitizen = CollisionSystem.checkRopeRescue(this.drone, this.citizens)
      if (rescuableCitizen && this.drone.getPassengers().length < 5) {
        rescuableCitizen.rescue()
        this.drone.addPassenger(rescuableCitizen)
        rescuableCitizen.board()
        this.gameState.addRescued()
        this.drone.stopRescue()
      }
      
      // Check for passenger drop-off at base
      if (CollisionSystem.isAboveBase(this.drone, this.stage) && 
          this.drone.getPassengers().length > 0) {
        if (CollisionSystem.ropeReachesBaseGround(this.drone, this.stage)) {
          const passengers = this.drone.removeAllPassengers()
          passengers.forEach(passenger => {
            if (passenger instanceof Citizen) {
              passenger.deliver()
            }
          })
          this.drone.stopRescue()
        }
      }
    }
    
    // Charging port check
    const chargingPort = this.stage.getChargingPort()
    if (CollisionSystem.checkChargingPort(this.drone, chargingPort)) {
      this.drone.setBattery(Math.min(100, this.drone.getBattery() + chargingPort.chargeAmount))
      this.stage.useChargingPort()
    }
  }

  private checkGameConditions(): void {
    if (!this.drone) return
    
    const stats = this.gameState.getStats()
    
    // Check battery
    if (this.drone.getBattery() <= 0) {
      this.gameState.setState(GameStateType.FAILED)
      console.log('Game Over: Battery depleted')
    }
    
    // Check time limit
    if (stats.time >= GameConfig.STAGE.TIME_LIMIT) {
      this.gameState.setState(GameStateType.FAILED)
      console.log('Game Over: Time limit exceeded')
    }
    
    // Check if all citizens rescued
    const waitingCitizens = this.citizens.filter(c => c.isWaiting())
    if (waitingCitizens.length === 0 && this.drone.getPassengers().length === 0) {
      this.gameState.setState(GameStateType.GAME_OVER)
      console.log('Stage Complete!')
    }
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: true })
  }
}