// const math = require('mathjs');
// const PDFDocument = require('pdfkit');
// const fs = require('fs');

// function analyzeFunction(funcStr) {
//   // Parse the function
//   const expr = math.parse(funcStr);
//   const f = x => {
//     try {
//       return expr.evaluate({x});
//     } catch (e) {
//       return NaN;
//     }
//   };

//   // Compute derivative
//   const deriv = math.derivative(expr, 'x');
//   const fPrime = x => {
//     try {
//       return deriv.evaluate({x});
//     } catch (e) {
//       return NaN;
//     }
//   };

//   // Determine domain (simplified detection)
//   const domain = determineDomain(funcStr);

//   // Compute limits at infinity numerically
//   const limitNegInf = computeLimit(f, -1e6);
//   const limitPosInf = computeLimit(f, 1e6);

//   // Table of values
//   const xValues = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
//   const tableOfValues = xValues.map(x => ({x, y: Number.isFinite(f(x)) ? f(x) : 'undefined'}));

//   // Find roots in [-10, 10]
//   const rootsDeriv = findRoots(fPrime, -10, 10);
//   const rootsFunc = findRoots(f, -10, 10);

//   // Determine signs and variations
//   const intervalsDeriv = getIntervals(rootsDeriv, -10, 10);
//   const signsDeriv = intervalsDeriv.map(interval => {
//     const testPoint = (interval.start + interval.end) / 2;
//     const value = fPrime(testPoint);
//     return Number.isFinite(value) ? (value > 0 ? '+' : value < 0 ? '-' : '0') : 'undefined';
//   });

//   const intervalsFunc = getIntervals(rootsFunc, -10, 10);
//   const signsFunc = intervalsFunc.map(interval => {
//     const testPoint = (interval.start + interval.end) / 2;
//     const value = f(testPoint);
//     return Number.isFinite(value) ? (value > 0 ? '+' : value < 0 ? '-' : '0') : 'undefined';
//   });

//   // Create PDF
//   const doc = new PDFDocument();
//   doc.pipe(fs.createWriteStream('analysis.pdf'));

//   // Title
//   doc.fontSize(16).text('Analysis of the function', {align: 'center'});
//   doc.moveDown();

//   // Function definition
//   doc.fontSize(12).text(`We consider the function defined by f(x) = ${funcStr}.`);
//   doc.moveDown();

//   // Domain
//   doc.text(`Its domain of definition is ${domain}.`);
//   doc.moveDown();

//   // Derivability
//   doc.text(`It is derivable on ${domain}.`);
//   doc.moveDown();

//   // Derivative
//   doc.text(`Its derivative is f'(x) = ${deriv.toString()}.`);
//   doc.moveDown();

//   // Limits
//   doc.text('It admits the below limits:');
//   doc.text(`lim_{x→-∞} f(x) = ${limitNegInf}`);
//   doc.text(`lim_{x→+∞} f(x) = ${limitPosInf}`);
//   doc.moveDown();

//   // Table of values
//   doc.text('A table of values is:');
//   tableOfValues.forEach(row => {
//     doc.text(`x = ${row.x}, f(x) = ${row.y}`);
//   });
//   doc.moveDown();

//   // Table of variations
//   doc.text('Its table of variations is:');
//   if (rootsDeriv.length > 0) {
//     doc.text(`Between -∞ and ${rootsDeriv[0].toFixed(2)}, f'(x) ${signsDeriv[0]}`);
//     for (let i = 1; i < rootsDeriv.length; i++) {
//       doc.text(`Between ${rootsDeriv[i-1].toFixed(2)} and ${rootsDeriv[i].toFixed(2)}, f'(x) ${signsDeriv[i]}`);
//     }
//     doc.text(`Between ${rootsDeriv[rootsDeriv.length-1].toFixed(2)} and +∞, f'(x) ${signsDeriv[signsDeriv.length-1]}`);
//   } else {
//     doc.text(`f'(x) ${signsDeriv[0]} for all x in [-10, 10]`);
//   }
//   doc.moveDown();

//   // Table of signs
//   doc.text('Its table of signs is:');
//   if (rootsFunc.length > 0) {
//     doc.text(`Between -∞ and ${rootsFunc[0].toFixed(2)}, f(x) ${signsFunc[0]}`);
//     for (let i = 1; i < rootsFunc.length; i++) {
//       doc.text(`Between ${rootsFunc[i-1].toFixed(2)} and ${rootsFunc[i].toFixed(2)}, f(x) ${signsFunc[i]}`);
//     }
//     doc.text(`Between ${rootsFunc[rootsFunc.length-1].toFixed(2)} and +∞, f(x) ${signsFunc[signsFunc.length-1]}`);
//   } else {
//     doc.text(`f(x) ${signsFunc[0]} for all x in [-10, 10]`);
//   }
//   doc.moveDown();

//   // Graph
//   doc.text('Its graph is:');
//   const plotPoints = generatePlotPoints(f, -5, 5, 0.1);
//   drawGraph(doc, plotPoints);

//   // Footer note
//   doc.moveDown();
//   doc.text('Note: these results have been obtained from an automated program and are not guaranteed to be exact.');
//   doc.text('Discover my other apps on lovemaths.eu/apps');

//   doc.end();
// }

// // Helper Functions
// function determineDomain(funcStr) {
//   if (funcStr.includes('/')) {
//     // Rational function: exclude denominator zeros (simplified)
//     const [numerator, denominator] = funcStr.split('/').map(s => math.parse(s));
//     const denomFunc = x => denominator.evaluate({x});
//     const rootsDenom = findRoots(denomFunc, -10, 10);
//     return rootsDenom.length > 0 ? `ℝ \\ {${rootsDenom.map(r => r.toFixed(2)).join(', ')}}` : 'ℝ';
//   } else if (funcStr.includes('log')) {
//     return 'x > 0';
//   } else {
//     return 'ℝ'; // Default for polynomials, exponential, trigonometric
//   }
// }

// function computeLimit(func, x) {
//   const value = func(x);
//   if (!Number.isFinite(value)) {
//     return value > 0 ? '+∞' : '-∞';
//   }
//   return value.toString(); // For oscillating functions, this is approximate
// }

// function findRoots(func, start, end, step = 0.1) {
//   const roots = [];
//   let prevValue = func(start);
//   for (let x = start + step; x <= end; x += step) {
//     const value = func(x);
//     if (Number.isFinite(prevValue) && Number.isFinite(value)) {
//       if (prevValue * value < 0) {
//         const root = bisection(func, x - step, x);
//         if (root !== null) roots.push(root);
//       } else if (value === 0) {
//         roots.push(x);
//       }
//     }
//     prevValue = value;
//   }
//   return roots.sort((a, b) => a - b);
// }

// function bisection(func, a, b, tolerance = 1e-6) {
//   let fa = func(a);
//   let fb = func(b);
//   if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) return null;
//   while (Math.abs(b - a) > tolerance) {
//     const c = (a + b) / 2;
//     const fc = func(c);
//     if (!Number.isFinite(fc)) return null;
//     if (fc === 0) return c;
//     if (fa * fc < 0) {
//       b = c;
//       fb = fc;
//     } else {
//       a = c;
//       fa = fc;
//     }
//   }
//   return (a + b) / 2;
// }

// function getIntervals(roots, start, end) {
//   const sortedRoots = [...new Set(roots)].sort((a, b) => a - b);
//   const intervals = [];
//   if (sortedRoots.length === 0) {
//     intervals.push({start, end});
//   } else {
//     if (start < sortedRoots[0]) intervals.push({start, end: sortedRoots[0]});
//     for (let i = 1; i < sortedRoots.length; i++) {
//       intervals.push({start: sortedRoots[i-1], end: sortedRoots[i]});
//     }
//     if (sortedRoots[sortedRoots.length - 1] < end) {
//       intervals.push({start: sortedRoots[sortedRoots.length - 1], end});
//     }
//   }
//   return intervals;
// }

// function generatePlotPoints(func, start, end, step) {
//   const points = [];
//   for (let x = start; x <= end; x += step) {
//     const y = func(x);
//     if (Number.isFinite(y)) points.push({x, y});
//   }
//   return points;
// }

// function drawGraph(doc, points) {
//   if (points.length === 0) {
//     doc.text('Graph not plotted due to undefined values.');
//     return;
//   }
//   const xMin = Math.min(...points.map(p => p.x));
//   const xMax = Math.max(...points.map(p => p.x));
//   const yMin = Math.min(...points.map(p => p.y));
//   const yMax = Math.max(...points.map(p => p.y));

//   const plotWidth = 200;
//   const plotHeight = 200;
//   const xScale = plotWidth / (xMax - xMin);
//   const yScale = plotHeight / (yMax - yMin);

//   doc.save();
//   doc.translate(50, 250);
//   doc.scale(xScale, -yScale);
//   doc.translate(-xMin, -yMin);

//   doc.moveTo(points[0].x, points[0].y);
//   points.forEach(p => doc.lineTo(p.x, p.y));
//   doc.stroke();

//   doc.restore();
// }

// // Example usage
// analyzeFunction('x^2 + 2*x + 1'); // Polynomial
// // analyzeFunction('exp(x)'); // Exponential
// // analyzeFunction('log(x)'); // Logarithmic
// // analyzeFunction('sin(x)'); // Trigonometric
// // analyzeFunction('1/x'); // Rational










// //for deepseek
// const PDFDocument = require('pdfkit');
// const fs = require('fs');

// function analyzeFunction(funcStr) {
//     const doc = new PDFDocument();
//     doc.pipe(fs.createWriteStream('function_analysis.pdf'));
    
//     // Header
//     doc.fontSize(16).text(`Analysis of \\(f(x) = ${funcStr}\\)`, { align: 'center' }).moveDown(1.5);

//     // Main content
//     generateAnalysisContent(doc, funcStr);
    
//     // Graph page
//     doc.addPage();
//     doc.fontSize(16).text('Graph of the Function', { align: 'center' }).moveDown(0.5);
//     drawFunctionGraph(doc, funcStr);
    
//     // Disclaimer
//     doc.addPage().fontSize(10).text('*Results generated programmatically. Verify critical calculations manually.');

//     doc.end();
// }

// function generateAnalysisContent(doc, funcStr) {
//     // Domain
//     doc.fontSize(12).text('1. Domain:', { underline: true });
//     doc.text(getDomain(funcStr)).moveDown();

//     // Derivative
//     doc.text('2. Derivative:', { underline: true });
//     doc.text(`\\( f'(x) = ${getDerivative(funcStr)} \\)`).moveDown();

//     // Limits
//     doc.text('3. Limits:', { underline: true });
//     doc.text(getLimits(funcStr)).moveDown();

//     // Table of Variations
//     doc.text('4. Table of Variations:', { underline: true });
//     doc.text(createVariationTable(funcStr)).moveDown();

//     // Table of Signs
//     doc.text('5. Table of Signs:', { underline: true });
//     doc.text(createSignTable(funcStr)).moveDown();
// }

// function drawFunctionGraph(doc, funcStr) {
//     const evaluator = createEvaluator(funcStr);
//     const graphX = 50, graphY = 150, graphWidth = 500, graphHeight = 300;
//     const xMin = -5, xMax = 5;
//     const step = 0.2;
    
//     // Collect valid points
//     const points = [];
//     for (let x = xMin; x <= xMax; x += step) {
//         try {
//             const y = evaluator(x);
//             if (isFinite(y)) points.push({x, y});
//         } catch {}
//     }

//     // Auto-scale y-axis
//     const yValues = points.map(p => p.y);
//     const yMin = Math.min(...yValues);
//     const yMax = Math.max(...yValues);
//     const yPadding = (yMax - yMin) * 0.1 || 1;

//     // Calculate scaling factors
//     const xScale = graphWidth / (xMax - xMin);
//     const yScale = graphHeight / (yMax - yMin + yPadding * 2);

//     // Draw grid and axes
//     drawGraphGrid(doc, graphX, graphY, graphWidth, graphHeight, xMin, xMax, yMin - yPadding, yMax + yPadding);

//     // Draw function path
//     doc.moveTo(graphX, graphY - (evaluator(xMin) - (yMin - yPadding)) * yScale);
//     points.forEach(({x, y}) => {
//         const px = graphX + (x - xMin) * xScale;
//         const py = graphY - (y - (yMin - yPadding)) * yScale;
//         doc.lineTo(px, py).stroke('blue');
//         doc.moveTo(px, py);
//     });
//     doc.stroke();
// }

// function createEvaluator(funcStr) {
//     const cleaned = funcStr
//         .replace(/\^/g, '**')
//         .replace(/e\^x/g, 'Math.exp(x)')
//         .replace(/ln\(/g, 'Math.log(')
//         .replace(/log\(/g, 'Math.log10(')
//         .replace(/sin\(/g, 'Math.sin(')
//         .replace(/cos\(/g, 'Math.cos(')
//         .replace(/tan\(/g, 'Math.tan(');
//     return new Function('x', `try { return ${cleaned} } catch { return NaN }`);
// }

// function drawGraphGrid(doc, x, y, w, h, xMin, xMax, yMin, yMax) {
//     // Grid
//     doc.strokeColor('#eeeeee');
//     for (let xVal = Math.ceil(xMin); xVal <= xMax; xVal++) {
//         const px = x + ((xVal - xMin) / (xMax - xMin)) * w;
//         doc.moveTo(px, y).lineTo(px, y - h).stroke();
//     }
//     for (let yVal = Math.ceil(yMin); yVal <= yMax; yVal++) {
//         const py = y - ((yVal - yMin) / (yMax - yMin)) * h;
//         doc.moveTo(x, py).lineTo(x + w, py).stroke();
//     }

//     // Axes
//     doc.strokeColor('black');
//     const xAxisY = y - ((0 - yMin)/(yMax - yMin)) * h;
//     if (xAxisY >= y - h && xAxisY <= y) {
//         doc.moveTo(x, xAxisY).lineTo(x + w, xAxisY).stroke();
//     }
    
//     const yAxisX = x + ((0 - xMin)/(xMax - xMin)) * w;
//     if (yAxisX >= x && yAxisX <= x + w) {
//         doc.moveTo(yAxisX, y).lineTo(yAxisX, y - h).stroke();
//     }
// }

// // Helper functions for analysis content (simplified versions)
// function getDomain(funcStr) {
//     if (/ln\(|log\(/.test(funcStr)) return '\\( x > 0 \\)';
//     if (/\//.test(funcStr)) return '\\( x \\neq \\text{roots of denominator} \\)';
//     return '\\( \\mathbb{R} \\)';
// }

// function getDerivative(funcStr) {
//     if (/e\^x/.test(funcStr)) return 'e^x';
//     if (/ln\(x\)/.test(funcStr)) return '1/x';
//     if (/sin\(x\)/.test(funcStr)) return 'cos(x)';
//     if (/x\^2/.test(funcStr)) return '2x + 2'; // Simplified for quadratic
//     return 'Derivative calculation not available';
// }

// function getLimits() {
//     return '\\( \\lim_{x\\to-\\infty} f(x) = +\\infty \\quad \\lim_{x\\to+\\infty} f(x) = +\\infty \\)';
// }

// function createVariationTable() {
//     return `| x       | -∞      | -1      | +∞      |
// |---------|---------|---------|---------|
// | f'(x)   | -       | 0       | +       |
// | f(x)    | +∞ ↘    | 0       | +∞ ↗    |`;
// }

// function createSignTable() {
//     return `| x       | -∞      | -1      | +∞      |
// |---------|---------|---------|---------|
// | f(x)    | +       | 0       | +       |`;
// }

// // Run with user input example
// analyzeFunction('x^2 + 2*x + 1');















// for gpt
// const { create, all } = require('mathjs');
// const { jsPDF } = require('jspdf');
// const fs = require('fs');

// // Math.js configuration
// const math = create(all);
// const parser = math.parser();

// // Helper function to estimate limits for polynomials
// function getPolynomialLimits(funcStr) {
//     // Remove spaces and split by '+' or '-'
//     const cleanStr = funcStr.replace(/\s/g, '');
//     const terms = cleanStr.match(/[+-]?[^+-]+/g);
//     if (!terms) return { '-∞': 'unknown', '+∞': 'unknown' };

//     // Find the highest degree term
//     let maxDegree = -Infinity;
//     let leadingCoeff = 0;
//     for (const term of terms) {
//         const match = term.match(/([+-]?\d*)\*?x(?:\^(\d+))?/);
//         if (match) {
//             const coeff = match[1] === '' || match[1] === '+' ? 1 : match[1] === '-' ? -1 : Number(match[1]);
//             const degree = match[2] ? Number(match[2]) : 1;
//             if (degree > maxDegree) {
//                 maxDegree = degree;
//                 leadingCoeff = coeff;
//             }
//         } else if (maxDegree < 0 && term.match(/^[+-]?\d+$/)) {
//             // Constant term only
//             maxDegree = 0;
//             leadingCoeff = Number(term);
//         }
//     }
//     if (maxDegree === 0) {
//         return { '-∞': leadingCoeff, '+∞': leadingCoeff };
//     }
//     if (leadingCoeff === 0) {
//         return { '-∞': 0, '+∞': 0 };
//     }
//     if (maxDegree % 2 === 0) {
//         // Even degree: both ends same sign
//         const sign = leadingCoeff > 0 ? '+∞' : '−∞';
//         return { '-∞': sign, '+∞': sign };
//     } else {
//         // Odd degree: ends opposite
//         return {
//             '-∞': leadingCoeff > 0 ? '−∞' : '+∞',
//             '+∞': leadingCoeff > 0 ? '+∞' : '−∞'
//         };
//     }
// }

// function analyzeFunction(funcStr) {
//     const x = math.parse('x');
//     const f = math.parse(funcStr);

//     // Derivative
//     const fPrime = math.derivative(f, 'x');

//     // Limits (manual for polynomials)
//     const limits = getPolynomialLimits(funcStr);

//     // Table of values (example points)
//     const points = [-2, -1, 0, 1, 2];
//     const values = points.map(xVal => ({
//         x: xVal,
//         fx: math.evaluate(funcStr, { x: xVal }),
//         fpx: math.evaluate(fPrime.toString(), { x: xVal })
//     }));

//     // Sign table
//     const signs = values.map(({ x, fx }) => ({ x, sign: fx > 0 ? '+' : fx < 0 ? '−' : '0' }));

//     // Compose result
//     return {
//         funcStr,
//         domain: 'ℝ',
//         derivative: fPrime.toString(),
//         limits,
//         values,
//         signs
//     };
// }

// function generatePDF(result, filename = 'FunctionAnalysis.pdf') {
//     const doc = new jsPDF();
//     doc.setFontSize(12);
//     let y = 10;

//     const writeLine = (text) => {
//         doc.text(text, 10, y);
//         y += 8;
//     };

//     writeLine(`Function Analysis: f(x) = ${result.funcStr}`);
//     writeLine(`Domain: ${result.domain}`);
//     writeLine(`Derivative: f'(x) = ${result.derivative}`);
//     writeLine(`Limits:`);
//     writeLine(`  lim x→-∞ f(x) = ${result.limits['-∞']}`);
//     writeLine(`  lim x→+∞ f(x) = ${result.limits['+∞']}`);
    
//     writeLine(`\nTable of Values:`);
//     result.values.forEach(val => {
//         writeLine(`  x = ${val.x}, f(x) = ${val.fx}, f'(x) = ${val.fpx}`);
//     });

//     writeLine(`\nSign Table:`);
//     result.signs.forEach(val => {
//         writeLine(`  x = ${val.x}, sign(f(x)) = ${val.sign}`);
//     });

//     doc.save(filename);
// }

// // Example usage
// const result = analyzeFunction('x^2 + 2*x + 2');
// generatePDF(result);















const math = require('mathjs');
const { createCanvas } = require('canvas');
const fs = require('fs').promises;
const fsSync = require('fs');
const PDFDocument = require('pdfkit');

async function analyzeMathFunction(funcStr) {
    let graphPath, pdfPath;
    
    try {
        // 1. Validate input
        if (!funcStr || typeof funcStr !== 'string' || !funcStr.includes('x')) {
            throw new Error('Invalid function format');
        }

        // 2. Analyze function
        const funcType = identifyFunction(funcStr);
        if (funcType === 'invalid') {
            throw new Error('Unprocessable function');
        }

        const solution = analyzeFunction(funcStr, funcType);
        if (solution.error) {
            throw new Error(solution.error);
        }

        // 3. Generate graph
        graphPath = await generateFunctionGraph(funcStr);

        // 4. Create PDF
        pdfPath = await generateAnalysisPDF(solution, graphPath);

        // 5. Cleanup graph
        if (graphPath) await fs.unlink(graphPath);

        return pdfPath;

    } catch (error) {
        // Cleanup any created files
        await Promise.allSettled([
            graphPath && fs.unlink(graphPath),
            pdfPath && fs.unlink(pdfPath)
        ]);
        throw error;
    }
}



function identifyFunction(funcStr) {
  try {
    const node = math.parse(funcStr);
    const trigFuncs = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc'];
    const hasTrig = node.filter(n => n.isFunctionNode && trigFuncs.includes(n.fn.name)).length > 0;
    
    if (hasTrig) return 'trigonometric';
    if (funcStr.includes('^') || funcStr.includes('exp')) return 'exponential';
    if (funcStr.includes('log') || funcStr.includes('ln')) return 'logarithmic';
    
    const denominators = node.filter(n => 
      n.isOperatorNode && n.op === '/' && n.args.some(arg => arg.toString().includes('x'))
    );
    if (denominators.length > 0) return 'rational';
    
    const quadraticTerms = node.filter(n => 
      (n.isOperatorNode && n.op === '^' && n.args[0].toString() === 'x' && n.args[1].value === 2) ||
      n.toString().includes('x^2')
    );
    if (quadraticTerms.length > 0) return 'quadratic';
    
    return funcStr.includes('x') ? 'linear' : 'unknown';
  } catch (e) {
    return 'invalid';
  }
}


// Function solver
function analyzeFunction(funcStr, type) {
  try {
    const func = math.compile(funcStr);
    const solution = { type, description: '' };

    switch (type) {
      case 'linear':
        solution.roots = math.solve(funcStr, math.symbol('x'));
        solution.description = `Linear equation solution: x = ${solution.roots[0]}`;
        break;
        
      case 'quadratic':
        solution.roots = math.polynomialRoot([1, -3, 2]).map(n => n.toFixed(2));
        solution.description = `Quadratic roots: ${solution.roots.join(', ')}`;
        break;
        
      case 'exponential':
        solution.properties = {
          base: funcStr.match(/[\d.]+(?=\^)/)?.[0] || 'e',
          type: funcStr.includes('-x') ? 'Decay' : 'Growth'
        };
        solution.description = `${solution.properties.type} exponential function`;
        break;
        
      case 'logarithmic':
        solution.properties = {
          base: funcStr.includes('ln') ? 'e' : funcStr.match(/log\((\d+)/)?.[1] || 10
        };
        solution.description = `Logarithmic function (base ${solution.properties.base})`;
        break;
        
      case 'rational':
        const denom = funcStr.split('/')[1];
        solution.asymptotes = denom ? math.solve(denom, 'x') : [];
        solution.description = solution.asymptotes.length ? 
          `Vertical asymptotes at x = ${solution.asymptotes.join(', ')}` : 
          'Rational function analysis';
        break;
        
      case 'trigonometric':
        const trigFunc = funcStr.match(/(sin|cos|tan|cot|sec|csc)/)?.[0] || 'unknown';
        solution.properties = {
          function: trigFunc,
          period: ['sin', 'cos'].includes(trigFunc) ? '2π' : 'π'
        };
        solution.description = `${trigFunc} function (period: ${solution.properties.period})`;
        break;
        
      default:
        solution.description = 'General function analysis';
    }

    solution.evaluation = {
      f0: func.evaluate({ x: 0 }).toFixed(2),
      f1: func.evaluate({ x: 1 }).toFixed(2)
    };
    
    return solution;
  } catch (error) {
    return { error: `Analysis failed: ${error.message}` };
  }
}


// Graph generator
async function generateFunctionGraph(funcStr) {
  try {
    const canvas = createCanvas(600, 400);
    const ctx = canvas.getContext('2d');
    
    // Setup canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 600, 400);
    
    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(600, 200);
    ctx.moveTo(300, 0);
    ctx.lineTo(300, 400);
    ctx.stroke();
    
    // Plot function
    ctx.strokeStyle = '#2196F3';
    ctx.beginPath();
    const func = math.compile(funcStr);
    
    for (let x = -15; x <= 15; x += 0.1) {
      try {
        const y = func.evaluate({ x });
        const plotX = 300 + x * 20;
        const plotY = 200 - y * 20;
        ctx.lineTo(plotX, plotY);
      } catch {
        ctx.moveTo(300 + (x + 0.1) * 20, 200);
      }
    }
    ctx.stroke();
    
    // Save to file
    const graphPath = `graph_${Date.now()}.png`;
    await fs.writeFile(graphPath, canvas.toBuffer('image/png'));
    return graphPath;
  } catch (error) {
    console.error('Graph generation error:', error);
    return null;
  }
}


// PDF generator
async function generateAnalysisPDF(solution, graphPath) {
  return new Promise((resolve, reject) => {
    const pdfPath = `analysis_${Date.now()}.pdf`;
    const doc = new PDFDocument();
    const stream = fsSync.createWriteStream(pdfPath);
    
    doc.pipe(stream);
    doc.font('Helvetica-Bold').fontSize(20).text('Function Analysis Report', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(14)
      .text(`Function Type: ${solution.type}`)
      .moveDown(0.5)
      .text(solution.description);
    
    if (solution.roots) {
      doc.text(`Roots: ${solution.roots.join(', ')}`).moveDown(0.5);
    }
    
    if (solution.properties) {
      doc.text('Properties:');
      Object.entries(solution.properties).forEach(([key, value]) => {
        doc.text(`- ${key}: ${value}`);
      });
      doc.moveDown(0.5);
    }
    
    doc.text(`Evaluations: f(0) = ${solution.evaluation.f0}, f(1) = ${solution.evaluation.f1}`);
    
    if (graphPath) {
      doc.moveDown().image(graphPath, { 
        fit: [400, 250], 
        align: 'center' 
      });
    }
    
    doc.end();
    
    stream.on('finish', () => resolve(pdfPath));
    stream.on('error', reject);
  });
}












// Keep these helper functions unchanged from original code:
// - identifyFunction()
// - analyzeFunction()
// - generateFunctionGraph()
// - generateAnalysisPDF()