export const GameConfig = {
  // Game dimensions (based on prototype)
  GAME_WIDTH: 360,
  GAME_HEIGHT: 640,
  
  // World settings
  WORLD_WIDTH_BASE: 1600,
  WORLD_WIDTH_INCREMENT: 400, // Per stage
  
  // Physics
  GRAVITY: 0,
  
  // Drone settings
  DRONE: {
    MAX_SPEED_X: 3,
    MAX_SPEED_Y: 2.5,
    ACCELERATION: 0.5,
    DECELERATION: 0.85,
    BATTERY_DRAIN_BASE: 0.2,
    BATTERY_DRAIN_MOVING: 0.5,
    BATTERY_DRAIN_ASCENDING: 0.8,
    BATTERY_DRAIN_ROPE: 3,
    MAX_CAPACITY: 5,
    MAX_ROPE_LENGTH: 150,
    ROPE_SPEED: 100
  },
  
  // Stage settings
  STAGE: {
    GROUND_LEVEL: 580,
    TIME_LIMIT: 90, // seconds
    CHARGE_AMOUNT_BASE: 30,
    CHARGE_AMOUNT_DECREASE: 2 // Per stage
  },
  
  // Assets paths
  ASSETS: {
    IMAGES: {
      DRONE: 'assets/images/drone.png',
      CITIZEN: 'assets/images/citizen.png',
      BUILDING: 'assets/images/building.png',
      BASE: 'assets/images/base.png'
    },
    SOUNDS: {
      BGM: 'assets/sounds/bgm.mp3',
      RESCUE: 'assets/sounds/rescue.mp3',
      DROP_OFF: 'assets/sounds/dropoff.mp3',
      CHARGE: 'assets/sounds/charge.mp3',
      CRASH: 'assets/sounds/crash.mp3',
      ROPE: 'assets/sounds/rope.mp3',
      CLICK: 'assets/sounds/click.mp3',
      POWERUP: 'assets/sounds/powerup.mp3'
    }
  }
} as const