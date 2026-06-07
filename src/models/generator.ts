import type { Ref } from 'vue'

class ConstellationGenerator {
  // Universal attrs
  title: string
  display: boolean
  regenerateShapes: CallableFunction
  animating: boolean
  stopAnimationFlag: boolean
  stopAnimationAfterCurrentStep: boolean
  stepAtLeastOnce: boolean
  // Constellation-specific attrs
  numCirclesRef: Ref<number>
  animationCyclesPerMinuteRef: Ref<number>
  // Universal functions
  animate: CallableFunction
  addShapes: CallableFunction
  addDebugShapes: CallableFunction

  public constructor(
    // Universal attrs
    title: string,
    display: boolean,
    regenerateShapes: CallableFunction,
    animating: boolean,
    stopAnimationFlag: boolean,
    stopAnimationAfterCurrentStep: boolean,
    stepAtLeastOnce: boolean,
    // Constellation-specific attrs
    numCirclesRef: Ref<number>,
    animationCyclesPerMinuteRef: Ref<number>,
  
    // Universal functions
    animate: CallableFunction,
    addShapes: CallableFunction,
    addDebugShapes: CallableFunction,
  ) {
    this.title = title
    this.display = display
    this.numCirclesRef = numCirclesRef
    this.regenerateShapes = regenerateShapes
    this.animationCyclesPerMinuteRef = animationCyclesPerMinuteRef
    this.animating = animating
    this.stopAnimationFlag = stopAnimationFlag
    this.stopAnimationAfterCurrentStep = stopAnimationAfterCurrentStep
    this.stepAtLeastOnce = stepAtLeastOnce
    this.animate = animate
    this.addShapes = addShapes
    this.addDebugShapes = addDebugShapes
  }
}

export { ConstellationGenerator }
