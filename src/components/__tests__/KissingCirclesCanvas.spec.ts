import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import BaseCanvas from '../BaseCanvas.vue'

describe.skip('BaseCanvas', () => {
  it('renders properly', () => {
    const wrapper = mount(BaseCanvas, {
      props: {
        animating: false,
        toggleAnimating: () => {},
        addShapes: () => {},
        addDebugShapes: () => {},
        stepAtLeastOnce: false
      } })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
