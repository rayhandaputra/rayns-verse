import fs from "fs";
import path from "path";

const rules = [
  { from: "~/lib/api", to: "~/nexus" },
  { from: "~/lib/nexus-client", to: "~/nexus/nexus-client" },
  { from: "~/lib/utils", to: "~/utils/utils" },
  { from: "~/lib/telegram-log", to: "~/utils/telegram-log" },
  { from: "~/lib/session.client", to: "~/utils/session.client" },
  { from: "~/lib/session.server", to: "~/utils/session.server" },
  { from: "~/components/layout", to: "~/components/shared/layout" },
  { from: "./api", to: "~/nexus" },
  { from: "~/components/drive", to: "~/components/features/drive" },
  { from: "~/components/eform", to: "~/components/features/eform" },
  { from: "~/components/icon", to: "~/components/shared/icon" },
  { from: "~/components/Chart", to: "~/components/shared/chart" },
  { from: "~/components/breadcrumb", to: "~/components/shared/breadcrumb" },
  { from: "~/components/card", to: "~/components/shared/card" },
  { from: "~/components/app-component", to: "~/components/shared/app-component" },
  { from: "./NotaView", to: "~/components/shared/NotaView" },
  { from: "./TwibbonEditor", to: "~/components/features/twibbon/TwibbonEditor" },
  { from: "./ui/button", to: "~/components/ui/button" },
  { from: "../ui", to: "~/components/ui" },
  { from: "../../ui", to: "~/components/ui" },
  { from: "../core", to: "~/components/core" },
  { from: "../../core", to: "~/components/core" },
  { from: "../shared", to: "~/components/shared" },
  { from: "../../shared", to: "~/components/shared" },
  { from: "../features", to: "~/components/features" },
  { from: "../../features", to: "~/components/features" },
  { from: "~/components/TitleHedaer", to: "~/components/core/TitleHeader" },
  { from: "~/components/modal", to: "~/components/shared/modal" },
  { from: "~/components/app-component/AppBreadcrumb", to: "~/components/core/AppBreadcrumb" },
  { from: "~/components/shared/app-component/AppBreadcrumb", to: "~/components/core/AppBreadcrumb" },
  { from: "~/components/NotaView", to: "~/components/shared/NotaView" },
  { from: "~/components/FloatingWhatsapp", to: "~/components/shared/FloatingWhatsapp" },
  { from: "~/components/PrintButton.client", to: "~/components/shared/PrintButton.client" },
  { from: "~/components/Tabs", to: "~/components/shared/Tabs" },
  { from: "~/components/CapacityTable", to: "~/components/features/procurement/CapacityTable" },
  { from: "~/components/ClientUseEditorPage", to: "~/components/features/drive/ClientUseEditorPage" },
  { from: "~/components/ClientTwibbonEditor", to: "~/components/features/twibbon/ClientTwibbonEditor" },
  { from: "~/components/table", to: "~/components/shared/table" },
  { from: "~/components/select", to: "~/components/shared/select" },
  { from: "~/components/input", to: "~/components/shared/input" },
  { from: "~/components/form", to: "~/components/shared/form" },
  { from: "~/components/popover", to: "~/components/shared/popover" },
  { from: "~/components/section", to: "~/components/shared/section" },
  { from: "~/components/upload", to: "~/components/shared/upload" },
  { from: "~/components/slider", to: "~/components/shared/slider" },
  { from: "~/components/print", to: "~/components/shared/print" },
  { from: "../../nexus", to: "~/nexus" },
  { from: "../../../nexus", to: "~/nexus" },
  { from: "../../api", to: "~/nexus" },
  { from: "../../../api", to: "~/nexus" },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== "dist" && file !== ".react-router") {
        walk(filePath);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      let content = fs.readFileSync(filePath, "utf-8");
      let changed = false;
      rules.forEach(({ from, to }) => {
        const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        
        // Match prefix with slash
        const subpathRegex = new RegExp(`(['"])${escapedFrom}\\/`, "g");
        if (content.match(subpathRegex)) {
          content = content.replace(subpathRegex, `$1${to}/`);
          changed = true;
          console.log(`Updated prefix ${from}/ -> ${to}/ in ${filePath}`);
        }

        // Match exact
        const exactRegex = new RegExp(`(['"])${escapedFrom}(['"])`, "g");
        if (content.match(exactRegex)) {
          content = content.replace(exactRegex, `$1${to}$2`);
          changed = true;
          console.log(`Updated exact ${from} -> ${to} in ${filePath}`);
        }
      });
      if (changed) {
        fs.writeFileSync(filePath, content);
      }
    }
  });
}

walk("./app");
