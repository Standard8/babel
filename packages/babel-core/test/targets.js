import { loadOptions as loadOptionsOrig } from "../lib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const cwd = dirname(fileURLToPath(import.meta.url));

function loadOptions(opts) {
  return loadOptionsOrig({ cwd, ...opts });
}

function withTargets(targets) {
  return loadOptions({ targets });
}

describe("targets", () => {
  it("throws if invalid type", () => {
    expect(() => withTargets(2)).toThrow(
      ".targets must be a string, an array of strings or an object",
    );

    expect(() => withTargets([2])).toThrow(
      ".targets must be a string, an array of strings or an object",
    );

    expect(() => withTargets([{}])).toThrow(
      ".targets must be a string, an array of strings or an object",
    );

    expect(() => withTargets([])).not.toThrow();
    expect(() => withTargets({})).not.toThrow();
  });

  it("throws if invalid target", () => {
    expect(() => withTargets({ uglify: "2.3" })).toThrow(
      /\.targets\["uglify"\] is not a valid target/,
    );

    expect(() => withTargets({ foo: "bar" })).toThrow(
      /\.targets\["foo"\] is not a valid target/,
    );

    expect(() => withTargets({ firefox: 71 })).not.toThrow();
  });

  it("throws if invalid version", () => {
    expect(() => withTargets({ node: 10.1 /* or 10.10? */ })).toThrow(
      `.targets["node"] must be a string or an integer number`,
    );

    expect(() => withTargets({ node: true })).toThrow(
      `.targets["node"] must be a string or an integer number`,
    );

    expect(() => withTargets({ node: "10.1" })).not.toThrow();

    expect(() => withTargets({ node: "current" })).not.toThrow();
  });

  it("esmodules", () => {
    expect(() => withTargets({ esmodules: "7" })).toThrow(
      `.targets["esmodules"] must be a boolean, or undefined`,
    );

    expect(() => withTargets({ esmodules: false })).not.toThrow();
    expect(() => withTargets({ esmodules: true })).not.toThrow();
  });

  it("browsers", () => {
    expect(() => withTargets({ browsers: 2 })).toThrow(
      `.targets["browsers"] must be undefined, a string or an array of strings`,
    );

    expect(() => withTargets({ browsers: [2] })).toThrow(
      `.targets["browsers"] must be undefined, a string or an array of strings`,
    );

    expect(() => withTargets({ browsers: {} })).toThrow(
      `.targets["browsers"] must be undefined, a string or an array of strings`,
    );

    expect(() => withTargets({ browsers: [] })).not.toThrow();
  });
});

describe("browserslist", () => {
  it("loads .browserslistrc by default", () => {
    expect(
      loadOptions({
        cwd: join(cwd, "fixtures", "targets"),
      }).targets,
    ).toEqual({ chrome: "80.0.0" });
  });

  it("loads .browserslistrc relative to the root", () => {
    expect(
      loadOptions({
        cwd: join(cwd, "fixtures", "targets"),
        filename: "./node_modules/dep/test.js",
      }).targets,
    ).toEqual({ chrome: "80.0.0" });
  });

  // TODO: browserslistConfig is currently resolved starting from the root
  // rather than from the config file.
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("loads nested .browserslistrc files if explicitly specified", () => {
    expect(
      loadOptions({
        cwd: join(cwd, "fixtures", "targets"),
        filename: "./node_modules/dep/test.js",
        babelrcRoots: ["./node_modules/dep/"],
      }).targets,
    ).toEqual({ edge: "14.0.0" });
  });

  describe("browserslistConfigFile", () => {
    it("can disable config loading", () => {
      expect(
        loadOptions({
          cwd: join(cwd, "fixtures", "targets"),
          browserslistConfigFile: false,
        }).targets,
      ).toEqual({});
    });

    it("can specify a custom file", () => {
      expect(
        loadOptions({
          cwd: join(cwd, "fixtures", "targets"),
          browserslistConfigFile: "./.browserslistrc-firefox",
        }).targets,
      ).toEqual({ firefox: "74.0.0" });
    });

    it("is relative to the project root", () => {
      expect(
        loadOptions({
          cwd: join(cwd, "fixtures", "targets"),
          root: "..",
          filename: "./nested/test.js",
          browserslistConfigFile: "./targets/.browserslistrc-firefox",
        }).targets,
      ).toEqual({ firefox: "74.0.0" });
    });
  });

  describe("browserslistEnv", () => {
    it("is forwarded to browserslist", () => {
      expect(
        loadOptions({
          cwd: join(cwd, "fixtures", "targets"),
          browserslistEnv: "browserslist-loading-test",
        }).targets,
      ).toEqual({ chrome: "70.0.0" });
    });
  });

  it("esmodules and browsers are intersected", () => {
    expect(
      withTargets({
        esmodules: true,
        browsers: "chrome >= 80, firefox >= 30",
      }).targets,
    ).toEqual({ chrome: "80.0.0", firefox: "60.0.0" });
  });
});
