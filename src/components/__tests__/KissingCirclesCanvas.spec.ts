import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import BaseCanvas from '../BaseCanvas.vue'

describe('BaseCanvas', () => {
  it('renders properly', () => {
    const wrapper = mount(BaseCanvas, { props: { msg: 'Hello Vitest' } })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
