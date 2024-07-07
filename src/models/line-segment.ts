import { Coor, dist } from './coor'

class LineSegment {
  src: Coor
  dst: Coor
  length: number

  public constructor(src: Coor, dst: Coor) {
    this.src = src
    this.dst = dst
    this.length = dist(src, dst)
  }

  public static fromXYXY(srcX: number, srcY: number, dstX: number, dstY: number) {
    return new LineSegment(new Coor(srcX, srcY), new Coor(dstX, dstY))
  }

  public static fromCoorXY(src: Coor, dstX: number, dstY: number) {
    return new LineSegment(src, new Coor(dstX, dstY))
  }

  public static fromXYCoor(srcX: number, srcY: number, dst: Coor) {
    return new LineSegment(new Coor(srcX, srcY), dst)
  }
}

export { LineSegment }
