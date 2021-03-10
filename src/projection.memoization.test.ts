import {Projection} from './projection'

type A = {aValue: string}
type B = {bValue: number}
type C = {cValue: 'c'}
type D = {dValue: Date}
type S = {a: A; b: B; c: C; d: D}
const s: S = {a: {aValue: 'a value'}, b: {bValue: 7}, c: {cValue: 'c'}, d: {dValue: new Date()}}

describe('with memoization on', () => {
  beforeEach(() => Projection.memoizeByDefault())
  afterEach(() => Projection.memoizeByDefault(false))

  test("only calls the mapping function once when the input doesn't change", () => {
    expect(Projection.isMemoized()).toBe(true)

    const p1 = Projection.fromProp<S>()('a')
    const p2 = Projection.fromProp<S>()('b')
    const p3 = Projection.fromProp<S>()('c')
    const p4 = Projection.fromProp<S>()('d')
    let timesCalled = 0

    const combined = p1.combine([p2, p3, p4], (a, b, c, d) => {
      ++timesCalled
      return {e: {a, b, c, d}}
    })
    const expected = {e: {a: s.a, b: s.b, c: s.c, d: s.d}}
    const actual = combined.get(s)

    expect(actual).toEqual(expected)
    expect(combined.get(s) === actual).toBe(true)
    expect(combined.get(s) === actual).toBe(true)
    expect(timesCalled).toBe(1)
  })

  test('calls the mapping function again when the changes', () => {
    expect(Projection.isMemoized()).toBe(true)

    const p1 = Projection.fromProp<S>()('a')
    const p2 = Projection.fromProp<S>()('b')
    const p3 = Projection.fromProp<S>()('c')
    const p4 = Projection.fromProp<S>()('d')
    let timesCalled = 0

    const combined = p1.combine([p2, p3, p4], (a, b, c, d) => {
      ++timesCalled
      return {e: {a, b, c, d}}
    })
    const expected = {e: {a: s.a, b: s.b, c: s.c, d: s.d}}
    const actual = combined.get(s)

    expect(actual).toEqual(expected)
    expect(combined.get(s) === actual).toBe(true)
    expect(combined.get({...s}) === actual).toBe(false)
    expect(timesCalled).toBe(2)
  })
})

describe('with memoization off', () => {
  test('calls the mapping function every time', () => {
    expect(Projection.isMemoized()).toBe(false)
    const p1 = Projection.fromProp<S>()('a')
    const p2 = Projection.fromProp<S>()('b')
    const p3 = Projection.fromProp<S>()('c')
    const p4 = Projection.fromProp<S>()('d')
    let timesCalled = 0

    const combined = p1.combine([p2, p3, p4], (a, b, c, d) => {
      ++timesCalled
      return {e: {a, b, c, d}}
    })
    const expected = {e: {a: s.a, b: s.b, c: s.c, d: s.d}}
    const actual = combined.get(s)

    expect(actual).toEqual(expected)
    expect(combined.get(s) === actual).toBe(false)
    expect(combined.get(s) === actual).toBe(false)
    expect(timesCalled).toBe(3)
  })
})
