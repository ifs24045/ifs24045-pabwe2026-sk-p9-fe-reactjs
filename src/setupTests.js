import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    },
  })
}

HTMLCanvasElement.prototype.getContext = () => null

if (!window.getSelection) {
  window.getSelection = () => ({
    removeAllRanges() {},
    addRange() {},
    rangeCount: 0,
  })
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-accent')
})