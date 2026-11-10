/** Offline source/React-handler and real memory-router checks; not browser accessibility acceptance. */
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const ts = require("typescript");
const { createMemoryRouter } = require("react-router-dom");
const root = path.resolve(__dirname, "..");
let location = { pathname: "/admin/tow-truck", search: "", state: null, key: "qa" };
let focused = 0,
  navigateCalls = [],
  effects = [],
  detailId;
let queue = {
  isPending: false,
  isPlaceholderData: false,
  isError: false,
  isFetching: false,
  data: { page: 1, totalPages: 1, items: [] },
  refetch() {},
};
let detail = { data: undefined, isPending: true, isFetching: true };
const runtime = {
  useRef: () => ({ current: { focus: () => focused++ } }),
  useState: (value) => [value, () => {}],
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
  useEffect: (fn) => effects.push(fn),
  useSyncExternalStore: (_s, get) => get(),
};
function load(relative) {
  const file = path.resolve(root, relative),
    module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const local = (name) => {
    if (name === "react") return runtime;
    if (name === "react/jsx-runtime") return require(name);
    if (name === "react-router-dom")
      return {
        Link: "Link",
        useLocation: () => location,
        useNavigate:
          () =>
          (...args) =>
            navigateCalls.push(args),
        useSearchParams: () => [new URLSearchParams(location.search), () => {}],
      };
    if (name === "react-i18next")
      return {
        useTranslation: () => ({ t: (key) => key, i18n: { language: "en", dir: () => "ltr" } }),
      };
    if (name === "radix-ui") return { Dialog: { Content: "DialogContent" } };
    if (name.endsWith("/queueContinuity"))
      return load("src/modules/tow-truck/lib/queueContinuity.ts");
    if (name.endsWith("/towTruckWorkspace"))
      return load("src/modules/tow-truck/lib/towTruckWorkspace.ts");
    if (name.endsWith("/useTowTruckQueries"))
      return {
        TOW_PAGE_SIZE: 20,
        useTowTruckQueue: () => queue,
        useTowTruckDetail: (id) => {
          detailId = id;
          return detail;
        },
      };
    if (name === "@app/store") return { useAppSelector: (fn) => fn({ auth: { user: null } }) };
    if (name === "@tanstack/react-query")
      return { useQueryClient: () => ({ getQueryCache: () => ({ subscribe: () => () => {} }) }) };
    if (name.endsWith("/towTruckDate"))
      return {
        formatTowTruckSyncTime: () => null,
        formatTowTruckOrderDate: () => ({ valid: false }),
      };
    if (name.endsWith("/modelLocalization")) return { isArabicLanguage: () => false };
    if (name.endsWith("/orderEnums")) return { orderStatusToI18nKey: () => "status" };
    if (name.endsWith("/previewPresentation"))
      return { previewRestrictions: () => [], previewLocations: () => [] };
    if (name.endsWith("/reassignment")) return { readRemovalEvidence: () => null };
    if (name.endsWith("/driverOperationGuards"))
      return { driverOperationBlocks: () => false, initialOperationBlocks: () => false };
    if (name.endsWith("/cancellationJournal")) return { cancellationBlocks: () => false };
    if (name.endsWith("/dispatchModel")) return { nextActionMessage: () => "review" };
    return new Proxy({}, { get: (_target, key) => String(key) });
  };
  new Function("require", "module", "exports", code)(local, module, module.exports);
  return module.exports;
}
const helpers = load("src/modules/tow-truck/lib/queueContinuity.ts");
const Page = load("src/modules/tow-truck/pages/TowTruckOperationsPage.tsx").TowTruckOperationsPage;
const Drawer = load(
  "src/modules/tow-truck/components/TowTruckQuickPreviewDrawer.tsx",
).TowTruckQuickPreviewDrawer;
const Identity = load(
  "src/modules/tow-truck/components/TowTruckServiceIdentity.tsx",
).TowTruckServiceIdentity;
const nodes = (tree) =>
  Array.isArray(tree)
    ? tree.flatMap(nodes)
    : !tree || typeof tree !== "object"
      ? []
      : [tree, ...nodes(tree.props?.children)];
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
const context = {
  url: "/admin/tow-truck/intercity?page=3&trackNumber=MQ",
  orderId: "84",
  control: "preview",
  scrollY: 740,
};
global.window = {
  scrollY: 740,
  scrollTo: (value) => {
    global.lastScroll = value;
  },
};
(async () => {
  for (const bad of [
    "https://evil.invalid/admin/tow-truck",
    "//evil.invalid/admin/tow-truck",
    "/admin/users",
    "/admin/tow-truck/84",
    "/admin/tow-truck-other",
    "/admin/tow-truck/../users",
    "/admin/tow-truck%2fintercity",
    "/admin/tow-truck#preview",
    "\\admin\\tow-truck",
    null,
    5,
  ])
    test("reject unsafe return URL " + bad, () => assert.equal(helpers.safeQueueUrl(bad), null));
  for (const service of ["", "/intracity", "/intercity"])
    test("canonical context " + service, () => {
      assert.equal(
        helpers.safeQueueUrl(
          "/admin/tow-truck" +
            service +
            "?page=3&trackNumber=%20MQ%20&preview=84&orderId=85&secret=unused",
        ),
        "/admin/tow-truck" + service + "?page=3&trackNumber=MQ",
      );
    });
  test("legacy service and query-only links remain queue-local", () => {
    assert.equal(
      helpers.safeQueueUrl("?serviceType=intercity&page=2&preview=84"),
      "/admin/tow-truck/intercity?page=2",
    );
  });
  for (const page of ["-1", "0", "NaN", "Infinity", "9007199254740992"])
    test("invalid page normalized " + page, () =>
      assert.equal(helpers.safeQueueUrl("/admin/tow-truck?page=" + page), "/admin/tow-truck"),
    );
  test("history context retains only validated fields", () =>
    assert.deepEqual(
      helpers.readQueueReturn({ towQueueReturn: { ...context, privateData: "discard" } }),
      context,
    ));
  for (const change of [
    { url: "//evil" },
    { orderId: "0" },
    { orderId: "x" },
    { control: "submit" },
    { scrollY: NaN },
    { scrollY: -1 },
    { scrollY: Infinity },
  ])
    test(
      "reject malformed history " + Object.keys(change)[0] + String(Object.values(change)[0]),
      () =>
        assert.equal(helpers.readQueueReturn({ towQueueReturn: { ...context, ...change } }), null),
    );
  test("direct entry and invalid state have predictable fallback", () => {
    assert.equal(helpers.queueReturnDestination(null), "/admin/tow-truck");
    assert.equal(helpers.queueReturnDestination({ fromQueue: "https://evil" }), "/admin/tow-truck");
    assert.equal(
      helpers.queueReturnDestination({ fromQueue: "/admin/tow-truck/intracity?page=2&preview=84" }),
      "/admin/tow-truck/intracity?page=2",
    );
  });
  for (const control of ["preview", "details"]) {
    const router = createMemoryRouter([{ path: "*", element: null }], {
      initialEntries: [context.url + "&preview=84"],
    });
    helpers.openOrderFromQueue(router.navigate, { ...context, control });
    await new Promise((resolve) => setImmediate(resolve));
    test(control + " full details gets safe origin and focus/scroll context", () => {
      assert.equal(router.state.location.pathname, "/admin/tow-truck/84");
      assert.deepEqual(helpers.readQueueReturn(router.state.location.state), {
        ...context,
        control,
      });
    });
    await router.navigate(-1);
    test(control + " browser Back reaches clean queue without reopening preview", () => {
      assert.equal(router.state.location.pathname + router.state.location.search, context.url);
      assert.deepEqual(helpers.readQueueReturn(router.state.location.state), {
        ...context,
        control,
      });
    });
    await router.navigate(1);
    test(control + " forward returns details", () =>
      assert.equal(router.state.location.pathname, "/admin/tow-truck/84"),
    );
    router.dispose();
  }
  const event = (flags) => ({
    defaultPrevented: false,
    button: 0,
    currentTarget: { target: "" },
    preventDefault() {
      this.defaultPrevented = true;
    },
    ...flags,
  });
  for (const flags of [
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
    { currentTarget: { target: "_blank" } },
  ])
    test("modified/native link click " + JSON.stringify(flags), () => {
      navigateCalls = [];
      const e = event(flags);
      helpers.handleOrderLinkClick(
        e,
        (...a) => navigateCalls.push(a),
        context.url,
        "84",
        "details",
      );
      assert.equal(navigateCalls.length, 0);
      assert.equal(e.defaultPrevented, false);
    });
  test("ordinary click captures scroll at interaction time", () => {
    navigateCalls = [];
    const e = event({});
    helpers.handleOrderLinkClick(e, (...a) => navigateCalls.push(a), context.url, "84", "details");
    assert.equal(e.defaultPrevented, true);
    assert.equal(navigateCalls.length, 2);
    assert.equal(navigateCalls[1][1].state.towQueueReturn.scrollY, 740);
  });
  const element = (id, control, visible = true) => ({
    isConnected: true,
    dataset: { orderId: id, queueControl: control },
    getClientRects: () => (visible ? [{}] : []),
    closest: () => null,
    hasAttribute: () => false,
    focus() {
      this.focused = true;
    },
  });
  test("responsive hidden desktop trigger is skipped for visible mobile trigger", () => {
    const hidden = element("84", "preview", false),
      shown = element("84", "preview"),
      fallback = element("", "");
    assert.equal(
      helpers.restoreQueuePosition(
        { isConnected: true, querySelectorAll: () => [hidden, shown] },
        fallback,
        context,
      ),
      true,
    );
    assert.ok(shown.focused);
    assert.ok(!hidden.focused);
    assert.ok(!fallback.focused);
    assert.deepEqual(global.lastScroll, { top: 740, behavior: "instant" });
  });
  test("removed row uses heading, never another request", () => {
    const other = element("85", "preview"),
      fallback = element("", "");
    helpers.restoreQueuePosition(
      { isConnected: true, querySelectorAll: () => [other] },
      fallback,
      context,
    );
    assert.ok(fallback.focused);
    assert.ok(!other.focused);
  });
  test("detached queue cannot steal focus after route change", () =>
    assert.equal(
      helpers.restoreQueuePosition({ isConnected: false }, element("", ""), context),
      false,
    ));
  const order = {
    id: "84",
    number: "MQ-84",
    phone: null,
    dispatchService: "intracity",
    status: "Waiting",
    plate: null,
    intercityDetails: {},
    origin: {},
    destination: {},
  };
  let restored = 0;
  const tree = Drawer({
    open: true,
    order,
    fromQueue: context.url,
    onClose() {},
    onRestoreFocus: () => restored++,
    returnScrollY: 740,
  });
  const content = nodes(tree).find((n) => n.type === "DialogContent");
  test("preview opening focuses its static accessible title", () => {
    focused = 0;
    const e = event({});
    content.props.onOpenAutoFocus(e);
    assert.ok(e.defaultPrevented);
    assert.equal(focused, 1);
    assert.ok(nodes(tree).some((n) => n.type === "DialogTitle" && n.props.tabIndex === -1));
  });
  test("Radix close restoration is delegated once, without default trigger race", () => {
    const e = event({});
    content.props.onCloseAutoFocus(e);
    assert.ok(e.defaultPrevented);
    assert.equal(restored, 1);
  });
  test("preview has no custom keyboard trap competing with Radix", () => {
    assert.equal(content.props.onKeyDown, undefined);
    assert.equal(content.props.onEscapeKeyDown, undefined);
  });
  test("preview details entry is separate from close and carries preview origin", () => {
    const link = nodes(tree).find((n) => n.type === "Link");
    navigateCalls = [];
    link.props.onClick(event({}));
    assert.equal(navigateCalls[1][1].state.towQueueReturn.control, "preview");
    assert.equal(navigateCalls[1][1].state.towQueueReturn.scrollY, 740);
  });
  test("identity details entry preserves details-control origin", () => {
    const link = nodes(Identity({ order, fromQueue: context.url })).find((n) => n.type === "Link");
    navigateCalls = [];
    link.props.onClick(event({}));
    assert.equal(navigateCalls[1][1].state.towQueueReturn.control, "details");
  });
  for (const [label, state] of [
    ["pending", { data: undefined, isPending: true }],
    ["wrong-ID", { data: { ...order, id: "85" }, isPending: false }],
    ["loaded", { data: order, isPending: false }],
    ["stale", { data: order, isPending: false, isError: true }],
  ]) {
    location = { pathname: "/admin/tow-truck", search: "?preview=84", state: null, key: label };
    queue.data.items = [order];
    detail = state;
    const drawer = nodes(Page()).find((n) => n.type === "TowTruckQuickPreviewDrawer");
    test("preview data state " + label + " remains identity-bound", () => {
      assert.equal(detailId, "84");
      assert.equal(
        drawer.props.order?.id ?? null,
        ["loaded", "stale"].includes(label) ? "84" : null,
      );
      if (label === "pending") assert.equal(drawer.props.isLoading, true);
      if (label === "stale") assert.equal(drawer.props.isError, true);
    });
  }
  for (const id of ["0", "-1", "bad", "9007199254740992"]) {
    location.search = "?preview=" + id;
    const drawer = nodes(Page()).find((n) => n.type === "TowTruckQuickPreviewDrawer");
    test("invalid preview ID never triggers detail read " + id, () => {
      assert.equal(detailId, undefined);
      assert.equal(drawer.props.open, false);
    });
  }
  test("no preview means no detail query", () => {
    location.search = "";
    Page();
    assert.equal(detailId, undefined);
  });
  for (const service of ["", "/intracity", "/intercity"]) {
    location = {
      pathname: "/admin/tow-truck" + service,
      search: "?page=3&trackNumber=MQ",
      state: null,
      key: service,
    };
    queue.data.page = 3;
    detail = { isPending: false };
    navigateCalls = [];
    const list = nodes(Page()).find((n) =>
      ["TowTruckTable", "TowTruckInterCityTable"].includes(n.type),
    );
    list.props.onSelectOrder("84");
    test("preview open preserves service/page/search " + service, () => {
      assert.equal(navigateCalls.length, 2);
      assert.equal(navigateCalls[0][1].replace, true);
      assert.equal(navigateCalls[1][0], location.pathname + "?page=3&trackNumber=MQ&preview=84");
      assert.equal(navigateCalls[1][1].state.towQueueReturn.control, "preview");
    });
    location.search += "&preview=84";
    location.state = navigateCalls[1][1].state;
    navigateCalls = [];
    const drawer = nodes(Page()).find((n) => n.type === "TowTruckQuickPreviewDrawer");
    drawer.props.onClose();
    test("preview close never opens full details " + service, () => {
      assert.equal(navigateCalls.length, 1);
      assert.equal(navigateCalls[0][0], location.pathname + "?page=3&trackNumber=MQ");
      assert.equal(navigateCalls[0][1].replace, true);
    });
  }
  console.log(
    `${count} offline preview/continuity checks passed; browser focus trap, Escape, reflow and screenshots NOT VERIFIED.`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
