import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { resetDemoData } from '@/services/storage'
import { setApiConfig } from '@/services/mockApi'

beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear()
  }
  resetDemoData()
  setApiConfig({ latency: [0, 0], failureRate: 0 })
})
