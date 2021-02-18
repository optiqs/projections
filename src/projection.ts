import {flow, FunctionN, pipe} from 'fp-ts/lib/function'
import {Lens, Getter} from 'monocle-ts'

declare module 'monocle-ts' {
  interface Lens<S, A> {
    asProjection(): Projection<S, A>
  }
  interface Getter<S, A> {
    asProjection(): Projection<S, A>
  }
}

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

type GetterFunction<S, A> = (s: S) => A
interface Gettable<S, A> {
  get: GetterFunction<S, A>
}

export class Projection<S, A> {
  private readonly getter: Getter<S, A>

  private readonly composeGetter: <B>(ab: Getter<A, B>) => Getter<S, B>

  constructor(getter: GetterFunction<S, A>)
  constructor(getter: Getter<S, A>)
  constructor(getter: GetterFunction<S, A> | Getter<S, A>) {
    this.getter = getter instanceof Getter ? getter : new Getter(getter)
    this.composeGetter = this.getter.compose.bind(this.getter)

    this.compose = this.compose.bind(this)
    this.composeLens = this.composeLens.bind(this)
    this.combineLens = this.combineLens.bind(this)
    this.combine = this.combine.bind(this)
    this.map = this.map.bind(this)
    this.get = this.get.bind(this)
    this.asGetter = this.asGetter.bind(this)
  }

  public asGetter(): Getter<S, A> {
    return this.getter
  }

  public compose<B>(sb: Projection<A, B>): Projection<S, B> {
    return pipe(sb.getter, this.composeGetter, Projection.fromGetter)
  }

  public composeLens<B>(sb: Lens<A, B>): Projection<S, B> {
    return pipe(sb, Projection.fromLens, this.compose)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args = Array.isArray(sb) ? sb.map(Projection.fromLens) : (Projection.fromLens(sb) as any)
    return this.combine(args, f)
  }

  public combine<B, R>(sb: Projection<S, B>, f: FunctionN<[A, B], R>): Projection<S, R>
  public combine<B, C, R>(
    ss: [Projection<S, B>, Projection<S, C>],
    f: FunctionN<[A, B, C], R>
  ): Projection<S, R>
  public combine<B, C, D, R>(
    ss: [Projection<S, B>, Projection<S, C>, Projection<S, D>],
    f: FunctionN<[A, B, C, D], R>
  ): Projection<S, R>
  public combine<B, C, D, E, R>(
    ss: [Projection<S, B>, Projection<S, C>, Projection<S, D>, Projection<S, E>],
    f: FunctionN<[A, B, C, D, E], R>
  ): Projection<S, R>
  public combine<B, C, D, E, F, R>(
    ss: [Projection<S, B>, Projection<S, C>, Projection<S, D>, Projection<S, E>, Projection<S, F>],
    f: FunctionN<[A, B, C, D, E, F], R>
  ): Projection<S, R>
  public combine<B, C, D, E, F, G, R>(
    ss: [
      Projection<S, B>,
      Projection<S, C>,
      Projection<S, D>,
      Projection<S, E>,
      Projection<S, F>,
      Projection<S, G>
    ],
    f: FunctionN<[A, B, C, D, E, F, G], R>
  ): Projection<S, R>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public combine<R>(ss: any, f: any): Projection<S, R> {
    const ps = Array.isArray(ss) ? [this, ...ss] : [this, ss]
    return Projection.mapN(ps as [Projection<S, unknown>], f)
  }

  public map<B>(f: (a: A) => B): Projection<S, B> {
    return Projection.map(this, f)
  }

  public get(s: S): A {
    return this.getter.get(s)
  }

  public static of<S, A>(getter: GetterFunction<S, A>): Projection<S, A> {
    return new Projection(getter)
  }

  /**
   * Creates a projection from anything that has an appropriate `get` method
   */
  public static from<S, A>(gettable: Gettable<S, A>): Projection<S, A> {
    return Projection.of(gettable.get)
  }

  public static fromLens<S, A>(lens: Lens<S, A>): Projection<S, A> {
    return new Projection(lens.asGetter())
  }

  public static fromGetter<S, A>(getter: Getter<S, A>): Projection<S, A> {
    return new Projection(getter)
  }

  public static map<S, A, B>(sa: Projection<S, A>, f: (a: A) => B): Projection<S, B> {
    return Projection.mapN<S, A, B>([sa], f)
  }

  public static map2<S, A, B, R>(
    ss: [Projection<S, A>, Projection<S, B>],
    f: FunctionN<[A, B], R>
  ): Projection<S, R> {
    return Projection.mapN<S, A, B, R>(ss, f)
  }

  public static mapN<S, A, R>(ss: [Projection<S, A>], f: FunctionN<[A], R>): Projection<S, R>
  public static mapN<S, A, B, R>(
    ss: [Projection<S, A>, Projection<S, B>],
    f: FunctionN<[A, B], R>
  ): Projection<S, R>
  public static mapN<S, A, B, C, R>(
    ss: [Projection<S, A>, Projection<S, B>, Projection<S, C>],
    f: FunctionN<[A, B, C], R>
  ): Projection<S, R>
  public static mapN<S, A, B, C, D, R>(
    ss: [Projection<S, A>, Projection<S, B>, Projection<S, C>, Projection<S, D>],
    f: FunctionN<[A, B, C, D], R>
  ): Projection<S, R>
  public static mapN<S, A, B, C, D, E, R>(
    ss: [Projection<S, A>, Projection<S, B>, Projection<S, C>, Projection<S, D>, Projection<S, E>],
    f: FunctionN<[A, B, C, D, E], R>
  ): Projection<S, R>
  public static mapN<S, A, B, C, D, E, F, R>(
    ss: [
      Projection<S, A>,
      Projection<S, B>,
      Projection<S, C>,
      Projection<S, D>,
      Projection<S, E>,
      Projection<S, F>
    ],
    f: FunctionN<[A, B, C, D, E, F], R>
  ): Projection<S, R>
  public static mapN<S, A, B, C, D, E, F, G, R>(
    ss: [
      Projection<S, A>,
      Projection<S, B>,
      Projection<S, C>,
      Projection<S, D>,
      Projection<S, E>,
      Projection<S, F>,
      Projection<S, G>
    ],
    f: FunctionN<[A, B, C, D, E, F, G], R>
  ): Projection<S, R>
  public static mapN<S, R>(
    ss: readonly Projection<S, unknown>[],
    f: (...args: unknown[]) => R
  ): Projection<S, R> {
    return Projection.of(
      flow(
        s => ss.map(p => p.get(s)),
        p => f(...p)
      )
    )
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
}

Lens.prototype.asProjection = function () {
  return new Projection(this.get)
}

Getter.prototype.asProjection = function () {
  return new Projection(this)
}
