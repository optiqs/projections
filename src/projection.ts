import {flow} from 'fp-ts/lib/function'
import {Lens} from 'monocle-ts'

declare module 'monocle-ts' {
  interface Lens<S, A> {
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

export class Projection<S, A> {
  private readonly lens: Lens<S, A>

  constructor(getter: (s: S) => A) {
    const id: (_: S) => S = s => s
    const setter: () => typeof id = () => id
    this.lens = new Lens(getter, setter)
  }

  public compose<B>(sb: Projection<A, B>): Projection<S, B> {
    return this.lens.compose(sb.lens).asProjection()
  }

  public composeLens<B>(sb: Lens<A, B>): Projection<S, B> {
    return this.compose(sb.asProjection())
  }

  public combineLens<B, R>(sb: Lens<S, B>, f: (a: A, b: B) => R): Projection<S, R>
  public combineLens<B, C, R>(
    ss: [Lens<S, B>, Lens<S, C>],
    f: (a: A, b: B, c: C) => R
  ): Projection<S, R>
  public combineLens<B, C, D, R>(
    ss: [Lens<S, B>, Lens<S, C>, Lens<S, D>],
    f: (a: A, b: B, c: C, d: D) => R
  ): Projection<S, R>
  public combineLens<B, C, D, E, R>(
    ss: [Lens<S, B>, Lens<S, C>, Lens<S, D>, Lens<S, E>],
    f: (a: A, b: B, c: C, d: D, e: E) => R
  ): Projection<S, R>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public combineLens<R>(sb: any, f: any): Projection<S, R> {
    const args = Array.isArray(sb) ? sb.map(Projection.fromLens) : sb.asProjection()
    return this.combine(args, f)
  }

  public combine<B, R>(sb: Projection<S, B>, f: (a: A, b: B) => R): Projection<S, R>
  public combine<B, C, R>(
    ss: [Projection<S, B>, Projection<S, C>],
    f: (a: A, b: B, c: C) => R
  ): Projection<S, R>
  public combine<B, C, D, R>(
    ss: [Projection<S, B>, Projection<S, C>, Projection<S, D>],
    f: (a: A, b: B, c: C, d: D) => R
  ): Projection<S, R>
  public combine<B, C, D, E, R>(
    ss: [Projection<S, B>, Projection<S, C>, Projection<S, D>, Projection<S, E>],
    f: (a: A, b: B, c: C, d: D, e: E) => R
  ): Projection<S, R>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public combine<A, B, C, D, E, R>(ss: any, f: any): Projection<S, R> {
    const ps = Array.isArray(ss) ? [this, ...ss] : [this, ss]
    return Projection.mapN(ps as [Projection<S, unknown>], f)
  }

  public map<B>(f: (a: A) => B): Projection<S, B> {
    return Projection.map(this, f)
  }

  public get(s: S): A {
    return Projection.get(this, s)
  }

  public static of<S, A>(getter: (s: S) => A): Projection<S, A> {
    return new Projection(getter)
  }

  public static fromLens<S, A>(lens: Lens<S, A>) {
    return lens.asProjection()
  }

  public static map<S, A, B>(sa: Projection<S, A>, f: (a: A) => B): Projection<S, B> {
    return Projection.mapN<S, A, B, B>([sa], f)
  }

  public static map2<S, A, B, R>(
    ss: [Projection<S, A>, Projection<S, B>],
    f: (a: A, b: B) => R
  ): Projection<S, R> {
    return Projection.mapN<S, A, B, R>(ss, f)
  }

  public static mapN<S, A, B, R>(ss: [Projection<S, A>], f: (a: A) => R): Projection<S, R>
  public static mapN<S, A, B, R>(
    ss: [Projection<S, A>, Projection<S, B>],
    f: (a: A, b: B) => R
  ): Projection<S, R>
  public static mapN<S, A, B, C, R>(
    ss: [Projection<S, A>, Projection<S, B>, Projection<S, C>],
    f: (a: A, b: B, c: C) => R
  ): Projection<S, R>
  public static mapN<S, A, B, C, D, R>(
    ss: [Projection<S, A>, Projection<S, B>, Projection<S, C>, Projection<S, D>],
    f: (a: A, b: B, c: C, d: D) => R
  ): Projection<S, R>
  public static mapN<S, A, B, C, D, E, R>(
    ss: [Projection<S, A>, Projection<S, B>, Projection<S, C>, Projection<S, D>, Projection<S, E>],
    f: (a: A, b: B, c: C, d: D, e: E) => R
  ): Projection<S, R>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static mapN<S, R>(ss: any, f: any): Projection<S, R> {
    return Projection.of(
      flow(
        s => ss.map((p: Projection<S, unknown>) => p.get(s)),
        p => f(...p)
      )
    )
  }

  public static get<S, A>(p: Projection<S, A>, s: S): A {
    return p.lens.get(s)
  }

  public static fromProp<S>() {
    return <P extends keyof S>(prop: P) => Lens.fromProp<S>()(prop).asProjection()
  }

  public static fromProps<S>() {
    return <P extends keyof S>(props: P[]) => Lens.fromProps<S>()(props).asProjection()
  }

  public static fromPath<S>() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((path: any) => Lens.fromPath<S>()(path).asProjection()) as ProjectionFromPath<S>
  }

  public static fromNullableProp<S>() {
    return <A extends S[K], K extends keyof S>(k: K, defaultValue: A) =>
      Lens.fromNullableProp<S>()(k, defaultValue).asProjection()
  }
}

Lens.prototype.asProjection = function() {
  return new Projection(this.get)
}
