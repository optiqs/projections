import {Projection} from './'
import {expectType} from 'tsd'

type A = {a: string}
type B = {b: number}
type C = {c: 'c'}
type D = {d: Date}
type S = {a: A; b: B; c: C; d: D}
const s: S = {a: {a: 'a value'}, b: {b: 7}, c: {c: 'c'}, d: {d: new Date()}}

const p1 = Projection.fromProp<S>()('a')
const p2 = Projection.fromProp<S>()('b')
const p3 = Projection.fromProp<S>()('c')
const p4 = Projection.fromProp<S>()('d')

const combined = p1.combine([p2, p3, p4] as const, (a, b, c, d) => `${a.a}-${b.b}-${c.c}-${d.d}`)
expectType<Projection<S, string>>(combined)

expectType<string>(combined.get(s))
const fromMapN = Projection.mapN([p1, p2] as const, (a, b) => `${a.a}-${b.b}`)

expectType<Projection<S, string>>(fromMapN)
expectType<string>(fromMapN.get(s))
