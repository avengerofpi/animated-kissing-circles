import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import KissingCirclesCanvas from '../KissingCirclesCanvas.vue'

describe('KissingCirclesCanvas', () => {
  it('renders properly', () => {
    const wrapper = mount(KissingCirclesCanvas, { props: { msg: 'Hello Vitest' } })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
