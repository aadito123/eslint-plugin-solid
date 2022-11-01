import { AST_NODE_TYPES as T } from "@typescript-eslint/utils";
import { run } from "../ruleTester";
import rule from "../../src/rules/no-proxy-apis";

// Don't bother checking for imports for every test
jest.mock("../../src/utils", () => {
  return {
    ...jest.requireActual("../../src/utils"),
    trackImports: () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const handleImportDeclaration = () => {};
      const matchImport = (imports: string | Array<string>, str: string) => {
        const importArr = Array.isArray(imports) ? imports : [imports];
        return importArr.find((i) => i === str);
      };
      return { matchImport, handleImportDeclaration };
    },
  };
});

export const cases = run("no-proxy-apis", rule, {
  valid: [
    `let merged = mergeProps({}, props);`,
    `const obj = {}; let merged = mergeProps(obj, props);`,
    `let obj = {}; let merged = mergeProps(obj, props);`,
    `let merged = mergeProps({ get asdf() { signal() } }, props);`,
    `let el = <div {...{ asdf: 'asdf' }} />`,
    `let el = <div {...asdf} />`,
    `let obj = { Proxy: 1 }`,
  ],
  invalid: [
    {
      code: `let proxy = new Proxy(asdf, {});`,
      errors: [{ messageId: "proxyLiteral" }],
    },
    {
      code: `let proxy = Proxy.revocable(asdf, {});`,
      errors: [{ messageId: "proxyLiteral" }],
    },
    {
      code: `import {} from 'solid-js/store';`,
      errors: [{ messageId: "noStore", type: T.ImportDeclaration }],
    },
    {
      code: `let el = <div {...maybeSignal()} />`,
      errors: [{ messageId: "spreadCall" }],
    },
    {
      code: `let el = <div {...{ ...maybeSignal() }} />`,
      errors: [{ messageId: "spreadCall" }],
    },
    {
      code: `let el = <div {...maybeProps.foo} />`,
      errors: [{ messageId: "spreadMember" }],
    },
    {
      code: `let el = <div {...{ ...maybeProps.foo }} />`,
      errors: [{ messageId: "spreadMember" }],
    },
    {
      code: `let merged = mergeProps(maybeSignal)`,
      errors: [{ messageId: "mergeProps" }],
    },
    {
      code: `let func = () => ({}); let merged = mergeProps(func, props)`,
      errors: [{ messageId: "mergeProps" }],
    },
  ],
});
