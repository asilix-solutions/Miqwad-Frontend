/** Offline React/Router checks. No browser, live API or layout acceptance is implied. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { MemoryRouter, createMemoryRouter } = require("react-router-dom");
const { I18nextProvider } = require("react-i18next");
const i18n = require("i18next").createInstance();
const root = path.resolve(__dirname, "..");
let user = { role: "admin", permissions: ["orders.view"], fullName: "QA Administrator" };
const cache = new Map();
function load(relative) {
  let file = path.resolve(root, relative);
  if (!fs.existsSync(file)) file = [".ts", ".tsx"].map((ext) => file + ext).find(fs.existsSync);
  if (!file) throw new Error("Module missing: " + relative);
  if (file.endsWith(".css")) return {};
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const source = fs
    .readFileSync(file, "utf8")
    .replaceAll("import.meta.env", "({ DEV: false, PROD: true })");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const local = (name) => {
    if (name === "@app/store") return { useAppSelector: (fn) => fn({ auth: { user } }) };
    if (name === "@shared/config/mockMode") return { mockModeEnabled: false };
    if (name.endsWith("/useLogout"))
      return {
        useLogout: () => ({
          logout: () => {
            throw new Error("Unexpected logout");
          },
        }),
      };
    if (name.startsWith("@modules/")) return load("src/modules/" + name.slice(9));
    if (name.startsWith("@shared/")) return load("src/shared/" + name.slice(8));
    if (name.startsWith("@/")) return load("src/" + name.slice(2));
    if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name));
    return require(name);
  };
  new Function("require", "module", "exports", code)(local, module, module.exports);
  return module.exports;
}
const text = fs.readFileSync(path.join(root, "src/app/i18n.ts"), "utf8");
const ast = ts.createSourceFile("i18n.ts", text, ts.ScriptTarget.Latest, true);
const dictionaries = {};
const { towTruckAr, towTruckEn } = load("src/modules/tow-truck/i18n.ts");
for (const statement of ast.statements)
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      const name = declaration.name.getText(ast);
      if (name === "ar" || name === "en")
        dictionaries[name] = new Function(
          "towTruckAr",
          "towTruckEn",
          "return (" + declaration.initializer.getText(ast) + ")",
        )(towTruckAr, towTruckEn);
    }
  }
const { WorkspaceSwitcher } = load("src/modules/admin/components/layout/WorkspaceSwitcher.tsx");
const { AdminSidebar } = load("src/modules/admin/components/layout/AdminSidebar.tsx");
const { AdminLayout } = load("src/modules/admin/components/layout/AdminLayout.tsx");
const nav = load("src/modules/admin/config/workspaceNavigation.ts");
const workspace = load("src/modules/tow-truck/lib/towTruckWorkspace.ts");
function render(Component, entry, props = {}) {
  return renderToStaticMarkup(
    React.createElement(
      I18nextProvider,
      { i18n },
      React.createElement(
        MemoryRouter,
        { initialEntries: [entry] },
        React.createElement(Component, props),
      ),
    ),
  );
}
const links = (html) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: /href="([^"]+)"/.exec(m[1])?.[1].replaceAll("&amp;", "&"),
    current: /aria-current="([^"]+)"/.exec(m[1])?.[1],
    label: /aria-label="([^"]+)"/.exec(m[1])?.[1],
  }));
let count = 0;
function test(label, fn) {
  fn();
  count++;
  console.log("PASS " + label);
}
(async () => {
  await i18n.init({
    lng: "ar",
    fallbackLng: "en",
    resources: {
      ar: { translation: dictionaries.ar },
      en: { translation: dictionaries.en },
    },
    interpolation: { escapeValue: false },
  });
  for (const lang of ["ar", "en"]) {
    await i18n.changeLanguage(lang);
    for (const route of [
      "/admin/dashboard",
      "/admin/profile",
      "/admin/tow-truck",
      "/admin/tow-truck/intracity",
      "/admin/tow-truck/intercity",
      "/admin/tow-truck/8401",
      "/admin/tow-truck-other",
    ]) {
      test(lang + " workspace active destination at " + route, () => {
        const anchors = links(render(WorkspaceSwitcher, route));
        assert.equal(anchors.length, 2);
        const current = anchors.filter((a) => a.current);
        assert.equal(current.length, 1);
        assert.equal(
          current[0].href,
          nav.isTowTruckPath(route) ? "/admin/tow-truck" : "/admin/dashboard",
        );
        assert.deepEqual(
          anchors.map((a) => a.label),
          [dictionaries[lang].admin.workspaces.general, dictionaries[lang].admin.workspaces.tow],
        );
      });
    }
    for (const [route, active] of [
      ["/admin/tow-truck", "all"],
      ["/admin/tow-truck/intracity", "intracity"],
      ["/admin/tow-truck/intercity", "intercity"],
    ]) {
      test(lang + " sidebar routes preserve tracking and reset page at " + route, () => {
        const anchors = links(
          render(AdminSidebar, route + "?page=4&trackNumber=%20MQ-42%20&preview=84"),
        );
        assert.equal(anchors.length, 3);
        assert.deepEqual(
          anchors.map((a) => a.href),
          ["all", "intracity", "intercity"].map((w) =>
            workspace.buildWorkspaceNavigationUrl(w, "trackNumber=MQ-42"),
          ),
        );
        assert.equal(anchors.filter((a) => a.current).length, 1);
        assert.equal(
          anchors.find((a) => a.current).href,
          workspace.buildWorkspaceNavigationUrl(active, "trackNumber=MQ-42"),
        );
      });
    }
    test(lang + " detail keeps tow context without claiming current service", () => {
      const anchors = links(
        render(AdminSidebar, {
          pathname: "/admin/tow-truck/84",
          state: { fromQueue: "/admin/tow-truck/intercity?page=3&trackNumber=MQ-42" },
        }),
      );
      assert.equal(anchors.length, 3);
      assert.ok(anchors.every((a) => !a.current && a.href.includes("trackNumber=MQ-42")));
    });
    test(
      lang + " limited general sidebar preserves authorized links without duplicate tow entry",
      () => {
        const anchors = links(render(AdminSidebar, "/admin/dashboard"));
        assert.ok(anchors.some((a) => a.href === "/admin/dashboard"));
        assert.ok(anchors.some((a) => a.href === "/admin/orders"));
        assert.ok(!anchors.some((a) => /tow-truck|\/users/.test(a.href)));
      },
    );
    test(
      lang +
        " shared shell has one header, account trigger and closed Sheet does not duplicate links",
      () => {
        const html = render(AdminLayout, "/admin/tow-truck/intracity");
        assert.equal((html.match(/<header/g) || []).length, 1);
        assert.equal((html.match(/<aside/g) || []).length, 1);
        assert.equal(links(html).length, 5);
        assert.ok(html.includes("QA Administrator"));
        assert.ok(html.includes("admin-workspace-switcher"));
      },
    );
  }
  user = { role: "admin", permissions: ["users.view"], fullName: "Restricted" };
  test("explicit permission restriction removes tow switcher and service links", () => {
    assert.deepEqual(
      links(render(WorkspaceSwitcher, "/admin/dashboard")).map((a) => a.href),
      ["/admin/dashboard"],
    );
    assert.equal(links(render(AdminSidebar, "/admin/tow-truck")).length, 0);
    assert.ok(links(render(AdminSidebar, "/admin/users")).some((a) => a.href === "/admin/users"));
  });
  for (const role of ["provider", "customer", "driver"]) {
    user = { role, permissions: ["*"] };
    test(role + " cannot acquire admin workspace links from wildcard permission", () =>
      assert.equal(links(render(WorkspaceSwitcher, "/admin/dashboard")).length, 0),
    );
  }
  user = null;
  test("anonymous receives no workspace links", () =>
    assert.equal(links(render(WorkspaceSwitcher, "/admin/dashboard")).length, 0));
  user = { role: "super_admin", permissions: ["*"] };
  test("super administrator sees both workspaces", () =>
    assert.equal(links(render(WorkspaceSwitcher, "/admin/dashboard")).length, 2));
  for (const fromQueue of [
    "https://bad.invalid/admin/tow-truck?trackNumber=secret",
    "//bad.invalid/admin/tow-truck?trackNumber=secret",
    "/admin/users?trackNumber=secret",
    "/admin/tow-truck-other?trackNumber=secret",
    42,
    null,
  ])
    test("reject unrelated return context " + fromQueue, () =>
      assert.equal(nav.queueNavigationSearch("/admin/tow-truck/84", "", { fromQueue }), ""),
    );
  test("legacy query-only return state keeps supported tracking", () =>
    assert.equal(
      workspace.buildWorkspaceNavigationUrl(
        "all",
        nav.queueNavigationSearch("/admin/tow-truck/84", "", {
          fromQueue: "?page=2&trackNumber=old",
        }),
      ),
      "/admin/tow-truck?trackNumber=old",
    ));
  for (const pathname of [
    "/admin/tow-truck-other",
    "/another/admin/tow-truck",
    "/admin/users/tow-truck",
  ])
    test("exact workspace boundary excludes " + pathname, () =>
      assert.equal(nav.isTowTruckPath(pathname), false),
    );

  // Exercise the existing, unchanged order page predicate in the real data router.
  // This tests navigation blocking, not a browser dialog or backend outcome.
  const orderSource = fs.readFileSync(
    path.join(root, "src/modules/tow-truck/pages/TowTruckOrderWorkspacePage.tsx"),
    "utf8",
  );
  const predicateSource = orderSource
    .split("const blocker = useBlocker(")[1]
    .split("\n  );")[0]
    .trim()
    .replace(/,$/, "");
  for (const [dirty, busy] of [
    [true, false],
    [false, true],
    [false, false],
  ]) {
    for (const destination of [
      "/admin/dashboard",
      "/admin/tow-truck",
      "/admin/tow-truck/intercity",
    ]) {
      const router = createMemoryRouter([{ path: "*", element: null }], {
        initialEntries: ["/admin/tow-truck/84"],
      });
      router.getBlocker(
        "test",
        new Function("dirty", "busy", "return (" + predicateSource + ")")(dirty, busy),
      );
      await router.navigate(destination);
      test(`existing blocker dirty=${dirty} busy=${busy} to ${destination}`, () => {
        assert.equal(
          router.state.location.pathname,
          dirty || busy ? "/admin/tow-truck/84" : destination,
        );
        if (dirty || busy) {
          assert.equal(router.state.blockers.get("test").state, "blocked");
          router.state.blockers.get("test").reset();
          assert.equal(router.state.location.pathname, "/admin/tow-truck/84");
        }
      });
      router.dispose();
    }
  }
  const router = createMemoryRouter([{ path: "*", element: null }], {
    initialEntries: ["/admin/dashboard"],
  });
  await router.navigate("/admin/tow-truck/intercity?trackNumber=MQ");
  await router.navigate("/admin/dashboard");
  await router.navigate(-1);
  test("router back restores service and query", () => {
    assert.equal(router.state.location.pathname, "/admin/tow-truck/intercity");
    assert.equal(router.state.location.search, "?trackNumber=MQ");
  });
  await router.navigate(1);
  test("router forward returns general workspace", () =>
    assert.equal(router.state.location.pathname, "/admin/dashboard"));
  router.dispose();
  console.log(
    `${count} offline navigation checks passed. Browser layout, focus, Sheet interaction and live network remain pending.`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
