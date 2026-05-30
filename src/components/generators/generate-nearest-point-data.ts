import { ref, watch } from 'vue'
import type { Ref } from 'vue'

import { Coor, dist, distSquared } from '@/models/coor'
import { Circle } from '@/models/circle'
import { Ellipse } from '@/models/ellipse'
import { MovingCoorOnACircle } from '@/models/moving-coor-on-a-circle'

/**
 * Generate ellipses of various ecentricies. For each, generate two circles,
 * one entirely interior and the other entirely exterior. For each ellipse/
 * circle pair, generate points around the circle, For each such point, find
 * (approximate) the point on the ellipse nearest to the point on the circle.
 * Report the data thus generated in a form that can then be used to see if
 * we can find a good regression correlation.
 */
function generateNearestPointData(ctx: CanvasRenderingContext2D = null) {
  const radiusX = 300
  const numEllipes = 100
  const numTestPoints = 1231

  ctx && ctx.arc(0, 0, radiusX, 0, Math.PI*2)

  const shapeFrames: Array<[Ellipse, Circle, Coor, Coor]> = []
  for (let i=1; i<=numEllipes; i++) {
    const radiusY = (i / numEllipes) * radiusX
    const e = new Ellipse(0, 0, radiusX, radiusY, 0)
    const interiorCircleRadius = radiusY / 2
    const exteriorCircleRadius = radiusX * 2
    // for (const r of [interiorCircleRadius, exteriorCircleRadius]) {
    // for (const r of [exteriorCircleRadius]) {
    for (const r of [interiorCircleRadius]) {
      // const circle = new Circle(0, 0, r)
      const innerRadiusY = interiorCircleRadius
      const innerRadiusX = radiusX - (radiusY-innerRadiusY)
      const circle = new Ellipse(0, 0, innerRadiusX, innerRadiusY, 0)
      console.log(r)
      for (let j=0; j<numTestPoints; j++) {
        const theta = Math.PI * 2 * j / numTestPoints
        const pointOnCircle = circle.getPointAtAngle(theta)
        const pointOnEllipse = e.nearestPointToAnotherPointApproximatation(pointOnCircle)[0]

        shapeFrames.push([e, circle, pointOnCircle, pointOnEllipse])
      }
    }
  }

  console.log(`shapeFrames: ${shapeFrames}`)
  return shapeFrames
}

const shapeFrames = generateNearestPointData()

function renderShapeFrame(i: number, ctx: CanvasRenderingContext2D) {
  const n = shapeFrames.length
  const [e, circle, pointOnCircle, pointOnEllipse] = shapeFrames[i % n]

  e.draw(ctx)
  circle.draw(ctx)
  pointOnCircle.draw(ctx)
  pointOnEllipse.draw(ctx)
  // renderShapeFrame(i+1, ctx)
}

export { generateNearestPointData, renderShapeFrame }