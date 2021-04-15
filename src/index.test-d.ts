import {Projection} from './'
import {expectType} from 'tsd'
import {pipe} from 'fp-ts/function'

type A = string
type B = number
type C = 'c'
type D = Date
type S = {a: A; b: B; c: C; d: D}

const p1 = Projection.fromProp<S>()('a')
const p2 = Projection.fromProp<S>()('b')
const p3 = Projection.fromProp<S>()('c')
const p4 = Projection.fromProp<S>()('d')

expectType<Projection<S, string>>(
  p1.combine([p2, p3, p4] as const, (a, b, c, d) => `${a}-${b}-${c}-${d}`)
)
expectType<Projection<S, string>>(
  Projection.mapN([p1, p2, p3, p4] as const, (a, b) => [a, b].join(''))
)
expectType<Projection<S, string>>(
  Projection.mapN([p1, p2, p3, p4] as const, (a, b, c) => [a, b, c].join(''))
)
expectType<Projection<S, string>>(
  Projection.mapN([p1, p2, p3, p4] as const, (a, b, c, d) => [a, b, c, d].join(''))
)

expectType<Projection<S, string>>(
  pipe(
    [p1, p2, p3, p4] as const,
    Projection.mapF((a, b, c, d) => [a, b, c, d].join(''))
  )
)
expectType<Projection<S, {value: Array<A | B | C | D>}>>(
  pipe(
    [p1, p2, p3, p4] as const,
    Projection.mapF((a, b, c, d) => ({value: [a, b, c, d]}))
  )
)

expectType<[Projection<S, A>, Projection<S, B>, Projection<S, C>]>(Projection.merge(p1, p2, p3))
