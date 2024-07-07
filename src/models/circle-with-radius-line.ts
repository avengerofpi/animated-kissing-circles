import { Circle } from './circle'
import { Coor, dist } from './coor'
import { LineSegment } from './line-segment'

class CircleWithRadiusLine extends Circle {
  // center: Coor
  // radius: number | undefined
  radiusLine: LineSegment | undefined

  public constructor(center: Coor, radiusLineDst: Coor | undefined = undefined) {
    const length = radiusLineDst ? dist(center, radiusLineDst) : undefined
    super(center.x, center.y, length)
    // this.center = center
    if (radiusLineDst) {
      this.radiusLine = new LineSegment(this.center, radiusLineDst)
    } else {
      this.radiusLine = new LineSegment(this.center, this.center)
    }
    // this.radius = this.radiusLine.length()
  }

  public setRadiusLineDst(radiusLineDst: Coor) {
    this.radiusLine = new LineSegment(this.center, radiusLineDst)
    this.radius = this.radiusLine.length
  }
}


export { CircleWithRadiusLine }
