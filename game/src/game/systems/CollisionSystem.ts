import { Drone } from '../entities/Drone'
import { Citizen } from '../entities/Citizen'
import { Stage, ChargingPort } from '../Stage'

export class CollisionSystem {
  
  // Check if drone can rescue a citizen with rope
  static checkRopeRescue(drone: Drone, citizens: Citizen[], rescueRadius: number = 30): Citizen | null {
    if (!drone.getIsRescuing()) return null
    
    const ropeEnd = drone.getRopeEndPosition()
    
    for (const citizen of citizens) {
      if (!citizen.isWaiting()) continue
      
      const distance = this.getDistance(ropeEnd, citizen.getPosition())
      if (distance < rescueRadius) {
        return citizen
      }
    }
    
    return null
  }
  
  // Check if drone is near charging port
  static checkChargingPort(drone: Drone, chargingPort: ChargingPort, chargeRadius: number = 40): boolean {
    if (chargingPort.used || drone.getIsCrashing()) return false
    
    const portCenter = {
      x: chargingPort.x + chargingPort.width / 2,
      y: chargingPort.y - chargingPort.height / 2
    }
    
    const distance = this.getDistance(
      { x: drone.x, y: drone.y },
      portCenter
    )
    
    return distance < chargeRadius && drone.isNearGround()
  }
  
  // Check if drone is near base
  static isNearBase(drone: Drone, stage: Stage, radius: number = 50): boolean {
    const baseCenter = stage.getBaseCenter()
    const distance = Math.abs(drone.x - baseCenter.x)
    return distance < radius
  }
  
  // Check if drone is above base (for dropping off passengers)
  static isAboveBase(drone: Drone, stage: Stage): boolean {
    return this.isNearBase(drone, stage) && drone.y < stage.getGroundLevel() - 10
  }
  
  // Check if rope reaches base ground
  static ropeReachesBaseGround(drone: Drone, stage: Stage): boolean {
    const ropeEnd = drone.getRopeEndPosition()
    return ropeEnd.y >= stage.getGroundLevel() - 10
  }
  
  // Check if drone hits ground
  static checkGroundCollision(drone: Drone, stage: Stage): boolean {
    return drone.y >= stage.getGroundLevel()
  }
  
  // Check if point is on a building
  static checkBuildingCollision(x: number, y: number, stage: Stage): boolean {
    return stage.isPointOnBuilding(x, y) !== null
  }
  
  // Utility function to calculate distance
  private static getDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }): number {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  // Check if two rectangles overlap
  static checkRectCollision(
    rect1: { x: number, y: number, width: number, height: number },
    rect2: { x: number, y: number, width: number, height: number }
  ): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  }
  
  // Check if a circle and rectangle overlap
  static checkCircleRectCollision(
    circle: { x: number, y: number, radius: number },
    rect: { x: number, y: number, width: number, height: number }
  ): boolean {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width))
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height))
    
    // Calculate distance from circle center to closest point
    const distance = this.getDistance(circle, { x: closestX, y: closestY })
    
    return distance < circle.radius
  }
}