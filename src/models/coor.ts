

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
}

export { Coor }

