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

  public draw(ctx: CanvasRenderingContext2D) {
    // Add line segment pointing to nearest neighbor
    const origLineWidth = ctx.lineWidth
    const origLineDash = ctx.getLineDash()
    ctx.lineWidth = origLineWidth * 0.5
    ctx.setLineDash([1,1]);
    ctx.beginPath();
    ctx.moveTo(this.src.x, this.src.y);
    ctx.lineTo(this.dst.x, this.dst.y)
    ctx.stroke();

    ctx.lineWidth = origLineWidth
    ctx.setLineDash(origLineDash);
  }
}

class LineSegmentExtended extends LineSegment {
  dstOrig: Coor
  scale: number

  public constructor(src: Coor, dst: Coor, scale: number) {
    const dstExtended = src.add(dst.subtract(src).scale(scale))
    super(src, dstExtended)

    this.dstOrig = dst
    this.scale = scale
  }
}

export { LineSegment, LineSegmentExtended }
