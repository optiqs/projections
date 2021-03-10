import {flow, FunctionN, identity, pipe} from 'fp-ts/lib/function'
import {Lens, Getter} from 'monocle-ts'
import lodashMemoize from 'lodash/memoize'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CacheResolver<S = any> = (s: S) => any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MemoizeFunction = <T extends (...args: any) => any>(func: T, resolver?: CacheResolver) => T

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MapResolvers<S, Args extends any[] = any[]> {
  memoizeResolver?: CacheResolver<S>
  mapResolver?: (...args: Args) => unknown
}

let memoize: MemoizeFunction = identity

export type GettableTuple<S, Tuple extends TupleType> = {
  readonly [Index in keyof Tuple]: Gettable<S, Tuple[Index]>
} & {
  readonly length: Tuple['length']
}
export class Projection<S, A> implements Gettable<S, A> {
  private readonly getter: Getter<S, A>

  private readonly composeGetter: <B>(ab: Getter<A, B>) => Getter<S, B>

  private _memoize: MemoizeFunction

  constructor(getter: GetterFunction<S, A>)
  constructor(getter: Getter<S, A>)
  constructor(getter: GetterFunction<S, A> | Getter<S, A>) {
    this._memoize = memoize
    this.getter = getter instanceof Getter ? getter : new Getter(getter)
    this.composeGetter = this._memoize(this.getter.compose.bind(this.getter))

    this.compose = this.compose.bind(this)
    this.composeLens = this.composeLens.bind(this)
    this.combineLens = this._memoize(this.combineLens.bind(this))
    this.combine = this._memoize(this.combine.bind(this))
    this.map = this._memoize(this.map.bind(this))
    this.get = this._memoize(this.get.bind(this))
    this.asGetter = this.asGetter.bind(this)
  }

  public asGetter(): Getter<S, A> {
    return this.getter
  }

  public compose<B>(sb: Gettable<A, B>): Projection<S, B> {
    const getter = Projection.from(sb).getter
    return pipe(getter, this.composeGetter, Projection.fromGetter)
  }
  /**@deprecated */
  public composeLens<B>(sb: Lens<A, B>): Projection<S, B> {
    return this.compose(sb)
  }

  /**@deprecated Use `combine` instead */
  public combineLens<B, R>(sb: Lens<S, B>, f: FunctionN<[A, B], R>): Projection<S, R>

  /**@deprecated Use `combine` instead */
  public combineLens<B, C, R>(
    ss: [Lens<S, B>, Lens<S, C>],
    f: FunctionN<[A, B, C], R>
  ): Projection<S, R>

  /**@deprecated Use `combine` instead */
  public combineLens<B, C, D, R>(
    ss: [Lens<S, B>, Lens<S, C>, Lens<S, D>],
    f: FunctionN<[A, B, C, D], R>
  ): Projection<S, R>

  /**@deprecated Use `combine` instead */
  public combineLens<B, C, D, E, R>(
    ss: [Lens<S, B>, Lens<S, C>, Lens<S, D>, Lens<S, E>],
    f: FunctionN<[A, B, C, D, E], R>
  ): Projection<S, R>

  /**@deprecated Use `combine` instead */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public combineLens<R>(sb: any, f: any): Projection<S, R> {
    return this.combine(sb, f)
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */

  /**
   * Combine one or more projection-like objects with the provided mapping function.
   *
   * To get type inference working properly, you may need to use `as const`
   * @example
   * declare const p1 : Projection<S,A>
   * declare const p2 : { get: (s: S) => B }
   * declare const p3 : Lens<S, A>
   * const combined = p1.combine([p2, p3], (a, b, c) => ({
   *   d: `${a.foo}-${b.bar}-${c.baz}`
   * }))
   */
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
  public combine<B, T extends TupleType, R>(
    ss: GettableTuple<S, [B, ...T]>,
    f: FunctionN<[A, B, ...T], R>
  ): Projection<S, R>
  public combine<B, R>(ss: Gettable<S, B>, f: FunctionN<[A, B], R>): Projection<S, R>
  public combine<T extends TupleType, R>(ss: any, f: any): Projection<S, R> {
    const ps: GettableTuple<S, [A, ...T]> = Array.isArray(ss) ? [this, ...ss] : ([this, ss] as any)

    return Projection.mapN(ps, f)
  }

  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
  public map<B>(f: (a: A) => B): Projection<S, B> {
    return Projection.map(this, f)
  }

  public get(s: S): A {
    return this.getter.get(s)
  }

  public static isMemoized(): boolean {
    return 'Cache' in memoize
  }

  public static memoizeByDefault(value = true): void {
    if (value) {
      memoize = lodashMemoize
    } else {
      memoize = identity
    }
  }

  public static of<S, A>(
    getter: GetterFunction<S, A>,
    memoizeResolver?: CacheResolver<S>
  ): Projection<S, A> {
    return new Projection(memoize(getter, memoizeResolver))
  }

  /**
   * Creates a projection from anything that has an appropriate `get` method.
   * If the provided argument is already a projection, that same instance is returned.
   */
  public static from<S, A>(
    gettable: Gettable<S, A>,
    memoizeResolver?: CacheResolver<S>
  ): Projection<S, A> {
    if (gettable instanceof Projection) {
      return gettable
    }

    return Projection.of(gettable.get, memoizeResolver)
  }

  /** @deprecated Use `Projection.from` instead */
  public static fromLens<S, A>(lens: Lens<S, A>): Projection<S, A> {
    return Projection.from(lens)
  }

  public static fromGetter<S, A>(getter: Getter<S, A>): Projection<S, A> {
    return new Projection(getter)
  }

  public static map<S, A, B>(
    sa: Gettable<S, A>,
    f: (a: A) => B,
    resolvers?: MapResolvers<S, [A]>
  ): Projection<S, B> {
    return Projection.mapN([sa], f, resolvers)
  }

  /**@deprecated Use `mapN` instead*/
  public static map2<S, A, B, R>(
    ss: [Gettable<S, A>, Gettable<S, B>],
    f: FunctionN<[A, B], R>,
    resolvers?: MapResolvers<S, [A, B]>
  ): Projection<S, R> {
    return Projection.mapN(ss, f, resolvers)
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
    f: FunctionN<[A, ...T], R>,
    {memoizeResolver, mapResolver}: MapResolvers<S> = {}
  ): Projection<S, R> {
    return Projection.of(
      flow(
        s => projections.map(p => p.get(s)) as [A, ...T],
        memoize(p => f(...p), mapResolver)
      ),
      memoizeResolver
    )
  }

  /**
   * Same as `mapN`, but in a format that can be piped.
   * To get type inference working properly, you may need to use `as const` or Projection.createTuple
   * @example
   * const combined = pipe(
   *   [p1, p2, p3] as const,
   *   Projection.mapF((a, b, c) => ({
   *     d: `${a.value}-${b.type}-${c.foo}`
   *   }))
   * )
   * // Or:
   * const combined = pipe(
   *   Projection.createTuple(p1, p2, p3),
   *   Projection.pipeMap((a, b, c) => ({
   *     d: `${a.value}-${b.type}-${c.foo}`
   *   }))
   * )
   */
  public static mapF<A, T extends TupleType, R>(f: FunctionN<[A, ...T], R>) {
    return <S>(projections: GettableTuple<S, [A, ...T]>): Projection<S, R> => {
      return Projection.mapN(projections, f)
    }
  }

  public static get<S, A>(p: Projection<S, A>, s: S): A {
    return p.get(s)
  }

  public static fromProp<S>() {
    return <P extends keyof S>(prop: P): Projection<S, S[P]> =>
      pipe(prop, Lens.fromProp<S>(), Projection.from)
  }

  public static fromProps<S>() {
    return <P extends keyof S>(props: P[]): Projection<S, {[K in P]: S[K]}> =>
      pipe(props, Lens.fromProps<S>(), Projection.from)
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
  return new Projection(this)
}
