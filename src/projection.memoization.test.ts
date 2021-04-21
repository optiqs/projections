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

    const mapper = jest.fn((a: A, b: B, c: C, d: D) => {
      return {e: {a, b, c, d}}
    })
    const combined = p1.combine([p2, p3, p4], mapper)
    const expected = {e: {a: s.a, b: s.b, c: s.c, d: s.d}}
    const actual = combined.get(s)

    expect(actual).toEqual(expected)
    expect(combined.get(s) === actual).toBe(true)
    expect(combined.get(s) === actual).toBe(true)
    expect(mapper).toBeCalledTimes(1)
  })

  test('calls the mapping function again when the input reference changes', () => {
    expect(Projection.isMemoized()).toBe(true)

    const p1 = Projection.fromProp<S>()('a')
    const p2 = Projection.fromProp<S>()('b')
    const p3 = Projection.fromProp<S>()('c')
    const p4 = Projection.fromProp<S>()('d')
    const mapper = jest.fn((a: A, b: B, c: C, d: D) => {
      return [a.aValue, b.bValue, c.cValue, d.dValue]
    })
    const combined = p1.combine([p2, p3, p4], mapper)
    const expected = [s.a.aValue, s.b.bValue, s.c.cValue, s.d.dValue]
    const actual = combined.get(s)

    expect(actual).toEqual(expected)
    const newState: S = {...s}
    const changed = combined.get(newState)
    expect(newState === s).toBe(false)
    expect(changed).toEqual(actual)
    expect(mapper).toBeCalledTimes(2)
    expect(changed === actual).toBe(false)
  })
})

describe('with memoization off', () => {
  test('calls the mapping function every time', () => {
    expect(Projection.isMemoized()).toBe(false)
    const p1 = Projection.fromProp<S>()('a')
    const p2 = Projection.fromProp<S>()('b')
    const p3 = Projection.fromProp<S>()('c')
    const p4 = Projection.fromProp<S>()('d')

    const mapper = jest.fn((a: A, b: B, c: C, d: D) => {
      return {e: {a, b, c, d}}
    })
    const combined = p1.combine([p2, p3, p4], mapper)
    const expected = {e: {a: s.a, b: s.b, c: s.c, d: s.d}}
    const actual = combined.get(s)

    expect(actual).toEqual(expected)
    expect(combined.get(s) === actual).toBe(false)
    expect(combined.get(s) === actual).toBe(false)
    expect(mapper).toBeCalledTimes(3)
  })
})
