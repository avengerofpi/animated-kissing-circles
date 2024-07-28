import { describe, it, expect } from 'vitest'

import { Coor, dist } from './coor'

describe('Coor', () => {
  it('initializes correctly', () => {
    const a = new Coor(5, 2.67)

    expect.soft(a.x).toEqual(5)
    expect.soft(a.y).toEqual(2.67)
  })

  it('add correctly', () => {
    const a = new Coor(1, 9)
    const b = new Coor(-3, 8.2)
    const c = new Coor(-2, 17.2)

    expect.soft(a.add(b)).toEqual(c)
    expect.soft(b.add(a)).toEqual(c)
  })

  it('subtracts correctly', () => {
    const a = new Coor(1, 9)
    const b = new Coor(-3, 8.2)
    const c = new Coor(-2, 17.2)

    expect.soft(c.subtract(b)).toEqual(a)
    expect.soft(c.subtract(a)).toEqual(b)
  })

  it('rotates correctly', () => {
    const a = new Coor(1, 9)

    const distTolerance = 1e-10
    expect.soft(dist(a.rotate(Math.PI*0.0), a)).toBeLessThan(distTolerance)
    expect.soft(dist(a.rotate(Math.PI*0.5), new Coor(-9, 1))).toBeLessThan(distTolerance)
    expect.soft(dist(a.rotate(Math.PI*1.0), new Coor(-1, -9))).toBeLessThan(distTolerance)
    expect.soft(dist(a.rotate(Math.PI*1.5), new Coor(9, -1))).toBeLessThan(distTolerance)
    expect.soft(dist(a.rotate(Math.PI*0.25), new Coor(-4*Math.sqrt(2), 5*Math.sqrt(2)))).toBeLessThan(distTolerance)
    expect.soft(dist(a.rotate(Math.PI*0.75), new Coor(-5*Math.sqrt(2), -4*Math.sqrt(2)))).toBeLessThan(distTolerance)
  })

  it('scales correctly', () => {
    const a = new Coor(1, 9)

    expect.soft(a.scale(1)).toEqual(a)
    expect.soft(a.scale(-1)).toEqual(new Coor(-1, -9))
    expect.soft(a.scale(1.5)).toEqual(new Coor(1.5, 13.5))
    expect.soft(a.scale(0)).toEqual(new Coor(0, 0))
  })

  // it('scales correctly', () => {
  //   const a = new Coor(1, 9)
  // })
  // const c = new Coor(0, 0)
  // c.applyRotationAndOffset
  // c.dotProduct
  // c.magnitude
  // c.projection
  // c.rotate_90_degrees
})
