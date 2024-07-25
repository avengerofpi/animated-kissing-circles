import { describe, it, expect } from 'vitest'

import { Coor, dist } from './coor'

describe('Coor', () => {
  it('initializes correctly', () => {
    const a = new Coor(5, 2.67)

    expect(a.x).toEqual(5)
    expect(a.y).toEqual(2.67)
  })

  it('add correctly', () => {
    const a = new Coor(1, 9)
    const b = new Coor(-3, 8.2)
    const c = new Coor(-2, 17.2)

    expect(a.add(b)).toEqual(c)
    expect(b.add(a)).toEqual(c)
  })

  it('subtracts correctly', () => {
    const a = new Coor(1, 9)
    const b = new Coor(-3, 8.2)
    const c = new Coor(-2, 17.2)

    expect(c.subtract(b)).toEqual(a)
    expect(c.subtract(a)).toEqual(b)
  })

  it('rotates correctly', () => {
    const a = new Coor(1, 9)

    const distTolerance = 1e-10
    expect(dist(a.rotate(Math.PI*0.0), a)).toBeLessThan(distTolerance)
    expect(dist(a.rotate(Math.PI*0.5), new Coor(-9, 1))).toBeLessThan(distTolerance)
    expect(dist(a.rotate(Math.PI*1.0), new Coor(-1, -9))).toBeLessThan(distTolerance)
    expect(dist(a.rotate(Math.PI*1.5), new Coor(9, -1))).toBeLessThan(distTolerance)
    expect(dist(a.rotate(Math.PI*0.25), new Coor(-4*Math.sqrt(2), 5*Math.sqrt(2)))).toBeLessThan(distTolerance)
    expect(dist(a.rotate(Math.PI*0.75), new Coor(-5*Math.sqrt(2), -4*Math.sqrt(2)))).toBeLessThan(distTolerance)
  })

  it('add correctly', () => {
    const a = new Coor(1, 9)
  })
})
