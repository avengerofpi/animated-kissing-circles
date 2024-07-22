class Coor {
  x: number
  y: number

  public constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  public static fromXYCoorPair(xyCoorPair: number[]) {
    return new Coor(xyCoorPair[0], xyCoorPair[1])
  }

  /** Return the rotation of the current coor by `theta` radians counterclockwise around the origin.
   * Leaves current coor unchanged. */
  public rotate(theta: number): Coor {
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)
    const x = this.x * cosTheta - this.y * sinTheta
    const y = this.x * sinTheta + this.y * cosTheta

    return new Coor(x, y)
  }

  /** Return the rotation of the current coor by 90 degrees counterclockwise around the origin.
   * Leaves current coor unchanged.
   */
  public rotate_90_degrees(): Coor {
    return this.rotate(Math.PI / 2)
  }

  /** Return the addition of the current coor and `offset`. Leaves current coor unchanged. */
  public add(offset: Coor): Coor {
    return new Coor(this.x + offset.x, this.y + offset.y)
  }

  /** Return the addition of the current coor and `-offset`. Leaves current coor unchanged. */
  public subtract(offset: Coor): Coor {
    return new Coor(this.x - offset.x, this.y - offset.y)
  }

  /** Dot product, as if two `Coor`s are vectors */
  public dotProduct(point: Coor): number {
    const ret = (this.x * point.x) + (this.y * point.y)
    // console.log(`Dot product ${this.toString()} . ${point.toString()} = ${ret.toFixed(3)}`)

    return ret
  }

  /** Compute projection of a point onto this point (as though vectors) */
  public projection(point: Coor): Coor {
    const scale = this.dotProduct(point) / this.dotProduct(this)
    const ret = this.scale(scale)
    // console.log(`Projection ${point.toString()} onto ${this.toString()} = ${ret.toString()} (scale = ${scale.toFixed(3)})`)

    return ret
  }

  /** Distance from the origin to this coordinate. */
  public magnitude() {
    return Math.sqrt(this.dotProduct(this))
  }

  /**
   * Return the current coor scaled from the origin by a factor of `scale`. If `scale` is
   * negative, the new coor flipped to the other side of the origin. If the absolute value of
   * `scale` is greater than `1`, the new point if moved away from the origin. If the absolute
   * value of `scale` is less than `1`, the new point is moved towards the origin.
   */
  public scale(zoomScale: number): Coor {
    return new Coor(this.x * zoomScale, this.y * zoomScale)
  }

  /** Return the result of rotating the current coor by `theta` radians counterclockwise around
   * the origin and the adding `offset` to result. Leaves the current coor unchanged. */
  public applyRotationAndOffset(theta: number, offset: Coor): Coor {
    return this.rotate(theta).add(offset)
  }

  /** Cast to string with chosen precision */
  toString(precision=3) {
    return `(${this.x.toFixed(precision)}, ${this.y.toFixed(precision)})`
  }

  /** Draw the point on a canvas context */
  public draw(
    ctx: CanvasRenderingContext2D,
    dotRadius: number = 5,
    fillStyle: string | CanvasGradient | CanvasPattern | null = null
  ) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, dotRadius, 0,2*Math.PI);
    const origFillStyle = ctx.fillStyle
    if (fillStyle) { ctx.fillStyle = fillStyle }
    // ctx.fillStyle = `hsl(${(index / numCirclesRef.value) * 360 + colorHueOffset} 100% 50% / 40%)`
    ctx.fill()
    ctx.fillStyle = origFillStyle
    ctx.stroke();
  }
}

function dist(a: Coor, b: Coor): number {
  return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)
}

export { Coor, dist }
