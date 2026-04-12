import '@testing-library/jest-dom/vitest'

class MockAudioContext {
  state = 'running'
  currentTime = 0
  sampleRate = 44100
  destination = {}
  resume() { return Promise.resolve() }
  createOscillator() {
    return {
      type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
      connect() {}, start() {}, stop() {},
    }
  }
  createGain() {
    return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }
  }
  createBuffer() { return { getChannelData() { return new Float32Array(1) } } }
  createBufferSource() { return { buffer: null, connect() {}, start() {} } }
  createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect() {} } }
  decodeAudioData() { return Promise.resolve(this.createBuffer()) }
}

Object.defineProperty(globalThis, 'AudioContext', { value: MockAudioContext, writable: true })
Object.defineProperty(globalThis, 'webkitAudioContext', { value: MockAudioContext, writable: true })
