/* eslint-disable @typescript-eslint/no-explicit-any */
import {expectType} from 'tsd'
import {Lens, lens} from 'monocle-ts'
import {pipe} from 'fp-ts/function'
import {Projection} from './'

type A = string
type B = number
type C = Date
type D = Map<string, boolean>
type S = {a: A; b: B; c: C; d: D}

const pA = Projection.fromProp<S>()('a')
const pB = Projection.fromProp<S>()('b')
const pC = Projection.fromProp<S>()('c')
const pD = Projection.fromProp<S>()('d')

// Projection.combine returns the correct type and infers the right types for the function parameters
expectType<Projection<S, string>>(
  pA.combine(pB, (a, b) => {
    expectType<A>(a)
    expectType<B>(b)
    return `${a}-${b}`
  })
)

expectType<Projection<S, string>>(
  pA.combine([pB, pC, pD], (a, b, c, d) => {
    expectType<A>(a)
    expectType<B>(b)
    expectType<C>(c)
    expectType<D>(d)
    return `${a}-${b}-${c}-${d}`
  })
)

// Projection.mapN returns the correct type and infers the right types for the function parameters
expectType<Projection<S, string>>(
  Projection.mapN([pA, pB], (a, b) => {
    expectType<A>(a)
    expectType<B>(b)
    return [a, b].join('')
  })
)

expectType<Projection<S, string>>(
  Projection.mapN([pA, pB, pC], (a, b, c) => {
    expectType<A>(a)
    expectType<B>(b)
    expectType<C>(c)
    return [a, b, c].join('')
  })
)

expectType<Projection<S, string>>(
  Projection.mapN([pA, pB, pC, pD], (a, b, c, d) => {
    expectType<A>(a)
    expectType<B>(b)
    expectType<C>(c)
    expectType<D>(d)
    return [a, b, c, d].join('')
  })
)

// Projection.mapF returns the correct type and infers the right types for the function parameters with a const tuple
expectType<Projection<S, string>>(
  pipe(
    [pA, pB, pC, pD] as const,
    Projection.mapF((a, b, c, d) => {
      expectType<A>(a)
      expectType<B>(b)
      expectType<C>(c)
      expectType<D>(d)
      return [a, b, c, d].join('')
    })
  )
)

// Projection.mapF returns the correct type and infers the right types for the function parameters via Projection.createTuple
expectType<Projection<S, string>>(
  pipe(
    Projection.createTuple(pA, pB, pC, pD),
    Projection.mapF((a, b, c, d) => {
      expectType<A>(a)
      expectType<B>(b)
      expectType<C>(c)
      expectType<D>(d)
      return [a, b, c, d].join('')
    })
  )
)

expectType<Projection<S, {value: Array<A | B | C | D>}>>(
  pipe(
    [pA, pB, pC, pD] as const,
    Projection.mapF((a, b, c, d) => ({value: [a, b, c, d]}))
  )
)

// Projection.createTuple returns a strongly-typed tuple
expectType<[Projection<S, A>, Projection<S, B>, Projection<S, C>]>(
  Projection.createTuple(pA, pB, pC)
)

// Projection.createTuple returns a strongly-typed tuple with different gettable types

const lA = Lens.fromProp<S>()('a')
const lC = pipe(lens.id<S>(), lens.prop('c'))
expectType<[Lens<S, A>, Projection<S, B>, lens.Lens<S, C>]>(Projection.createTuple(lA, pB, lC))

// Projection.mapF correctly infers the parameter types for Cache resolvers
pipe(
  [pA, pB] as const,
  Projection.mapF((a, b) => `${a}-${b}`, {
    getResolver: s => {
      expectType<S>(s)
      return s
    },
    mapResolver: (a, b) => {
      expectType<A>(a)
      expectType<B>(b)
      return a
    }
  })
)
