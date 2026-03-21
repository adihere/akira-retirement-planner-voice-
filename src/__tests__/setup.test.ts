describe('Setup Test', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify localStorage is mocked', () => {
    localStorage.setItem('test', 'value')
    expect(localStorage.getItem('test')).toBe('value')
    localStorage.clear()
    expect(localStorage.getItem('test')).toBeNull()
  })
})
