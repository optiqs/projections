import { Lens } from "monocle-ts";

declare module "monocle-ts" {
  interface Lens<S, A> {
    asProjection(): Projection<S, A>;
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
  ): Projection<S, S[K1][K2][K3][K4][K5]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3]
  >(
    path: [K1, K2, K3, K4]
  ): Projection<S, S[K1][K2][K3][K4]>;
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(
    path: [K1, K2, K3]
  ): Projection<S, S[K1][K2][K3]>;
  <K1 extends keyof S, K2 extends keyof S[K1]>(path: [K1, K2]): Projection<
    S,
    S[K1][K2]
  >;
  <K1 extends keyof S>(path: [K1]): Projection<S, S[K1]>;
}

export class Projection<S, A> {
  private lens: Lens<S, A>;

  static fromProp<S, P extends keyof S>(prop: P) {
    return Lens.fromProp<S>()(prop).asProjection();
  }

  static fromProps<S, P extends keyof S>(props: P[]) {
    return Lens.fromProps<S>()(props).asProjection();
  }

  static fromPath<S>() {
    return ((path: any) =>
      Lens.fromPath<S>()(path).asProjection()) as ProjectionFromPath<S>;
  }

  static fromNullableProp<S, A extends S[K], K extends keyof S>(
    k: K,
    defaultValue: A
  ) {
    return Lens.fromNullableProp<S>()(k, defaultValue).asProjection();
  }

  constructor(getter: (s: S) => A) {
    this.lens = new Lens(getter, () => s => s);
  }

  compose<B>(sb: Projection<A, B>): Projection<S, B> {
    return this.lens.compose(sb.lens).asProjection();
  }

  composeLens<B>(sb: Lens<A, B>): Projection<S, B> {
    return this.compose(sb.asProjection());
  }

  combine<B, R>(sb: Projection<S, B>, st: (a: A, b: B) => R): Projection<S, R>;
  combine<B, C, R>(
    ss: [Projection<S, B>, Projection<S, C>],
    st: (a: A, b: B, c: C) => R
  ): Projection<S, R>;
  combine<B, C, D, R>(
    ss: [Projection<S, B>, Projection<S, C>, Projection<S, D>],
    st: (a: A, b: B, c: C, d: D) => R
  ): Projection<S, R>;
  combine<B, C, D, E, R>(
    ss: [
      Projection<S, B>,
      Projection<S, C>,
      Projection<S, D>,
      Projection<S, E>
    ],
    st: (a: A, b: B, c: C, d: D, e: E) => R
  ): Projection<S, R>;
  combine(sb: any, st: any) {
    return new Projection((s: S) => {
      const args = Array.isArray(sb) ? sb.map(sbv => sbv.get(s)) : sb.get(s);
      return st(this.lens.get(s), ...args);
    });
  }

  combineLens<B, R>(sb: Lens<S, B>, st: (a: A, b: B) => R): Projection<S, R>;
  combineLens<B, C, R>(
    ss: [Lens<S, B>, Lens<S, C>],
    st: (a: A, b: B, c: C) => R
  ): Projection<S, R>;
  combineLens<B, C, D, R>(
    ss: [Lens<S, B>, Lens<S, C>, Lens<S, D>],
    st: (a: A, b: B, c: C, d: D) => R
  ): Projection<S, R>;
  combineLens<B, C, D, E, R>(
    ss: [Lens<S, B>, Lens<S, C>, Lens<S, D>, Lens<S, E>],
    st: (a: A, b: B, c: C, d: D, e: E) => R
  ): Projection<S, R>;
  combineLens(sb: any, st: any) {
    const args = Array.isArray(sb)
      ? sb.map(sbv => sbv.asProjection())
      : sb.asProjection();
    return this.combine(args, st);
  }

  get(s: S) {
    return this.lens.get(s);
  }
}

Lens.prototype.asProjection = function() {
  return new Projection(this.get);
};
