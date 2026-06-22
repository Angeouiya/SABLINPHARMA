import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  PLATFORM_LABELS,
  PLATFORM_REQUIRED_PAGE_KEYS,
  PLATFORM_SECTION_ROUTES,
  SECTION_API_ROUTES,
  coverageItemsFor,
  coverageReportFor,
  missingCoverageKeysFor,
  routeForSection,
  sectionGuideFor,
  sectionWorkflowFor,
  type PlatformScope,
} from "../src/lib/platform-ux-sync";

const scopes: PlatformScope[] = ["user", "pharmacy", "admin"];
const root = process.cwd();
const failures: string[] = [];

function toRouteSegments(route: string) {
  return route
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => (segment.startsWith(":") ? `[${segment.slice(1)}]` : segment));
}

function pageFileFor(route: string) {
  if (route === "/") return path.join(root, "src", "app", "page.tsx");
  return path.join(root, "src", "app", ...toRouteSegments(route), "page.tsx");
}

function apiFileFor(route: string) {
  return path.join(root, "src", "app", ...toRouteSegments(route), "route.ts");
}

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function verifyDeclaredRoutes() {
  for (const scope of scopes) {
    for (const [pageKey, route] of Object.entries(PLATFORM_SECTION_ROUTES[scope])) {
      const file = pageFileFor(route);
      expect(existsSync(file), `${PLATFORM_LABELS[scope]}: route declared for "${pageKey}" does not exist: ${route} -> ${path.relative(root, file)}`);
    }
  }
}

function verifyRequiredSections() {
  const missing = missingCoverageKeysFor();
  expect(missing.length === 0, `Missing UX coverage: ${missing.map((item) => `${item.scope}:${item.pageKey}`).join(", ")}`);

  for (const scope of scopes) {
    for (const pageKey of PLATFORM_REQUIRED_PAGE_KEYS[scope]) {
      const route = routeForSection(scope, pageKey);
      const guide = sectionGuideFor(scope, pageKey);
      const workflow = sectionWorkflowFor(scope, pageKey);

      expect(Boolean(route), `${PLATFORM_LABELS[scope]}: "${pageKey}" has no route.`);
      if (route) {
        const file = pageFileFor(route);
        expect(existsSync(file), `${PLATFORM_LABELS[scope]}: "${pageKey}" route is missing on disk: ${route} -> ${path.relative(root, file)}`);
      }

      expect(guide.primaryActions.length > 0, `${PLATFORM_LABELS[scope]}: "${pageKey}" has no UX action.`);
      expect(guide.syncedData.length > 0, `${PLATFORM_LABELS[scope]}: "${pageKey}" has no synchronized data.`);
      expect(guide.protections.length > 0, `${PLATFORM_LABELS[scope]}: "${pageKey}" has no protection rule.`);
      expect(workflow.dataInputs.length > 0, `${PLATFORM_LABELS[scope]}: "${pageKey}" has no workflow input.`);
      expect(workflow.serverActions.length > 0, `${PLATFORM_LABELS[scope]}: "${pageKey}" has no workflow action.`);
      expect(workflow.syncOutputs.length > 0, `${PLATFORM_LABELS[scope]}: "${pageKey}" has no workflow output.`);
      expect(workflow.protectionChecks.length > 0, `${PLATFORM_LABELS[scope]}: "${pageKey}" has no workflow protection.`);
    }
  }
}

function verifyApiRoutes() {
  for (const scope of scopes) {
    for (const [pageKey, apiRoutes] of Object.entries(SECTION_API_ROUTES[scope])) {
      for (const route of apiRoutes) {
        const file = apiFileFor(route);
        expect(existsSync(file), `${PLATFORM_LABELS[scope]}: API declared for "${pageKey}" does not exist: ${route} -> ${path.relative(root, file)}`);
      }
    }
  }
}

function verifyPublicSeparation() {
  for (const [pageKey, route] of Object.entries(PLATFORM_SECTION_ROUTES.user)) {
    expect(!route.startsWith("/admin"), `User section "${pageKey}" points to Admin route: ${route}`);
    expect(route !== "/pharmacie" && !route.startsWith("/pharmacie/"), `User section "${pageKey}" points to Pharmacy route: ${route}`);
  }
}

function verifyCoverageSummary() {
  const report = coverageReportFor();
  const items = coverageItemsFor();
  expect(report.summary.missingCoverage === 0, `Coverage report still has ${report.summary.missingCoverage} missing sections.`);
  expect(items.length >= 50, `Coverage report is unexpectedly small: ${items.length} sections.`);
  expect(report.summary.averageMaturity >= 80, `Coverage maturity is below MVP threshold: ${report.summary.averageMaturity}.`);
}

function verifyNoGenericProfessionalPanels() {
  const files = [
    path.join(root, "src", "components", "views", "admin-space-view.tsx"),
    path.join(root, "src", "components", "views", "pharmacy-space-view.tsx"),
  ];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    expect(!content.includes("SimpleAdmin"), `${path.relative(root, file)} still contains SimpleAdmin. Replace generic panels with operational UX sections.`);
  }
}

verifyDeclaredRoutes();
verifyRequiredSections();
verifyApiRoutes();
verifyPublicSeparation();
verifyCoverageSummary();
verifyNoGenericProfessionalPanels();

if (failures.length) {
  console.error("Platform UX/sync verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const report = coverageReportFor();
console.log(
  `OK platform UX/sync: ${report.summary.total} sections, ${report.summary.missingCoverage} missing, maturity ${report.summary.averageMaturity}.`
);
