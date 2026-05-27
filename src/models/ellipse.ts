import { Coor, dist, distSquared } from './coor'

/**
 * Class to capture ellipse shapes.
 */
class Ellipse {
  /** How close a point has to be to be considered a point on the ellipse.
   *
   * Used for `Ellipse.arithmeticDistance`.
   */
  static distanceThreshold = 1e-8

  /** Center of the ellipse */
  center: Coor

  // Parametric
  /** Radius along x-axis before rotation. May be major or minor axis. */
  radiusX: number
  /** Radius along y-axis before rotation. May be major or minor axis. */
  radiusY: number
  /** Rotation of the ellipse, counterclockwise from the x-axis. */
  rotation: number

  /** Radius along the major axis. */
  radiusMajor: number
  /** Radius along the minor axis. */
  radiusMinor: number

  /**
   * Vertex points (endpoints on the major axis). Order is determined by the cananonical version of this ellipse
   * (before rotation, center at origin) - the vertex on the negative
   * x-axis or y-axis (whichever is the major axis) followed by the vertex
   * on the positive x-axis or y-axis (which ever is the minor axis).
   */
  vertices: Coor[]
  /**
   * Co-vertex points (endpoints on the minor axis). Order is determined by the cananonical version of this ellipse
   * (before rotation, center at origin) - the vertex on the negative
   * x-axis or y-axis (whichever is the major axis) followed by the vertex
   * on the positive x-axis or y-axis (which ever is the minor axis).
   */
  coVertices: Coor[]

  /** Distance from center to each focal point. */
  radiusFoci
  /**
   * Focal points. Order is determined by the cananonical version of this ellipse
   * (before rotation, center at origin) - the focal point on the negative
   * x-axis or y-axis (whichever is the major axis) followed by the focal point
   * on the positive x-axis or y-axis (which ever is the minor axis).
   */
  foci: Coor[]

  isCircle: boolean

  public constructor(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
  ) {
    // Validate
    const errorMsgs: string[] = []
    if (radiusX <= 0) { errorMsgs.push(`radiusX must be positive, but was ${radiusX}`) }
    if (radiusY <= 0) { errorMsgs.push(`radiusY must be positive, but was ${radiusY}`) }
    if (errorMsgs.length > 0) {
      errorMsgs.forEach(msg => console.error(msg))
      throw Error(`Could not instantiate Ellipse: ${JSON.stringify(errorMsgs)}`)
    }

    // Basic params
    this.center = new Coor(x, y)
    this.radiusX = radiusX
    this.radiusY = radiusY
    this.rotation = rotation

    // Interpreted params
    this.radiusMajor = Math.max(radiusX, radiusY)
    this.radiusMinor = Math.min(radiusX, radiusY)
    this.radiusFoci = Math.sqrt(this.radiusMajor**2 - this.radiusMinor**2)

    let baseVertex, baseCoVertex, baseFocalPoint
    if (radiusX >= radiusY) {
      baseVertex = new Coor(-radiusX, 0)
      baseCoVertex = new Coor(0, -radiusY)
      baseFocalPoint = new Coor(-this.radiusFoci, 0)
    } else {
      baseVertex = new Coor(0, -radiusY)
      baseCoVertex = new Coor(-radiusX, 0)
      baseFocalPoint = new Coor(0, -this.radiusFoci)
    }
    this.vertices = [baseVertex, baseVertex.scale(-1)].map(v => v.applyRotationAndOffset(rotation, this.center))
    this.coVertices = [baseCoVertex, baseCoVertex.scale(-1)].map(v => v.applyRotationAndOffset(rotation, this.center))
    this.foci = [baseFocalPoint, baseFocalPoint.scale(-1)].map(v => v.applyRotationAndOffset(rotation, this.center))

    this.isCircle = (radiusX === radiusY)
  }

  /**
   * Compute and return the point on this ellipse at angle `alpha` from the major axis.
   * Remember that in HTML canvas, the positive y-axis is downward, not upward, so angles
   * are measured clockwise rather than counterclockwise.
   */
  public getPointAtAngle(alpha: number): Coor {
    const theta = this.rotation
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)
    const sinAlpha = Math.sin(alpha)
    const cosAlpha = Math.cos(alpha)
    const rx = this.radiusX
    const ry = this.radiusY
    const x = this.center.x + rx*cosAlpha*cosTheta - ry*sinAlpha*sinTheta
    const y = this.center.y + rx*cosAlpha*sinTheta + ry*sinAlpha*cosTheta

    return new Coor(x, y)
  }

  /** Determine whether a point is close enough to the ellipse to be considered on it.
   *
   * Uses `arithmeticDistance`, which might not actually be a good metric. I
   * haven't learned enough about it to know for sure, though.
  */
  public isPointOnShape(point: Coor): boolean {
    return this.arithmeticDistance(point) < Ellipse.distanceThreshold
  }

  /** Compute the "arithmetic distance" between a point and the ellipse.
   *
   * The arithmetic distance is derived from the ellipse equation
   * ```
   *  (x/radiusX)**2 + (y/radiusY)**2 -1 = 0
   * ```
   * For a point truly on the ellipse, this equation holds true (by definition).
   * To accomodate floating point imprecission, we use an inquality with a small positive bound,
   * `Ellipse.distanceThreshold`.
   */
  public arithmeticDistance(point: Coor): number {
    return (point.x/this.radiusX)**2 + (point.y/this.radiusY)**2 - 1
  }

  // /**
  //  * Shortest distance to the given point. Use the ellipse formula
  //  * to compute this algebraic distance:
  //  *  ```
  //  *  (x / xRadius)**2 + (y / yRadius)**2 - 1
  //  *  ```
  //  * which equals zero for any point on the ellipse.
  //  * @param point point to compute distance-from-ellipse for
  //  */
  // public distToPoint(point: Coor): number {
  //   // console.log(`Distance from ellipse`)
  //   const adjustedPoint = point.subtract(this.center).rotate(-this.rotation)
  //   const d = ((this.center.x - adjustedPoint.x)/this.radiusX)**2 + ((this.center.y - adjustedPoint.y)/this.radiusY)**2 - 1
  //   return Math.abs(d)
  // }

  /** Return the version of this ellipse at the origin with zero rotation. */
  public toBaseEllipse(): Ellipse {
    return new Ellipse(0, 0, this.radiusX, this.radiusY, 0)
  }

  /**
   * Shortest distance to the given point. Use the ellipse formula
   * to compute this algebraic distance:
   *
   * @param point point to compute distance-from-ellipse for
   */
  public pointOnEllipseInDirectionOfAnotherPoint(point: Coor): [Coor, number, number] {
    const adjustedPoint = point.subtract(this.center).rotate(-this.rotation)

    const thetaFromCenterToPoint = Math.atan2(this.radiusX * adjustedPoint.y, this.radiusY * adjustedPoint.x)

    // const thetaStepSize = 1e-2
    // let nearestTheta = initialTheta
    const pointOnOrigEllipse = this.getPointAtAngle(thetaFromCenterToPoint)
    const squaredDistToPointOnOrigEllipse = distSquared(point, pointOnOrigEllipse)
    const closestPoint = pointOnOrigEllipse
    const closestDistSquared = squaredDistToPointOnOrigEllipse

    return [closestPoint, closestDistSquared, thetaFromCenterToPoint]
  }

  /**
   * Compute approimate point on an ellipse closest to another point.
   *
   * @param point point to try to get closest to
   */
  public nearestPointToAnotherPointApproximatation(point: Coor): [Coor, number, number] {
    const [initialPoint, initDistSquared, initTheta] = this.pointOnEllipseInDirectionOfAnotherPoint(point)

    let thetaStepSize = Math.PI / 2880
    const stepForwardDist = dist(point, this.getPointAtAngle(initTheta + thetaStepSize))
    const stepBackwardDist = dist(point, this.getPointAtAngle(initTheta - thetaStepSize))

    // Return early if initial point is best
    if (initDistSquared <= Math.min(stepForwardDist, stepBackwardDist)) {
      return [initialPoint, initDistSquared, initTheta]
    }

    // Ensure thetaStepSize is in correct direction
    if (stepBackwardDist < stepForwardDist) {
      thetaStepSize = -thetaStepSize
    }

    // Iterate till we find closest point
    let [currPoint, currDistSquared, currTheta] = [initialPoint, initDistSquared, initTheta]
    let [nextPoint, nextDistSquared, nextTheta] = [initialPoint, initDistSquared, initTheta]
    let numSteps = 0
    do {
      [currPoint, currDistSquared, currTheta] = [nextPoint, nextDistSquared, nextTheta]

      nextTheta = currTheta + thetaStepSize
      nextPoint = this.getPointAtAngle(nextTheta)
      nextDistSquared = distSquared(point, nextPoint)
      numSteps++
    } while (nextDistSquared < currDistSquared)

    const thetaStepSizeDegree = thetaStepSize * 180 / Math.PI
    const initThetaDegree = initTheta * 180 / Math.PI
    console.debug(`initTheta (${initThetaDegree.toFixed(2)}) -> ${numSteps} steps of size ${thetaStepSizeDegree.toFixed(3)}`)

    return [currPoint, currDistSquared, currTheta]
  }

  /**
   * Compute approximate point on an ellipse closest to another point.
   *
   * @param point point to try to get closest to
   */
  public ___bad_math__nearestPointToAnotherPoint(point: Coor): [Coor, number, number] {
    const [u, v] = [point.x, point.y]
    const a = this.radiusX
    const b = this.radiusY

    const A = 1
    const B = a**2*(u-1) + b**2*(v-1)
    const C = a**2*b**2*(1-u-v)

    // Solve the quadratic
    const t1 = (-B + Math.sqrt(B**2 - 4*A*C)) / (2*a)
    const t2 = (-B - Math.sqrt(B**2 - 4*A*C)) / (2*a)

    const p1 = new Coor(a**2*u/(a**2 - t1), b**2*v/(b**2 - t1))
    const p2 = new Coor(a**2*u/(a**2 - t2), b**2*v/(b**2 - t2))

    const d1 = distSquared(point, p1)
    const d2 = distSquared(point, p2)

    let nearestPoint, nearestDistSquared, nearestTheta
    if (d1 < d2) {
      nearestPoint = p1
      nearestDistSquared = d1
    } else {
      nearestPoint = p2
      nearestDistSquared = d2
    }

    nearestTheta = Math.atan2(this.center.x-nearestPoint.x, this.center.y-nearestPoint.y)

    return [nearestPoint, nearestDistSquared, nearestTheta]
  }

  public draw(ctx: CanvasRenderingContext2D, fillStyle: string | CanvasGradient | CanvasPattern = `hsl(50 100% 50% / 40%)`) {
    const center = this.center
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, this.radiusX, this.radiusY, this.rotation, 0, 2*Math.PI);
    const origFillStyle = ctx.fillStyle
    ctx.fillStyle = fillStyle
    ctx.fill()
    ctx.fillStyle = origFillStyle
  }
}

export { Ellipse }
