import {Projection} from './projection'

test('Projection.fromProp: drills down to an objects prop', () => {
  type S = {a: string}
  const s: S = {a: 'A'}
  const projection = Projection.fromProp<S>()('a')
  const expected = s.a
  const actual = projection.get(s)
  expect(actual).toEqual(expected)
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
