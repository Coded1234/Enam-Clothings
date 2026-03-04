/**
 * Script to replace Next.js imports with React Router DOM equivalents in CRA client files.
 * Run from workspace root: node fix-next-imports.js
 */
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "client", "src");

function getAllJsFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results.push(...getAllJsFiles(filePath));
    } else if (file.endsWith(".js")) {
      results.push(filePath);
    }
  }
  return results;
}

function fixFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  // Normalize to LF for regex processing
  let content = raw.replace(/\r\n/g, "\n");
  const original = content;

  if (
    !content.includes("next/link") &&
    !content.includes("next/navigation") &&
    !content.includes("next/dynamic")
  ) {
    return;
  }

  // 1. Remove "use client"; directive
  content = content.replace(/^"use client";\s*\n/m, "");

  // 2. Remove next/dynamic and replace usage
  content = content.replace(
    /^import\s+dynamic\s+from\s+"next\/dynamic";\n/m,
    "",
  );
  content = content.replace(
    /const\s+(\w+)\s*=\s*dynamic\(\s*\(\s*\)\s*=>\s*import\(([^)]+)\)\s*,\s*\{[^}]*\}\s*\);/g,
    "const $1 = React.lazy(() => import($2));",
  );

  // 3. Parse and remove next/navigation import, collect what we need
  const navImportRegex =
    /^import\s+\{([^}]+)\}\s+from\s+"next\/navigation";\n/m;
  const navMatch = content.match(navImportRegex);
  let rrTokensFromNav = [];
  if (navMatch) {
    const tokens = navMatch[1]
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    for (const token of tokens) {
      if (token === "useRouter") rrTokensFromNav.push("useNavigate");
      else if (token === "usePathname") rrTokensFromNav.push("useLocation");
      else rrTokensFromNav.push(token);
    }
    content = content.replace(navImportRegex, "");
  }

  // 4. Remove next/link import line
  const hadNextLink = raw.includes('from "next/link"');
  content = content.replace(/^import\s+Link\s+from\s+"next\/link";\n/m, "");
  if (hadNextLink && !rrTokensFromNav.includes("Link"))
    rrTokensFromNav.push("Link");

  // 5. Remove any standalone duplicate react-router-dom import that only has Link
  // (added by a previous partial run of this script)
  content = content.replace(
    /^import\s+\{\s*Link\s*\}\s+from\s+"react-router-dom";\n/m,
    "",
  );

  // 6. Merge into existing react-router-dom import or create new one
  if (rrTokensFromNav.length > 0) {
    const rrImportRegex =
      /^(import\s+\{)([^}]+)(\}\s+from\s+"react-router-dom";)/m;
    const rrMatch = content.match(rrImportRegex);
    if (rrMatch) {
      const existingTokens = rrMatch[2]
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const mergedTokens = [
        ...new Set([...existingTokens, ...rrTokensFromNav]),
      ];
      content = content.replace(
        rrImportRegex,
        `import { ${mergedTokens.join(", ")} } from "react-router-dom";`,
      );
    } else {
      const insertMatch = content.match(/^(import\s+)/m);
      if (insertMatch) {
        const pos = content.indexOf(insertMatch[0]);
        content =
          content.slice(0, pos) +
          `import { ${rrTokensFromNav.join(", ")} } from "react-router-dom";\n` +
          content.slice(pos);
      }
    }
  }

  // 7. Fix usage: useRouter() -> useNavigate()
  content = content.replace(/\buseRouter\(\)/g, "useNavigate()");
  content = content.replace(
    /\bconst\s+router\s*=\s*useNavigate\(\)/g,
    "const navigate = useNavigate()",
  );

  // 8. Fix usage: router.push/replace/back
  content = content.replace(/\brouter\.push\(/g, "navigate(");
  content = content.replace(
    /\brouter\.replace\(([^;)]+)\)/g,
    "navigate($1, { replace: true })",
  );
  content = content.replace(/\brouter\.back\(\)/g, "navigate(-1)");
  content = content.replace(
    /\brouter\.refresh\(\)/g,
    "window.location.reload()",
  );

  // 9. Fix usage: usePathname() -> useLocation()
  content = content.replace(
    /\bconst\s+pathname\s*=\s*usePathname\(\)/g,
    "const { pathname } = useLocation()",
  );

  // 10. Fix usage: const searchParams = useSearchParams() -> destructured
  content = content.replace(
    /\bconst\s+searchParams\s*=\s*useSearchParams\(\)/g,
    "const [searchParams, setSearchParams] = useSearchParams()",
  );

  // 11. Fix Link prop: href= -> to=
  content = content.replace(/<Link\s+href=/g, "<Link to=");

  if (content !== original) {
    const out = raw.includes("\r\n") ? content.replace(/\n/g, "\r\n") : content;
    fs.writeFileSync(filePath, out, "utf-8");
    console.log("Updated:", path.relative(__dirname, filePath));
  }
}

const files = getAllJsFiles(srcDir);
let count = 0;
for (const file of files) {
  try {
    fixFile(file);
    count++;
  } catch (err) {
    console.error("Error processing", file, ":", err.message);
  }
}
console.log(`\nProcessed ${count} files.`);
