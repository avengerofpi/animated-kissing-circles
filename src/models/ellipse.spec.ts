import { describe, test, it, expect } from 'vitest'

import { Ellipse } from './ellipse'
import { Coor, dist } from './coor'

const distTolerance = 1e-10

describe('Ellipse', () => {
  describe('initializes correctly', () => {
    it('for non-rotated ellipse at origin', () => {
      const ellipse = new Ellipse(0, 0, 3, 5, 0)

      // console.log(ellipse)

      expect.soft(ellipse.center).toEqual(new Coor(0, 0))
      expect.soft(ellipse.radiusX).toEqual(3)
      expect.soft(ellipse.radiusY).toEqual(5)
      expect.soft(ellipse.rotation).toEqual(0)
      expect.soft(ellipse.radiusMajor).toEqual(5)
      expect.soft(ellipse.radiusMinor).toEqual(3)
      expect.soft(ellipse.radiusFoci).toEqual(4)
      expect.soft(ellipse.vertices).toEqual([new Coor(0, -5), new Coor(0, 5)])
      expect.soft(ellipse.coVertices).toEqual([new Coor(-3, 0), new Coor(3, 0)])
      expect.soft(ellipse.foci).toEqual([new Coor(0, -4), new Coor(0, 4)])
      expect.soft(ellipse.isCircle).toEqual(false)

      // Major axis is positive y-axis, but angles for `getPointAtAngle` are computed from x-axis
      expect.soft(dist(ellipse.getPointAtAngle(Math.PI*0.0), ellipse.coVertices[1])).lessThan(distTolerance)
      expect.soft(dist(ellipse.getPointAtAngle(Math.PI*0.5), ellipse.vertices[1])).lessThan(distTolerance)
      expect.soft(dist(ellipse.getPointAtAngle(Math.PI*1.0), ellipse.coVertices[0])).lessThan(distTolerance)
      expect.soft(dist(ellipse.getPointAtAngle(Math.PI*1.5), ellipse.vertices[0])).lessThan(distTolerance)
    })

    it('for rotated ellipse at origin', () => {
      const ellipse = new Ellipse(0, 0, 5, 3, Math.PI / 2)

      // console.log(ellipse)

      expect.soft(ellipse.center).toEqual(new Coor(0, 0))
      expect.soft(ellipse.radiusX).toEqual(5)
      expect.soft(ellipse.radiusY).toEqual(3)
      expect.soft(ellipse.rotation).toEqual(Math.PI / 2)
      expect.soft(ellipse.radiusMajor).toEqual(5)
      expect.soft(ellipse.radiusMinor).toEqual(3)
      expect.soft(ellipse.radiusFoci).toEqual(4)

      expect.soft(dist(ellipse.vertices[0], new Coor(0, -5))).lessThan(distTolerance)
      expect.soft(dist(ellipse.vertices[1], new Coor(0,  5))).lessThan(distTolerance)
      expect.soft(dist(ellipse.coVertices[0], new Coor( 3, 0))).lessThan(distTolerance)
      expect.soft(dist(ellipse.coVertices[1], new Coor(-3, 0))).lessThan(distTolerance)
      expect.soft(dist(ellipse.foci[0], new Coor(0, -4))).lessThan(distTolerance)
      expect.soft(dist(ellipse.foci[1], new Coor(0,  4))).lessThan(distTolerance)
      expect.soft(ellipse.isCircle).toEqual(false)
    })

    it('for rotated ellipse NOT at origin', () => {
      const ellipse = new Ellipse(1, 2, 5, 3, -Math.PI / 4)

      // console.log(ellipse)

      expect.soft(ellipse.center).toEqual(new Coor(1, 2))
      expect.soft(ellipse.radiusX).toEqual(5)
      expect.soft(ellipse.radiusY).toEqual(3)
      expect.soft(ellipse.rotation).toEqual(-Math.PI / 4)
      expect.soft(ellipse.radiusMajor).toEqual(5)
      expect.soft(ellipse.radiusMinor).toEqual(3)
      expect.soft(ellipse.radiusFoci).toEqual(4)

      expect.soft(dist(ellipse.vertices[0], new Coor(1-2.5*Math.sqrt(2), 2+2.5*Math.sqrt(2)))).lessThan(distTolerance)
      expect.soft(dist(ellipse.vertices[1], new Coor(1+2.5*Math.sqrt(2), 2-2.5*Math.sqrt(2)))).lessThan(distTolerance)
      expect.soft(dist(ellipse.coVertices[0], new Coor(1-1.5*Math.sqrt(2), 2-1.5*Math.sqrt(2)))).lessThan(distTolerance)
      expect.soft(dist(ellipse.coVertices[1], new Coor(1+1.5*Math.sqrt(2), 2+1.5*Math.sqrt(2)))).lessThan(distTolerance)
      expect.soft(dist(ellipse.foci[0], new Coor(1-2.0*Math.sqrt(2), 2+2.0*Math.sqrt(2)))).lessThan(distTolerance)
      expect.soft(dist(ellipse.foci[1], new Coor(1+2.0*Math.sqrt(2), 2-2.0*Math.sqrt(2)))).lessThan(distTolerance)
      expect.soft(ellipse.isCircle).toEqual(false)
    })
  })

  describe('fails to initialize', () => {
    it('when xRadius is zero or negative', () => {
      expect.soft(() => new Ellipse(0, 0, 0, 1, 0)).toThrowError()
      expect.soft(() => new Ellipse(0, 0, -1, 1, 0)).toThrowError()
    })

    it('when yRadius is zero or negative', () => {
      expect.soft(() => new Ellipse(0, 0, 1, 0, 0)).toThrowError()
      expect.soft(() => new Ellipse(0, 0, 1, -1, 0)).toThrowError()
    })
  })

  describe('computes accurate pointOnEllipseInDirectionOfAnotherPoint', () => {
    it('for non-rotated ellipse at origin', () => {
      expect.soft(new Ellipse(0, 0, 3, 5, 0).pointOnEllipseInDirectionOfAnotherPoint(new Coor( 10,   0))[1]).toEqual(7**2)
      expect.soft(new Ellipse(0, 0, 3, 5, 0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(  0,  10))[1]).toEqual(5**2)
      expect.soft(new Ellipse(0, 0, 3, 5, 0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(-10,   0))[1]).toEqual(7**2)
      expect.soft(new Ellipse(0, 0, 3, 5, 0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(  0, -10))[1]).toEqual(5**2)
    })

    it('for a rotated ellipse at origin (1)', () => {
      expect.soft(new Ellipse(0, 0, 3, 5, Math.PI * 0.5).pointOnEllipseInDirectionOfAnotherPoint(new Coor(0, 10))[1]).toEqual(7**2)
      expect.soft(new Ellipse(0, 0, 3, 5, Math.PI * 1.0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(0, 10))[1]).toEqual(5**2)
      expect.soft(new Ellipse(0, 0, 3, 5, Math.PI * 1.5).pointOnEllipseInDirectionOfAnotherPoint(new Coor(0, 10))[1]).toEqual(7**2)
      expect.soft(new Ellipse(0, 0, 3, 5, Math.PI * 2.0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(0, 10))[1]).toEqual(5**2)
    })

    it('for a rotated ellipse at origin (2)', () => {
      expect.soft(new Ellipse(0, 0, 5, 3, Math.PI * 0.5).pointOnEllipseInDirectionOfAnotherPoint(new Coor(0, 10))[1]).toEqual(5**2)
      expect.soft(new Ellipse(0, 0, 5, 3, Math.PI * 1.0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(0, 10))[1]).toEqual(7**2)
      expect.soft(new Ellipse(0, 0, 5, 3, Math.PI * 1.5).pointOnEllipseInDirectionOfAnotherPoint(new Coor(0, 10))[1]).toEqual(5**2)
      expect.soft(new Ellipse(0, 0, 5, 3, Math.PI * 2.0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(0, 10))[1]).toEqual(7**2)
    })

    it('for a non-rotated ellipse NOT at origin (1)', () => {
      expect.soft(new Ellipse(1, 2, 5, 3, 0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(11,  2))[1]).toEqual(5**2)
      expect.soft(new Ellipse(1, 2, 5, 3, 0).pointOnEllipseInDirectionOfAnotherPoint(new Coor( 1, 12))[1]).toEqual(7**2)
      expect.soft(new Ellipse(1, 2, 5, 3, 0).pointOnEllipseInDirectionOfAnotherPoint(new Coor(-9,  2))[1]).toEqual(5**2)
      expect.soft(new Ellipse(1, 2, 5, 3, 0).pointOnEllipseInDirectionOfAnotherPoint(new Coor( 1,  -8))[1]).toEqual(7**2)
    })

    it('for a rotated ellipse NOT at origin (2)', () => {
      // expect.soft(Math.abs(new Ellipse(1, 2, 5, 3, -Math.PI / 4).distToPoint(new Coor(1+3.0*Math.sqrt(2), 2-3.0*Math.sqrt(2)))[0] - 1)).lessThan(distTolerance)
      expect.soft(new Ellipse(1, 2, 5, 3, -Math.PI / 4).pointOnEllipseInDirectionOfAnotherPoint(new Coor(1+3.0*Math.sqrt(2), 2-3.0*Math.sqrt(2)))[1].toFixed(9)).toEqual('1.000000000')
      expect.soft(new Ellipse(1, 2, 5, 3, -Math.PI / 4).pointOnEllipseInDirectionOfAnotherPoint(new Coor(1+2.0*Math.sqrt(2), 2-2.0*Math.sqrt(2)))[1].toFixed(9)).toEqual('1.000000000')
      // expect.soft(new Ellipse(1, 2, 5, 3, -Math.PI / 4).distToPoint(new Coor(1+3.0*Math.sqrt(2), 2-3.0*Math.sqrt(2)))[0]).toEqual(1)
      expect.soft(new Ellipse(1, 2, 5, 3, -Math.PI / 4).pointOnEllipseInDirectionOfAnotherPoint(new Coor(1+3.0*Math.sqrt(2), 2-3.0*Math.sqrt(2)))[1].toFixed(9)).toEqual('1.000000000')
    })

    it('for an ellipse that is the unit circle at origin', () => {
      const rotationsToTest = [0, Math.PI/60, 1234, -42]
      rotationsToTest.forEach(rotation => {
        const ellipse = new Ellipse(0, 0, 1, 1, rotation)

        const point = new Coor(2, 2)
        const [pointOnEllipse, distSquaredToEllipse] = ellipse.pointOnEllipseInDirectionOfAnotherPoint(point)
        expect.soft(distSquaredToEllipse - (Math.sqrt(9-4*Math.sqrt(2)))**2).toBeLessThan(distTolerance)
        expect.soft(dist(pointOnEllipse, new Coor(Math.sqrt(2)/2, Math.sqrt(2)/2))).toBeLessThan(distTolerance)
      })
    })

    it('for an ellipse that is the unit circle NOT at origin', () => {
      const rotationsToTest = [0, Math.PI/60, 1234, -42]
      rotationsToTest.forEach(rotation => {
        const ellipse = new Ellipse(1, 2, 1, 1, rotation)

        const point = new Coor(3, 4)
        const [pointOnEllipse, distSquaredToEllipse] = ellipse.pointOnEllipseInDirectionOfAnotherPoint(point)
        expect.soft(distSquaredToEllipse - (Math.sqrt(9-4*Math.sqrt(2)))**2).toBeLessThan(distTolerance)
        expect.soft(dist(pointOnEllipse, new Coor(1+Math.sqrt(2)/2, 2+Math.sqrt(2)/2))).toBeLessThan(distTolerance)
      })
    })
  })

  it('computes correct base ellipse', () => {
    const ellipse = new Ellipse(1, 2, 3, 5, Math.PI / 2)
    const baseEllipse = ellipse.toBaseEllipse()
    const expectedBaseEllipse = new Ellipse(0, 0, 3, 5, 0)

    expect.soft(baseEllipse).toEqual(expectedBaseEllipse)
  })

  it('compute correct getPointAtAngle', () => {
    let distTolerance = 1e-10

    const ellipseA = new Ellipse(0, 0, 5, 3, 0)
    expect.soft(dist(ellipseA.getPointAtAngle(Math.PI*0.0), new Coor(5, 0))).lessThan(distTolerance)
    expect.soft(dist(ellipseA.getPointAtAngle(Math.PI*0.5), new Coor(0, 3))).lessThan(distTolerance)
    expect.soft(dist(ellipseA.getPointAtAngle(Math.PI*1.0), new Coor(-5, 0))).lessThan(distTolerance)
    expect.soft(dist(ellipseA.getPointAtAngle(Math.PI*1.5), new Coor(0, -3))).lessThan(distTolerance)

    const ellipseB = new Ellipse(0, 0, 5, 3, Math.PI / 2)
    expect.soft(dist(ellipseB.getPointAtAngle(Math.PI*0.0), new Coor(0, 5))).lessThan(distTolerance)
    expect.soft(dist(ellipseB.getPointAtAngle(Math.PI*0.5), new Coor(-3, 0))).lessThan(distTolerance)
    expect.soft(dist(ellipseB.getPointAtAngle(Math.PI*1.0), new Coor(0, -5))).lessThan(distTolerance)
    expect.soft(dist(ellipseB.getPointAtAngle(Math.PI*1.5), new Coor(3, 0))).lessThan(distTolerance)

    distTolerance = 1e-3
    const sqrt2 = Math.sqrt(2)
    const ellipseC = new Ellipse(1, 2, 5, 3, Math.PI / 4)
    expect.soft(dist(ellipseC.getPointAtAngle(Math.PI*0.0), new Coor(2.5*sqrt2+1, 2.5*sqrt2+2))).lessThan(distTolerance)
    expect.soft(dist(ellipseC.getPointAtAngle(Math.PI*0.5), new Coor(-1.5*sqrt2+1, 1.5*sqrt2+2))).lessThan(distTolerance)
    expect.soft(dist(ellipseC.getPointAtAngle(Math.PI*1.0), new Coor(-2.5*sqrt2+1, -2.5*sqrt2+2))).lessThan(distTolerance)
    expect.soft(dist(ellipseC.getPointAtAngle(Math.PI*1.5), new Coor(1.5*sqrt2+1, -1.5*sqrt2+2))).lessThan(distTolerance)

  })

  // const a = new Ellipse(0, 0, 1, 1, 1)
  // a.isPointOnShape
  // a.arithmeticDistance
})
