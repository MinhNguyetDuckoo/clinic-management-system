import fs from "fs";
import path from "path";

const projectRoot = path.join(__dirname, "../..");
const appPath = path.join(projectRoot, "src/app.ts");

function parseAppRoutes() {
  const content = fs.readFileSync(appPath, "utf8");
  
  // Step 1: Parse imports to map variable name to file path
  // E.g., import authRoutes from "./modules/auth/auth.routes";
  const importRegex = /import\s+(\w+)\s+from\s+["']([^"']+)["']/g;
  const imports: Record<string, string> = {};
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports[match[1]] = match[2];
  }

  // Step 2: Parse app.use to map path prefix to router variable
  // E.g., app.use("/api/auth", authRoutes);
  // Also handles: app.use("/api", doctorQueueRoutes);
  const mountRegex = /app\.use\(\s*["']([^"']+)["']\s*,\s*([\w]+)\s*\)/g;
  const mounts: { prefix: string; routerVar: string }[] = [];
  while ((match = mountRegex.exec(content)) !== null) {
    mounts.push({ prefix: match[1], routerVar: match[2] });
  }

  const apis: any[] = [];

  mounts.forEach(({ prefix, routerVar }) => {
    const relPath = imports[routerVar];
    if (!relPath) return;

    // Resolve the file path of the routes file
    // Rel path is like "./modules/auth/auth.routes"
    let routesFile = path.resolve(path.join(projectRoot, "src"), relPath);
    if (!routesFile.endsWith(".ts")) {
      if (fs.existsSync(routesFile + ".ts")) {
        routesFile += ".ts";
      } else if (fs.existsSync(routesFile + "/index.ts")) {
        routesFile += "/index.ts";
      }
    }

    if (!fs.existsSync(routesFile)) {
      console.log(`Warning: File not found for ${routerVar} at ${routesFile}`);
      return;
    }

    // Step 3: Parse the routes file to find all route definitions
    // E.g., router.post("/login", authController.login);
    // E.g., router.get("/:id", authMiddleware, ...)
    const routeContent = fs.readFileSync(routesFile, "utf8");
    const routeRegex = /router\.(get|post|put|delete|patch|use)\(\s*["']([^"']+)["']/g;
    let rMatch;
    while ((rMatch = routeRegex.exec(routeContent)) !== null) {
      const method = rMatch[1];
      const routePath = rMatch[2];
      
      // Combine prefix and routePath
      let fullPath = (prefix + routePath).replace(/\/+/g, "/");
      // Strip trailing slash unless it's just "/"
      if (fullPath.length > 1 && fullPath.endsWith("/")) {
        fullPath = fullPath.substring(0, fullPath.length - 1);
      }

      // Convert Express path parameters (e.g. :id) to Swagger style ({id})
      const swaggerPath = fullPath.replace(/:(\w+)/g, "{$1}");

      apis.push({
        method: method === "use" ? "all" : method,
        path: swaggerPath,
        module: routerVar.replace("Routes", ""),
      });
    }
  });

  return apis;
}

const allApis = parseAppRoutes();
console.log(`Discovered ${allApis.length} APIs in the system:`);
console.log(JSON.stringify(allApis, null, 2));
