import { Lens } from "monocle-ts";
import "./projection";

interface B {
  name: string;
}

interface C {
  age: number;
}

interface D {
  phone: string;
}

interface A {
  b: B;
  c: C;
  d: D;
}

const bLens = Lens.fromProp<A>()("b");
const cLens = Lens.fromProp<A>()("c");
const dLens = Lens.fromProp<A>()("d");

const p = bLens.asProjection().combineLens(cLens, (b, c) => ({
  name: `${b.name} modified`,
  age: c.age + 1
}));

const p2 = bLens.asProjection().combineLens([cLens, dLens], (b, c, d) => ({
  name: `${b.name} modified`,
  age: c.age + 1,
  phone: `(+55)${d.phone}`
}));

const p3 = bLens.asProjection().map(v => ({
  bob: v
}))

const a: A = {
  b: {
    name: "some name"
  },
  c: {
    age: 37
  },
  d: {
    phone: "123-123-1234"
  }
};

const m = p.get(a);
const m2 = p2.get(a);
const m3 = p3.get(a);

console.log(m);
console.log(m2);
console.log(m3);
