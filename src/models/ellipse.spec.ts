import { describe, it, expect } from 'vitest'

import { Ellipse } from './ellipse'
import { Coor, dist } from './coor'

describe('Ellipse', () => {
  describe('computes correct distToPoint', () => {
    it('for an ellipse at origin with zero rotation', () => {
      const point = new Coor(0, 10)
      const ellipse = new Ellipse(0, 0, 3, 5, 0)

      // console.log(ellipse)

      expect.soft(ellipse.center).toEqual(new Coor(0, 0))
      expect.soft(ellipse.radiusX).toEqual(3)
      expect.soft(ellipse.radiusY).toEqual(5)
      expect.soft(ellipse.rotation).toEqual(0)
      expect.soft(ellipse.radiusMajorAxis).toEqual(5)
      expect.soft(ellipse.radiusMinorAxis).toEqual(3)
      expect.soft(ellipse.radiusFoci).toEqual(4)
      expect.soft(ellipse.vertices).toEqual([new Coor(0, -5), new Coor(0, 5)])
      expect.soft(ellipse.coVertices).toEqual([new Coor(-3, 0), new Coor(3, 0)])
      expect.soft(ellipse.foci).toEqual([new Coor(0, -4), new Coor(0, 4)])
      expect.soft(ellipse.isCircle).toEqual(false)

      expect.soft(ellipse.distToPoint(point)[0]).toEqual(5)
    })

    it('for a rotated ellipse at origin', () => {
      const point = new Coor(0, 10)
      const ellipse = new Ellipse(0, 0, 5, 3, Math.PI / 2)

      console.log(ellipse)

      expect.soft(ellipse.center).toEqual(new Coor(0, 0))
      expect.soft(ellipse.radiusX).toEqual(5)
      expect.soft(ellipse.radiusY).toEqual(3)
      expect.soft(ellipse.rotation).toEqual(Math.PI / 2)
      expect.soft(ellipse.radiusMajorAxis).toEqual(5)
      expect.soft(ellipse.radiusMinorAxis).toEqual(3)
      expect.soft(ellipse.radiusFoci).toEqual(4)

      const distTolerance = 1e-10
      expect.soft(dist(ellipse.vertices[0], new Coor(0, -5))).toBeLessThanOrEqual(distTolerance)
      expect.soft(dist(ellipse.vertices[1], new Coor(0,  5))).toBeLessThanOrEqual(distTolerance)
      expect.soft(dist(ellipse.coVertices[0], new Coor( 3, 0))).toBeLessThanOrEqual(distTolerance)
      expect.soft(dist(ellipse.coVertices[1], new Coor(-3, 0))).toBeLessThanOrEqual(distTolerance)
      expect.soft(dist(ellipse.foci[0], new Coor(0, -4))).toBeLessThanOrEqual(distTolerance)
      expect.soft(dist(ellipse.foci[1], new Coor(0,  4))).toBeLessThanOrEqual(distTolerance)
      expect.soft(ellipse.isCircle).toEqual(false)

      expect.soft(ellipse.distToPoint(point)[0]).toEqual(5)
    })
  })

  it('computes correct base ellipse', () => {
    const ellipse = new Ellipse(1, 2, 3, 5, Math.PI / 2)
    const baseEllipse = ellipse.toBaseEllipse()
    const expectedBaseEllipse = new Ellipse(0, 0, 3, 5, 0)

    // console.log(baseEllipse)

    expect.soft(baseEllipse).toEqual(expectedBaseEllipse)

    // expect.soft(baseEllipse.center).toEqual(new Coor(0, 0))
    // expect.soft(baseEllipse.radiusX).toEqual(3)
    // expect.soft(baseEllipse.radiusY).toEqual(5)
    // expect.soft(baseEllipse.rotation).toEqual(0)
    // expect.soft(baseEllipse.radiusMajorAxis).toEqual(5)
    // expect.soft(baseEllipse.radiusMinorAxis).toEqual(3)
    // expect.soft(baseEllipse.radiusFoci).toEqual(4)

    // const distTolerance = 1e-10
    // expect.soft(dist(baseEllipse.vertices[0], new Coor(0, -5))).toBeLessThanOrEqual(distTolerance)
    // expect.soft(dist(baseEllipse.vertices[1], new Coor(0,  5))).toBeLessThanOrEqual(distTolerance)
    // expect.soft(dist(baseEllipse.coVertices[0], new Coor(-3, 0))).toBeLessThanOrEqual(distTolerance)
    // expect.soft(dist(baseEllipse.coVertices[1], new Coor( 3, 0))).toBeLessThanOrEqual(distTolerance)
    // expect.soft(dist(baseEllipse.foci[0], new Coor(0, -4))).toBeLessThanOrEqual(distTolerance)
    // expect.soft(dist(baseEllipse.foci[1], new Coor(0,  4))).toBeLessThanOrEqual(distTolerance)
    // expect.soft(baseEllipse.isCircle).toEqual(false)
  })
})
