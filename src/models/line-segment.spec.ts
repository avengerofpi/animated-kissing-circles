import { describe, it, expect } from 'vitest'

import { Coor, dist } from './coor'
import { LineSegment, LineSegmentExtended } from './line-segment'

describe('LineSegment', () => {
  it('initializes correctly', () => {
    const a = new Coor(1, 2)
    const b = new Coor(-3, 10)

    expect(new LineSegment(a, b).src).toEqual(a)
    expect(new LineSegment(a, b).dst).toEqual(b)
    expect(new LineSegment(a, b).length).toEqual(Math.sqrt(16+64))
  })
})

describe('LineSegmentExtended', () => {
  it('initializes correctly', () => {
    const a = new Coor(1, 2)
    const b = new Coor(-3, 10)

    expect(new LineSegmentExtended(a, b, 2).src).toEqual(a)
    expect(new LineSegmentExtended(a, b, 2).dst).toEqual(new Coor(-7, 18))
    expect(new LineSegmentExtended(a, b, 2).length).toEqual(2*Math.sqrt(16+64))
  })
})
