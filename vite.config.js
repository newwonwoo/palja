import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";

export default defineConfig(({ mode, command }) => {
  const mobile = mode === "mobile";
  const seedFile = mobile && command === "build" ? process.env.SAJU_SEED_FILE : null;
  const mappingsFile = mobile && command === "build" ? process.env.SAJU_IMPORT_MAPPINGS_FILE : null;
  return {
    base: mobile ? "./" : "/",
    define: { __HAS_BUNDLED_VAULT__: JSON.stringify(Boolean(seedFile)), __HAS_BUNDLED_IMPORT_MAPPINGS__: JSON.stringify(Boolean(mappingsFile)) },
    build: {rollupOptions:{output:{manualChunks(id){if(id.endsWith('/calendar/foreign-transitions.json'))return 'timezone-data';}}}},
    plugins: [react(), {
      name: "private-offline-app-assets",
      transformIndexHtml(html) {
        if (!mobile) return html;
        html = html.replace("<title>사주명리</title>", "<title>사주 보관함</title>");
        if (command !== "build") return html;
        return html.replace("<head>", `<head><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'">`);
      },
      generateBundle() {
        if (seedFile) {
          const source = fs.readFileSync(seedFile, "utf8");
          const data = JSON.parse(source);
          if (data.format !== "saju-vault-screenshot-import" || Buffer.byteLength(source) > 8 * 1024 * 1024) throw new Error("Invalid private seed package");
          this.emitFile({ type: "asset", fileName: "private/initial-vault.json", source });
        }
        if (mappingsFile) {
          const source = fs.readFileSync(mappingsFile, "utf8");
          const data = JSON.parse(source);
          if (data.format !== "saju-vault-confirmed-mappings" || data.version !== 1 || typeof data.namespace !== 'string' || !data.namespace.trim() || Buffer.byteLength(source) > 8192) throw new Error("Invalid confirmed import mappings");
          this.emitFile({ type: "asset", fileName: "private/import-mappings.json", source });
        }
      },
    }],
  };
});
