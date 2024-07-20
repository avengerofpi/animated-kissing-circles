import { describe, it, expect } from 'vitest'

import { Ellipse } from './ellipse'
import { Coor } from './coor'

describe('Ellipse', () => {
  it('computes correct distToPoint', () => {
    const point = new Coor(0, 10)
    const ellipse = new Ellipse(0, 0, 3, 5, 0)

    expect(ellipse.center).toEqual(new Coor(0, 0))
    expect(ellipse.radiusX).toEqual(3)
    expect(ellipse.radiusY).toEqual(5)
    expect(ellipse.rotation).toEqual(0)
    expect(ellipse.radiusMajorAxis).toEqual(5)
    expect(ellipse.radiusMinorAxis).toEqual(3)
    expect(ellipse.radiusFoci).toEqual(4)
    expect(ellipse.vertices).toEqual([new Coor(0, -5), new Coor(0, 5)])
    expect(ellipse.coVertices).toEqual([new Coor(-3, 0), new Coor(3, 0)])
    expect(ellipse.foci).toEqual([new Coor(0, -4), new Coor(0, 4)])
    expect(ellipse.isCircle).toEqual(false)

    expect(ellipse.distToPoint(point, null)[0]).toEqual(5)
  })
})
