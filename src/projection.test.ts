import {Projection} from './projection'
import {Lens} from 'monocle-ts'

test('Projection.fromProp: drills down to an objects prop', () => {
  type S = {a: string}
  const s: S = {a: 'A'}
  const projection = Projection.fromProp<S>()('a')
  const expected = s.a
  const actual = projection.get(s)
  expect(actual).toEqual(expected)
  expect(projection instanceof Projection).toBeTruthy()
})

test('Projection.compose: composes two projections', () => {
  type A = {b: string}
  type S = {a: A}
  const s: S = {a: {b: 'value'}}
  const p1 = Projection.fromProp<S>()('a')
  const p2 = Projection.fromProp<A>()('b')
  const composed = p1.compose(p2)
  const expected = s.a.b
  const actual = composed.get(s)
  expect(actual).toEqual(expected)
  expect(composed instanceof Projection).toBeTruthy()
})

test('Projection.composeLens: composes a projection with a lens', () => {
  type A = {b: string}
  type S = {a: A}
  const s: S = {a: {b: 'value'}}
  const p1 = Projection.fromProp<S>()('a')
  const p2 = Lens.fromProp<A>()('b')
  const composed = p1.composeLens(p2)
  const expected = s.a.b
  const actual = composed.get(s)
  expect(actual).toEqual(expected)
  expect(composed instanceof Projection).toBeTruthy()
})

test('Projection.combine: combines two projections', () => {
  type A = {value: string}
  type B = {type: number}
  type S = {a: A; b: B}
  const s: S = {a: {value: 'value'}, b: {type: 1}}
  const p1 = Projection.fromProp<S>()('a')
  const p2 = Projection.fromProp<S>()('b')
  const combined = p1.combine(p2, (a, b) => ({c: `${a.value}-${b.type}`}))
  const expected = {c: `${s.a.value}-${s.b.type}`}
  const actual = combined.get(s)
  expect(actual).toEqual(expected)
  expect(combined instanceof Projection).toBeTruthy()
})

test('Projection.combine: combines more than two projections', () => {
  type A = {aValue: string}
  type B = {bValue: number}
  type C = {cValue: 'c'}
  type D = {dValue: Date}
  type S = {a: A; b: B; c: C; d: D}
  const s: S = {a: {aValue: 'a value'}, b: {bValue: 7}, c: {cValue: 'c'}, d: {dValue: new Date()}}
  const p1 = Projection.fromProp<S>()('a')
  const p2 = Projection.fromProp<S>()('b')
  const p3 = Projection.fromProp<S>()('c')
  const p4 = Projection.fromProp<S>()('d')
  const combined = p1.combine(
    [p2, p3, p4],
    (a, b, c, d) => `${a.aValue}-${b.bValue}-${c.cValue}-${d.dValue}`
  )
  const expected = `${s.a.aValue}-${s.b.bValue}-${s.c.cValue}-${s.d.dValue}`
  const actual = combined.get(s)
  expect(actual).toEqual(expected)
  expect(combined instanceof Projection).toBeTruthy()
})

test('Projection.map: obeys identity law', () => {
  type S = {a: string}
  const s: S = {a: 'A'}
  const projection = Projection.fromProp<S>()('a')
  const expected = s.a
  const actual = projection.map(a => a).get(s)
  expect(actual).toEqual(expected)
})

test('Projection.map: obeys composition law', () => {
  type S = {a: string}
  const s: S = {a: 'A'}
  const projection = Projection.fromProp<S>()('a')
  const f = (v: string): string => `f(${v})`
  const g = (v: string): string => `g(${v})`
  const split = projection
    .map(f)
    .map(g)
    .get(s)
  const composed = projection.map(v => g(f(v))).get(s)
  expect(split).toEqual(composed)
})
