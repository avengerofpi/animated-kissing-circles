import { Coor, dist } from './coor'

/**
 * Class to capture ellipse shapes.
 */
class Ellipse {
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
  radiusMajorAxis: number
  /** Radius along the minor axis. */
  radiusMinorAxis: number

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
    } else {
      // console.log(`all is well: radiusX = ${radiusX} (${errorMsgs.length} error messages)`)
    }

    this.center = new Coor(x, y)
    this.radiusX = radiusX
    this.radiusY = radiusY
    this.rotation = rotation

    this.radiusMajorAxis = Math.max(radiusX, radiusY)
    this.radiusMinorAxis = Math.min(radiusX, radiusY)
    this.radiusFoci = Math.sqrt(this.radiusMajorAxis**2 - this.radiusMinorAxis**2)

    let baseVertex, baseCoVertex, baseFocalPoint

    if (radiusX >= radiusY) {
      baseVertex = new Coor(-radiusX, 0)
      baseCoVertex = new Coor(0, -radiusY)
      baseFocalPoint = new Coor(-this.radiusFoci, 0)
      // this.vertices = [new Coor(-radiusX, 0), new Coor(radiusX, 0)].map(v => v.applyRotationAndOffset(rotation, this.center))
      // this.coVertices = [new Coor(0, -radiusY), new Coor(0, radiusY)].map(v => v.applyRotationAndOffset(rotation, this.center))
      // this.foci = [new Coor(0, -this.radiusFoci), new Coor(0, this.radiusFoci)].map(v => v.applyRotationAndOffset(rotation, this.center))
    } else {
      baseVertex = new Coor(0, -radiusY)
      baseCoVertex = new Coor(-radiusX, 0)
      baseFocalPoint = new Coor(0, -this.radiusFoci)
      // this.radiusFoci = radiusY**2 - radiusX**2
      // this.vertices = [new Coor(0, -radiusY), new Coor(0, radiusY)].map(v => v.applyRotationAndOffset(rotation, this.center))
      // this.coVertices = [new Coor(-radiusX, 0), new Coor(radiusX, 0)].map(v => v.applyRotationAndOffset(rotation, this.center))
    }
    this.vertices = [baseVertex, baseVertex.scale(-1)].map(v => v.applyRotationAndOffset(rotation, this.center))
    this.coVertices = [baseCoVertex, baseCoVertex.scale(-1)].map(v => v.applyRotationAndOffset(rotation, this.center))
    this.foci = [baseFocalPoint, baseFocalPoint.scale(-1)].map(v => v.applyRotationAndOffset(rotation, this.center))
    // this.vertices = [new Coor(-radiusX, 0), new Coor(radiusX, 0)].map(v => v.applyRotationAndOffset(rotation, this.center))
    // this.coVertices = [new Coor(0, -radiusY), new Coor(0, radiusY)].map(v => v.applyRotationAndOffset(rotation, this.center))
    // this.foci = [new Coor(0, -this.radiusFoci), new Coor(0, this.radiusFoci)].map(v => v.applyRotationAndOffset(rotation, this.center))

    this.isCircle = (radiusX === radiusY)
  }

  /** Compute and return the point on this ellipse at angle `alpha` from the major axis. */
  public getPointAtAngle(alpha: number): Coor {
    const theta = this.rotation
    const sinTheta = Math.sin(theta) // 0
    const cosTheta = Math.cos(theta) // 1
    const sinAlpha = Math.sin(alpha) // 1
    const cosAlpha = Math.cos(alpha) // 1
    const rx = this.radiusX
    const ry = this.radiusY
    const x = this.center.x + rx*cosAlpha*cosTheta - ry*sinAlpha*sinTheta
    const y = this.center.y + rx*cosAlpha*sinTheta + ry*sinAlpha*cosTheta

    return new Coor(x, y)
  }
  public isPointOnShape(point: Coor): boolean {
    return this.distToPoint(point)[0] === 0
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
  public distToPoint(point: Coor): [number, Coor] {
    const baseEllipse = this.toBaseEllipse()
    const adjustedPoint = point.subtract(this.center).rotate(-this.rotation)
    // const projAdjustedPointOntoBaseMajorAxis = baseEllipse.vertices[0].projection(adjustedPoint)
    // const projAdjustedPointOntoBaseMinorAxis = baseEllipse.coVertices[0].projection(adjustedPoint)
    // const majorAxisScale = projAdjustedPointOntoBaseMajorAxis.magnitude() / this.radiusMajorAxis
    // const minorAxisScale = projAdjustedPointOntoBaseMinorAxis.magnitude() / this.radiusMinorAxis

    let initialTheta = 0
    if (adjustedPoint.x === 0) {
      if (adjustedPoint.y === 0) {
        console.warn(`The current point ${JSON.stringify(point)} is at the center of the ellipse`)
      } else if (adjustedPoint.y > 0) {
        initialTheta = 0.5 * Math.PI
      } else {
        initialTheta = 1.5 * Math.PI
      }
    } else {
      initialTheta = Math.atan2(adjustedPoint.y, adjustedPoint.x)
    }

    const thetaStepSize = 1e-2
    let nearestTheta = initialTheta
    const pointOnOrigEllipse = this.getPointAtAngle(nearestTheta)

    return [dist(pointOnOrigEllipse, point), pointOnOrigEllipse]
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
