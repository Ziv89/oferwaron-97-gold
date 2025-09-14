export function pineToJS(pineCode: string): string {
  pineCode = pineCode.replace(/\bconst\s+/g, "");

  const lines = pineCode
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//"));

  const declaredVars = new Set<string>();
  const jsLines: string[] = [];

  for (let line of lines) {
    if (line.startsWith("indicator(") || line.startsWith("strategy(")) {
      jsLines.push(`ta.${line};`);
      continue;
    }

    if (line.includes("=")) {
      const eqIndex = line.indexOf("=");
      let lhs = line.substring(0, eqIndex).trim();
      let rhs = line.substring(eqIndex + 1).trim();

      lhs = sanitizeVarName(lhs);

      if (!declaredVars.has(lhs)) {
        jsLines.push(`const ${lhs} = ${rhs};`);
        declaredVars.add(lhs);
      } else {
        jsLines.push(`${lhs} = ${rhs};`);
      }
    } else {
      jsLines.push(`${line};`);
    }
  }

  return jsLines.join("\n");
}

function sanitizeVarName(name: string): string {
  name = name.replace(/\[.*?\]/g, "");
  if (/^\d/.test(name)) {
    name = "_" + name;
  }
  return name;
}
