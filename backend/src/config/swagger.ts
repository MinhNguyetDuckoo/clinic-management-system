import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Clinic Management API",
      version: "1.0.0",
      description: "API documentation for Clinic Management System",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/modules/**/*.ts", "./src/app.ts", "./dist/modules/**/*.js", "./dist/app.js"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions) as any;

// Tự động phân tích các route Express và sinh tài liệu Swagger động
try {
  const projectRoot = path.join(__dirname, "../..");
  let appPath = path.join(projectRoot, "src/app.ts");
  let isDist = false;

  if (!fs.existsSync(appPath)) {
    appPath = path.join(projectRoot, "dist/app.js");
    isDist = true;
  }

  if (fs.existsSync(appPath)) {
    const content = fs.readFileSync(appPath, "utf8");

    // 1. Ánh xạ các import để tìm đường dẫn file định tuyến
    const imports: Record<string, string> = {};
    let match;

    if (!isDist) {
      const importRegex = /import\s+(\w+)\s+from\s+["']([^"']+)["']/g;
      while ((match = importRegex.exec(content)) !== null) {
        imports[match[1]] = match[2];
      }
    } else {
      const requireRegex = /const\s+(\w+)\s+=\s+[^(]+\(require\(["']([^"']+)["']\)\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports[match[1]] = match[2];
      }
    }

    // 2. Tìm tất cả các mount app.use
    const mountRegex = isDist
      ? /app\.use\(\s*["']([^"']+)["']\s*,\s*([\w]+)(?:\.default)?\s*\)/g
      : /app\.use\(\s*["']([^"']+)["']\s*,\s*([\w]+)\s*\)/g;
    
    const mounts: { prefix: string; routerVar: string }[] = [];
    while ((match = mountRegex.exec(content)) !== null) {
      mounts.push({ prefix: match[1], routerVar: match[2] });
    }

    if (!swaggerSpec.paths) {
      swaggerSpec.paths = {};
    }

    const baseFolder = isDist ? "dist" : "src";
    const ext = isDist ? ".js" : ".ts";

    mounts.forEach(({ prefix, routerVar }) => {
      const relPath = imports[routerVar];
      if (!relPath) return;

      let routesFile = path.resolve(path.join(projectRoot, baseFolder), relPath);
      if (!routesFile.endsWith(ext)) {
        if (fs.existsSync(routesFile + ext)) {
          routesFile += ext;
        } else if (fs.existsSync(routesFile + "/index" + ext)) {
          routesFile += "/index" + ext;
        }
      }

      if (!fs.existsSync(routesFile)) return;

      const routeContent = fs.readFileSync(routesFile, "utf8");
      
      const routeRegex = isDist
        ? /router_[^.]+\.default\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g
        : /router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
      
      let rMatch;
      while ((rMatch = routeRegex.exec(routeContent)) !== null) {
        const method = rMatch[1];
        const routePath = rMatch[2];

        let fullPath = (prefix + routePath).replace(/\/+/g, "/");
        if (fullPath.length > 1 && fullPath.endsWith("/")) {
          fullPath = fullPath.substring(0, fullPath.length - 1);
        }

        const swaggerPath = fullPath.replace(/:(\w+)/g, "{$1}");

        if (!swaggerSpec.paths[swaggerPath]) {
          swaggerSpec.paths[swaggerPath] = {};
        }

        // Chỉ thêm tự động nếu route chưa có tài liệu thủ công (qua comment JSDoc)
        if (!swaggerSpec.paths[swaggerPath][method]) {
          const moduleName = routerVar.replace("Routes", "").replace(/_routes_\d+/, "");
          const formattedTag = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
          
          let summary = `${method.toUpperCase()} ${swaggerPath}`;
          const isIdRoute = swaggerPath.includes("{id}");
          
          if (method === "get") {
            summary = isIdRoute ? `Xem chi tiết ${formattedTag}` : `Lấy danh sách ${formattedTag}`;
            if (swaggerPath.includes("/summary") || swaggerPath.includes("/revenue") || swaggerPath.includes("/stock")) {
              summary = `Báo cáo / Thống kê ${formattedTag}`;
            }
          } else if (method === "post") {
            if (swaggerPath.includes("/login")) summary = "Đăng nhập hệ thống";
            else if (swaggerPath.includes("/check-in")) summary = "Check-in lịch hẹn";
            else if (swaggerPath.includes("/cancel")) summary = "Hủy lịch hẹn / Hóa đơn";
            else if (swaggerPath.includes("/pay")) summary = "Thanh toán hóa đơn";
            else if (swaggerPath.includes("/start")) summary = "Bắt đầu ca khám";
            else if (swaggerPath.includes("/finish")) summary = "Hoàn thành ca khám";
            else if (swaggerPath.includes("/dispense")) summary = "Cấp phát thuốc";
            else summary = `Tạo mới ${formattedTag}`;
          } else if (method === "put") {
            summary = `Cập nhật ${formattedTag}`;
          } else if (method === "delete") {
            summary = `Xóa ${formattedTag}`;
          } else if (method === "patch") {
            summary = `Cập nhật trạng thái/mật khẩu ${formattedTag}`;
          }

          // Trích xuất các tham số từ URL (ví dụ: {id}, {doctorId})
          const parameters: any[] = [];
          const paramMatches = swaggerPath.match(/{(\w+)}/g);
          if (paramMatches) {
            paramMatches.forEach((pm) => {
              const paramName = pm.replace(/[{}]/g, "");
              parameters.push({
                name: paramName,
                in: "path",
                required: true,
                schema: {
                  type: "string",
                },
                description: `Mã/ID của ${paramName}`,
              });
            });
          }

          const routeDoc: any = {
            summary: summary,
            tags: [formattedTag],
            responses: {
              200: { description: "Thành công" },
              400: { description: "Yêu cầu không hợp lệ / Lỗi nghiệp vụ" },
              401: { description: "Chưa xác thực hoặc token hết hạn" },
              403: { description: "Không có quyền truy cập vai trò này" },
            },
          };

          if (parameters.length > 0) {
            routeDoc.parameters = parameters;
          }

          // Tự động yêu cầu Xác thực Bearer Token cho các API cần bảo mật (ngoại trừ login, health, root)
          if (swaggerPath !== "/api/auth/login" && swaggerPath !== "/health" && swaggerPath !== "/") {
            routeDoc.security = [{ bearerAuth: [] }];
          }

          swaggerSpec.paths[swaggerPath][method] = routeDoc;
        }
      }
    });
  }
} catch (error) {
  console.error("Error auto-generating Swagger paths dynamically:", error);
}