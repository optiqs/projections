# Projections

Projections is a thin abstraction, inspired by [reselect](https://github.com/reduxjs/reselect) and [monocle-ts], designed to solve a set of problems regarding the manipulation of large and nested objects such as Redux stores.

- [Projections](#projections)
  - [Use case](#use-case)
  - [Documentation](#documentation)
    - [Creating Projections](#creating-projections)
    - [Mapping](#mapping)
    - [Combining multiple projections](#combining-multiple-projections)
  - [Memoization](#memoization)
    - [Enabled by default](#enabled-by-default)
    - [With a custom memoize function](#with-a-custom-memoize-function)
    - [Other memoization options](#other-memoization-options)

## Use case

While Lenses solve problems regarding basic CRUD operations on data objects, Projections are read-only views into the data, allowing for transformation (`map`) and merging (`combine`) of projections and lenses.

![Image of data transformation through Lenses and Projections](docs/lenses-example.png)

The main struggle that this project aspires to resolve is the verbosity required by Redux. Redux is simple and yet a robust solution for state management. When reducers are just anemic CRUD operations, it minimizes data indirection and increases maintainability of the app.

![A summarized version of the Redux data flow](docs/redux.png)

[Lenses][monocle-ts] are viable alternative to catalyze the Redux by removing verbosity, allowing the write operations to the state to handled by [a single reducer](https://github.com/optiqs/optiqs).

Furthermore, Lenses play a fair share part in the selectors space. The same lenses created for modification of state can be used to read data(`get`). However, lenses may not suffice all requirements related to the read operations.

Operations that combine different parts of the store(`combine`) and different modifications of its shape(`map`) are quite common. Besides, some transformation can be computational expensive and especially when run repeatedly, they can become bottlenecks.
Projections solve both of these problems:

1. They are **memoized** by default; and
2. They can combine(merge) multiple projections or lenses into new projections

## Documentation

Given the following sample type definitions:

```ts
// Given this structure
type A = {foo: string}
type B = {bar: number}
type C = {baz: Date}
type S = {a: A; b: B; c: C}
```

### Creating Projections

You can create projections directly:

```ts
const p1: Projection<S, A> = Projection.fromProp<S>()('a')
const p2: Projection<S, B> = Projection.fromProp<S>()('b')
```

Or you can create them from a `Lens` (or anything else with a matching `get` method):

```ts
import {Lens, lens} from 'monocle-ts'
import {pipe} from 'fp-ts/function'

const lens1 = Lens.fromProp<S>()('a')
const lens2 = pipe(lens.id<S>(), lens.prop('b'))
const custom = {
  get: (s: S) => s.c
}

const p1: Projection<S, A> = Projection.from(lens1)
const p2: Projection<S, B> = Projection.from(lens2)
const p3: Projection<S, C> = Projection.from(custom)
```

Or you can create them directly from a function:

```ts
const p1: Projection<S, A> = Projection.of((s: S) => s.a)
const p2: Projection<S, B> = Projection.of((s: S) => s.b)
```

### Mapping

You can directly map a projection to create a new projection

```ts
const pFoo: Projection<S, string> = p1.map(a => a.foo)
```

Or you can combine projections to map the resulting values together into a new projection

```ts
const combined: Projection<S, {c: string}> = p1.combine(p2, (a, b) => ({
  c: `${a.foo}-${b.bar}`
}))
```

### Combining multiple projections

You can combine an arbitrary number of projections together to create new projections.

```ts
const combined = Projection.mapN([p1, p2, p3], (a, b, c) => ({
  c: `${a.foo}-${b.bar}-${c.baz}`
}))

// Or
const combined = p1.combine([p2, p3], (a, b, c) => ({
  c: `${a.foo}-${b.bar}-${c.baz}`
}))
```

If you prefer using the `fp-ts`-based `pipe` approach, you can also do the following _(Note: using `as const` or Projection.createTuple is required in this approach due to type widening)_:

```ts
const combined = pipe(
  [p1, p2] as const,
  Projection.mapF((a, b) => ({c: `${a.foo}-${b.bar}`}))
)

// Or
const combined = pipe(
  Projection.createTuple(p1, p2),
  Projection.mapF((a, b) => ({c: `${a.foo}-${b.bar}`}))
)
```

## Memoization

### Enabled by default

Memoization is enabled by default. The default implementation has a cache size of 1, based on referential equality. This means that only the last result is stored.

For example, if you have the following projection:

```ts
import {S, A} from './my-types'

declare function expensiveComputation(s: S): A
declare const state: S

const p = Projection.from(expensiveComputation)
const a = p.get(state)
const b = p.get(state)
const c = p.get(state)
const d = p.get({...state})
```

Calling `p.get(state)` multiple times will not recalculate the value if `state` is the same reference, so `a`, `b`, and `c` above will all be the references to the exact same object.

However, while `p.get({...state})` will evaluate to the same value, since the argument is a different reference, the value of `d` will be recalculated and not be the same reference as `a`, `b`, and `c`.

This implementation works similarly to how memoization in [react](https://reactjs.org/docs/react-api.html#reactmemo) works. This approach helps avoid creating an ever-growing cache of inputs to outputs.

### With a custom memoize function

If the default approach is insufficient for your needs (for example if you _really_ need to only calculate the projection map _one time_ per input), you may provide a custom memoization function as well.

```ts
Projection.customMemoization(myMemoizationFunction)
```

### Other memoization options

If that still doesn't suit your needs, you can always use another existing memoization solution directly (e.g. [lodash's memoize function](https://docs-lodash.com/v4/memoize/)):

```ts
import {memoize} from 'lodash'
import {State, A} from './my-types'

declare function expensiveComputation(s: S): A

const p = Projection.from(memoize(expensiveComputation))
```

[monocle-ts]: https://github.com/gcanti/monocle-ts
