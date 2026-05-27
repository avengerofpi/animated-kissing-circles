import { Coor } from './coor'

class Circle {
  center: Coor
  radius: number | undefined

  public constructor(x: number, y: number, radius: number | undefined = undefined) {
    this.center = new Coor(x, y)
    this.radius = radius
  }

  /**
   * Compute and return the point on this circle at angle `alpha` from the horizontal axis.
   * Remember that in HTML canvas, the positive y-axis is downward, not upward, so angles
   * are measured clockwise rather than counterclockwise.
   */
  public getPointAtAngle(alpha: number): Coor {
    const x = this.center.x + this.radius*Math.cos(alpha)
    const y = this.center.y + this.radius*Math.sin(alpha)

    return new Coor(x, y)
  }

  public draw(ctx: CanvasRenderingContext2D, fillStyle: string | CanvasGradient | CanvasPattern = `hsl(50 100% 50% / 40%)`) {
    const center = this.center
    ctx.beginPath();
    ctx.arc(center.x, center.y, this.radius, 0, 2*Math.PI);
    const origFillStyle = ctx.fillStyle
    ctx.fillStyle = fillStyle
    ctx.fill()
    ctx.fillStyle = origFillStyle
  }
}

export { Circle }
