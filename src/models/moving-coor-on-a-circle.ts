import { Coor } from './coor'
import { Circle } from './circle'

class MovingCoorOnACircle {
  /** Center of the circle the coor is on */
  routeCircle: Circle
  /** Radian position of Coor on the circle */
  initialTheta: number
  /** +1 for clockwise (default), -1 for counter-clockwise, zero for no movement */
  direction: number
  /** Speed of animation movement for this point, must be non-negative.
   * Default is `1.0` for normal speed */
  speed: number

  public constructor(routeCircle: Circle, initialTheta: number, direction: number = 1, speed: number = 1.0) {
    this.routeCircle = routeCircle
    this.initialTheta = initialTheta

    if (![-1, 0, 1].includes(direction)) {
      throw Error(`Direction must be -1, 0, or 1, but was ${direction}`)
    }
    this.direction = direction

    if (speed < 0) {
      throw Error(`Speed must be non-negative, but was ${speed}`)
    }
    this.speed = speed
  }

  public copy() {
    return new MovingCoorOnACircle(
      this.routeCircle,
      this.initialTheta,
      this.direction,
      this.speed,
    )
  }
}

export { MovingCoorOnACircle }
