import type { Ref } from 'vue'

class ConstellationGenerator {
  // Universal attrs
  title: string
  display: boolean
  // animating: boolean
  // stopAnimationFlag: boolean
  // stopAnimationAfterCurrentStep: boolean
  // stepAtLeastOnce: boolean

  // Constellation-specific attrs
  // numCirclesRef: Ref<number>
  animationCyclesPerMinuteRef: Ref<number>

  // Universal functions
  // animate: CallableFunction
  regenerateShapes: CallableFunction
  addShapes: CallableFunction
  addDebugShapes: CallableFunction

  public constructor(
    // Universal attrs
    title: string,
    display: boolean,
    // animating: boolean,
    // stopAnimationFlag: boolean,
    // stopAnimationAfterCurrentStep: boolean,
    // stepAtLeastOnce: boolean,

    // Constellation-specific attrs
    // numCirclesRef: Ref<number>,
    animationCyclesPerMinuteRef: Ref<number>,
  
    // Universal functions
    // animate: CallableFunction,
    regenerateShapes: CallableFunction,
    addShapes: CallableFunction,
    addDebugShapes: CallableFunction,
  ) {
    // Universal attrs
    this.title = title
    this.display = display
    // this.animating = animating
    // this.stopAnimationFlag = stopAnimationFlag
    // this.stopAnimationAfterCurrentStep = stopAnimationAfterCurrentStep
    // this.stepAtLeastOnce = stepAtLeastOnce

    // Constellation-specific attrs
    // this.numCirclesRef = numCirclesRef
    this.animationCyclesPerMinuteRef = animationCyclesPerMinuteRef

    // Universal functions
    // this.animate = animate
    this.regenerateShapes = regenerateShapes
    this.addShapes = addShapes
    this.addDebugShapes = addDebugShapes
  }
}

export { ConstellationGenerator }
