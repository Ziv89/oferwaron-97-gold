export default function preprocessPineScript(code) {
  return code
    .replace(/\/\/@version=5/g, '') // Remove version line
    .replace(/^strategy\([^\n]*\)\s*/gm, '') // Remove strategy(...) lines
    .replace(/strategy\(/g, 'indicator(') // Optional: rename strategy to indicator
    .replace(/var\s+(float|int|label|color|bool)?\s*/g, 'let ') // Pine var → let
    .replace(/:=/g, '=') // Pine assignment operator
    .replace(/\bna\b/g, 'NaN') // na → NaN
    .replace(/\band\b/g, '&&') // and → &&
    .replace(/\bor\b/g, '||') // or → ||
    .replace(/\bnot\b/g, '!') // not → !
    .replace(/\bif\s+!([\w.]+)/g, 'if (!$1)') // if !a → if (!a)
    .replace(/\[(\w+),\s*(\w+),\s*_?\]/g, '[$1, $2]') // [a, b, _] → [a, b]

    // Handle destructured assignment: [a, b] = expr
    .replace(/^\s*\[(\w+),\s*(\w+)\]\s*=\s*([^\n;]+)/gm, (_, a, b, rhs) => {
      const tmp = '__tmp_' + Math.random().toString(36).slice(2, 6);
      return `const ${tmp} = ${rhs}; let ${a} = ${tmp}[0]; let ${b} = ${tmp}[1];`;
    })

    // Handle let [a, b] = ... form
    .replace(/let\s+\[(.*?)\]\s*=\s*([^;\n]*)/g, (_, vars, rhs) => {
      const temp = '__tmp_' + Math.random().toString(36).slice(2, 7);
      const assignments = vars
        .split(',')
        .map((v, i) => `let ${v.trim()} = ${temp}[${i}]`)
        .join('; ');
      return `const ${temp} = ${rhs}; ${assignments}`;
    })

    // Remove strategy.* calls like strategy.entry(...)
    .replace(/\bstrategy\.\w+\([^)]*\)/g, '// strategy call removed')

    // Convert label.new(x=..., y=...) → label.new({ x: ..., y: ... })
    .replace(/label\.new\(([^)]+)\)/g, (match, args) => {
      const objArgs = '{' + args.replace(/(\w+)\s*=/g, '"$1":') + '}';
      return `label.new(${objArgs})`;
    })

    // ✅ Wrap multi-line `if (...)` bodies into blocks
    .replace(/if\s*\(([^)]+)\)\s*\n((\s+[^\n]+\n?)*)/g, (match, condition, body) => {
      const lines = body
        .split('\n')
        .filter(line => line.trim().length > 0);
      const block = lines.map(line => '  ' + line.trim()).join('\n');
      return `if (${condition}) {\n${block}\n}`;
    })

    // ✅ Remove top-level return statements
    .replace(/^return\s+/gm, '// return removed (top-level)');
}
