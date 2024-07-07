

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

function dist(a: Coor, b: Coor): number {
  return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)
}

export { Coor, dist }
