// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EqualityFn = (newArgs: any[], lastArgs: any[]) => boolean
// Safe to use `any` as the type will narrow correctly when used
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MemoizeFn = <Fn extends (this: any, ...newArgs: any[]) => ReturnType<Fn>>(fn: Fn) => Fn
const isEqual = (first: unknown, second: unknown): boolean => {
  if (first === second) {
    return true
  }
  if (Number.isNaN(first) && Number.isNaN(second)) {
    return true
  }
  return false
}
const areInputsEqual = (newInputs: readonly unknown[], lastInputs: readonly unknown[]): boolean => {
  if (newInputs.length !== lastInputs.length) {
    return false
  }
  for (let i = 0; i < newInputs.length; i++) {
    if (!isEqual(newInputs[i], lastInputs[i])) {
      return false
    }
  }
  return true
}
/**
 * Memoizes a function but only stores the latest result
 * @param fn Function to memoize
 * @returns A memoized version of `fn`
 */
export const memoizeOnce: MemoizeFn = fn => {
  type Fn = typeof fn
  let lastThis: unknown
  let lastArgs: unknown[] = []
  let lastResult: ReturnType<Fn>
  let calledOnce = false
  function memoized(this: unknown, ...newArgs: unknown[]): ReturnType<Fn> {
    if (calledOnce && lastThis === this && areInputsEqual(newArgs, lastArgs)) {
      return lastResult
    }
    lastResult = fn.apply(this, newArgs)
    calledOnce = true
    lastThis = this
    lastArgs = newArgs
    return lastResult
  }
  return memoized as Fn
}
