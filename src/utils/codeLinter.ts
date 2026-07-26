export interface LintIssue {
  type: 'ERROR' | 'WARNING' | 'INFO';
  line?: number;
  message: string;
  codeSnippet?: string;
}

export interface LintResult {
  issues: LintIssue[];
  issueCount: number;
  isValid: boolean;
  compiledFn: ((ctx: CanvasRenderingContext2D, time: number, width: number, height: number, duration?: number, params?: any) => void) | null;
}

/**
 * Analyzes custom JS canvas draw function code and compiles it safely.
 */
export function lintAndCompileCanvasCode(codeString: string): LintResult {
  const issues: LintIssue[] = [];

  if (!codeString || !codeString.trim()) {
    return {
      issues: [{ type: 'INFO', message: 'Ketik atau tempel kode JavaScript draw(ctx, time, width, height) di atas.' }],
      issueCount: 0,
      isValid: false,
      compiledFn: null,
    };
  }

  const lines = codeString.split('\n');

  // Check 1: Unquoted CSS Font/Style strings like `16px system-ui, -apple-system` without quotes or incomplete strings
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for `px system-ui` or `-apple-system` outside string quotes
    if (line.includes('px') && !line.includes("'") && !line.includes('"') && !line.includes('`')) {
      if (line.includes('system') || line.includes('Arial') || line.includes('Roboto') || line.includes('sans-serif')) {
        issues.push({
          type: 'WARNING',
          line: lineNum,
          message: `Potential undefined variable 'px'`,
          codeSnippet: line.trim(),
        });
        issues.push({
          type: 'WARNING',
          line: lineNum,
          message: `Potential undefined variable 'system'`,
          codeSnippet: line.trim(),
        });
      }
    }

    // Check for missing ctx method calls or typos like `ctx.fillrect` (lowercase r)
    if (line.includes('ctx.fillrect')) {
      issues.push({
        type: 'WARNING',
        line: lineNum,
        message: `Gunakan 'ctx.fillRect' (huruf R kapital)`,
        codeSnippet: line.trim(),
      });
    }
    if (line.includes('ctx.strokerect')) {
      issues.push({
        type: 'WARNING',
        line: lineNum,
        message: `Gunakan 'ctx.strokeRect' (huruf R kapital)`,
        codeSnippet: line.trim(),
      });
    }
    if (line.includes('ctx.clearrect')) {
      issues.push({
        type: 'WARNING',
        line: lineNum,
        message: `Gunakan 'ctx.clearRect' (huruf R kapital)`,
        codeSnippet: line.trim(),
      });
    }

    // Check for potential undefined variables in expressions
    const unquotedFontMatch = line.match(/(['"`])?(\d+px\s+[\w\s-]+)(['"`])?/);
    if (unquotedFontMatch && (!unquotedFontMatch[1] || !unquotedFontMatch[3])) {
      issues.push({
        type: 'WARNING',
        line: lineNum,
        message: `String font CSS harus dibungkus dalam tanda petik, contoh: "16px sans-serif"`,
        codeSnippet: line.trim(),
      });
    }
  });

  // Check 2: Syntax and compilation check
  let compiledFn: ((ctx: CanvasRenderingContext2D, time: number, width: number, height: number, duration?: number, params?: any) => void) | null = null;
  let isValid = false;

  try {
    let cleanBody = codeString.trim();

    // Handle if code includes `function draw(ctx, time, width, height) { ... }` or `const draw = (ctx, time, width, height) => { ... }`
    if (/^\s*function\s+draw\s*\(/.test(cleanBody)) {
      // Extract function body inside outermost braces
      const firstBrace = cleanBody.indexOf('{');
      const lastBrace = cleanBody.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanBody = cleanBody.substring(firstBrace + 1, lastBrace);
      }
    } else if (/^\s*(const|let|var)?\s*draw\s*=\s*\(/.test(cleanBody)) {
      const firstBrace = cleanBody.indexOf('{');
      const lastBrace = cleanBody.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanBody = cleanBody.substring(firstBrace + 1, lastBrace);
      }
    }

    // Attempt compilation with standard parameters
    const factory = new Function('ctx', 'time', 'width', 'height', 'duration', 'params', `
      try {
        ${cleanBody}
      } catch (err) {
        console.error('Canvas Draw Execution Error:', err);
      }
    `);

    compiledFn = factory as any;
    isValid = true;

  } catch (syntaxError: any) {
    isValid = false;
    compiledFn = null;
    
    // Parse error line number if possible
    let errLine = 1;
    const lineMatch = syntaxError.stack?.match(/<anonymous>:(\d+):(\d+)/) || syntaxError.message?.match(/line (\d+)/i);
    if (lineMatch && lineMatch[1]) {
      errLine = parseInt(lineMatch[1], 10);
    }

    issues.unshift({
      type: 'ERROR',
      line: errLine,
      message: `Syntax Error: ${syntaxError.message}`,
    });
  }

  // Add info badge if no critical errors
  if (isValid && issues.length === 0) {
    issues.push({
      type: 'INFO',
      message: 'Kode valid dan siap di-render ke canvas!',
    });
  }

  return {
    issues,
    issueCount: issues.filter(i => i.type !== 'INFO').length,
    isValid,
    compiledFn,
  };
}
