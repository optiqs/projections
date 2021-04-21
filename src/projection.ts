import {flow, FunctionN, identity, pipe} from 'fp-ts/lib/function'
import {Lens, Getter} from 'monocle-ts'
import {MemoizeFn, memoizeOnce} from './memoize-once'
export interface ProjectionFromPath<S> {
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4]
  >(
    path: [K1, K2, K3, K4, K5]
  ): Projection<S, S[K1][K2][K3][K4][K5]>
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3]
  >(
    path: [K1, K2, K3, K4]
  ): Projection<S, S[K1][K2][K3][K4]>
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(
    path: [K1, K2, K3]
  ): Projection<S, S[K1][K2][K3]>
  <K1 extends keyof S, K2 extends keyof S[K1]>(path: [K1, K2]): Projection<S, S[K1][K2]>
  <K1 extends keyof S>(path: [K1]): Projection<S, S[K1]>
}

interface GetterFunction<S, A> {
  (s: S): A
}

export interface Gettable<S, A> {
  get(s: S): A
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TupleType = readonly any[]
export type GettableTuple<S, Tuple extends TupleType> = {
  readonly [Index in keyof Tuple]: Gettable<S, Tuple[Index]>
} & {
  readonly length: Tuple['length']
}

let customMemoizationFunction: MemoizeFn | null = null
let defaultMemoizeFunction: MemoizeFn = memoizeOnce

export class Projection<S, A> implements Gettable<S, A> {
  private readonly memoizedGet: GetterFunction<S, A>

  constructor(getter: GetterFunction<S, A>) {
    this.memoizedGet = defaultMemoizeFunction(getter)
    this.get = this.get.bind(this)
    this.compose = this.compose.bind(this)
    this.composeLens = this.composeLens.bind(this)
    this.combineLens = this.combineLens.bind(this)
    this.combine = this.combine.bind(this)
    this.map = this.map.bind(this)
    this.asGetter = this.asGetter.bind(this)
    this.composeGetter = this.composeGetter.bind(this)
  }

  public get(s: S): A {
    return this.memoizedGet(s)
  }

  public asGetter(): Getter<S, A> {
    return new Getter(this.get)
  }

  private composeGetter<B>(ab: Getter<A, B>): Getter<S, B> {
    return this.asGetter().compose(ab)
  }

  public compose<B>(sb: Gettable<A, B>): Projection<S, B> {
    const getter = Projection.from(sb).asGetter()
    return pipe(getter, this.composeGetter, Projection.fromGetter)
  }

  public composeLens<B>(sb: Lens<A, B>): Projection<S, B> {
    return this.compose(sb)
  }
  public combineLens<B, R>(sb: Lens<S, B>, f: FunctionN<[A, B], R>): Projection<S, R>

  public combineLens<B, C, R>(
    ss: [Lens<S, B>, Lens<S, C>],
    f: FunctionN<[A, B, C], R>
  ): Projection<S, R>

  public combineLens<B, C, D, R>(
    ss: [Lens<S, B>, Lens<S, C>, Lens<S, D>],
    f: FunctionN<[A, B, C, D], R>
  ): Projection<S, R>

  public combineLens<B, C, D, E, R>(
    ss: [Lens<S, B>, Lens<S, C>, Lens<S, D>, Lens<S, E>],
    f: FunctionN<[A, B, C, D, E], R>
  ): Projection<S, R>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public combineLens<R>(sb: any, f: any): Projection<S, R> {
    return this.combine(sb, f)
  }

  /**
   * Combine one or more projection-like objects with the provided mapping function.
   *
   * @example
   * declare const p1 : Projection<S,A>
   * declare const p2 : { get: (s: S) => B }
   * declare const p3 : Lens<S, A>
   * const combined = p1.combine([p2, p3], (a, b, c) => ({
   *   d: `${a.foo}-${b.bar}-${c.baz}`
   * }))
   */
  public combine<B, T extends TupleType, R>(
    ss: GettableTuple<S, [B, ...T]>,
    f: FunctionN<[A, B, ...T], R>
  ): Projection<S, R>
  public combine<B, R>(ss: Gettable<S, B>, f: FunctionN<[A, B], R>): Projection<S, R>
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
  public combine<T extends TupleType, R>(ss: any, f: any): Projection<S, R> {
    const ps: GettableTuple<S, [A, ...T]> = Array.isArray(ss) ? [this, ...ss] : ([this, ss] as any)
    return Projection.mapN(ps, f)
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */

  public map<B>(f: (a: A) => B): Projection<S, B> {
    return Projection.map(this, f)
  }

  public static isMemoized(): boolean {
    return defaultMemoizeFunction !== identity
  }

  public static enableMemoization(): void {
    defaultMemoizeFunction = customMemoizationFunction ?? memoizeOnce
  }

  public static disableMemoization(): void {
    defaultMemoizeFunction = identity
  }

  public static customMemoization(memoize: MemoizeFn): void {
    customMemoizationFunction = memoize
    defaultMemoizeFunction = memoize
  }

  public static of<S, A>(getter: GetterFunction<S, A>): Projection<S, A> {
    return new Projection(defaultMemoizeFunction(getter))
  }

  /**
   * Creates a projection from anything that has an appropriate `get` method.
   * If the provided argument is already a projection, that same instance is returned.
   */
  public static from<S, A>(gettable: Gettable<S, A>): Projection<S, A> {
    if (gettable instanceof Projection) {
      return gettable
    }
    return Projection.of(gettable.get)
  }

  public static fromLens<S, A>(lens: Lens<S, A>): Projection<S, A> {
    return Projection.from(lens)
  }

  public static fromGetter<S, A>(getter: Getter<S, A>): Projection<S, A> {
    return Projection.from(getter)
  }

  public static map<S, A, B>(sa: Gettable<S, A>, f: (a: A) => B): Projection<S, B> {
    return Projection.mapN([sa], f)
  }

  /**@deprecated Use `mapN` instead*/
  public static map2<S, A, B, R>(
    ss: [Gettable<S, A>, Gettable<S, B>],
    f: FunctionN<[A, B], R>
  ): Projection<S, R> {
    return Projection.mapN(ss, f)
  }

  /**
   * Combine one or more projection-like objects with the provided mapping function.
   *
   * @example
   * declare const p1 : Projection<S,A>
   * declare const p2 : { get: (s: S) => B }
   * declare const p3 : Lens<S, A>
   * const combined = Projection.mapN([p1, p2, p3], (a, b, c) => ({
   *   d: `${a.foo}-${b.bar}-${c.baz}`
   * }))
   */
  public static mapN<S, A, T extends TupleType, R>(
    projections: GettableTuple<S, [A, ...T]>,
    f: FunctionN<[A, ...T], R>
  ): Projection<S, R> {
    return Projection.of(
      flow(
        s => projections.map(p => p.get(s)) as [A, ...T],

        (p: [A, ...T]) => f(...p)
      )
    )
  }

  /**
   * Same as `mapN`, but in a format that can be piped.
   *
   * To get type inference working properly, you may need to use `as const` or Projection.createTuple
   * @example
   * const combined = pipe(
   *   [p1, p2, p3] as const,
   *   Projection.mapF((a, b, c) => ({
   *     d: `${a.foo}-${b.bar}-${c.baz}`
   *   }))
   *
   *
   * // Or:
   * const combined = pipe(
   *   Projection.createTuple(p1, p2, p3),
   *   Projection.mapF((a, b, c) => ({
   *     d: `${a.value}-${b.type}-${c.foo}`
   *   }))
   * )
   */
  public static mapF<A, T extends TupleType, R, S>(f: FunctionN<[A, ...T], R>) {
    return (projections: GettableTuple<S, [A, ...T]>): Projection<S, R> => {
      return Projection.mapN(projections, f)
    }
  }

  public static get<S, A>(p: Projection<S, A>, s: S): A {
    return p.get(s)
  }

  public static fromProp<S>() {
    return <P extends keyof S>(prop: P): Projection<S, S[P]> =>
      pipe(prop, Lens.fromProp<S>(), Projection.fromLens)
  }

  public static fromProps<S>() {
    return <P extends keyof S>(props: P[]): Projection<S, {[K in P]: S[K]}> =>
      pipe(props, Lens.fromProps<S>(), Projection.fromLens)
  }

  public static fromPath<S>(): ProjectionFromPath<S> {
    return ((path: never) =>
      pipe(path, Lens.fromPath<S>(), Projection.fromLens)) as ProjectionFromPath<S>
  }

  public static fromNullableProp<S>() {
    return <A extends S[K], K extends keyof S>(
      k: K,
      defaultValue: A
    ): Projection<S, NonNullable<S[K]>> =>
      pipe(Lens.fromNullableProp<S>()(k, defaultValue), Projection.fromLens)
  }

  /**
   * Essentially the identity function for an array of projections
   *
   * This can be used in lieu of `as const` if preferred, or to prevent type widening of the projections to improve type inference for mapping functions
   *
   * @see Projection.mapN
   */
  public static createTuple<T extends GettableTuple<unknown, TupleType>>(...projections: T): T {
    return projections
  }
}

declare module 'monocle-ts' {
  interface Lens<S, A> {
    asProjection(): Projection<S, A>
  }
  interface Getter<S, A> {
    asProjection(): Projection<S, A>
  }
}

Lens.prototype.asProjection = function () {
  return new Projection(this.get)
}

Getter.prototype.asProjection = function () {
  return new Projection(this.get)
}
