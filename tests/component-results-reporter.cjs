// Reporte local sin dependencias adicionales ni recursos de Internet.
const fs = require('node:fs');
const path = require('node:path');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

module.exports = class ComponentResultsReporter {
  onRunComplete(_contexts, results) {
    const duration = ((Date.now() - results.startTime) / 1000).toFixed(3);
    const rows = results.testResults.map(suite => `<section><h2>${escape(path.relative(process.cwd(), suite.testFilePath))}</h2>
      <p>Resultado: ${escape(suite.numFailingTests || suite.testExecError ? 'FAILED' : 'PASSED')} · Duración: ${suite.perfStats.end - suite.perfStats.start} ms</p>
      ${suite.failureMessage ? `<pre>${escape(suite.failureMessage)}</pre>` : ''}
      <table><thead><tr><th>Test</th><th>Resultado</th><th>Duración (ms)</th></tr></thead><tbody>
      ${suite.testResults.map(test => `<tr><td>${escape(test.fullName)}</td><td>${escape(test.status)}</td><td>${test.duration ?? '—'}</td></tr>
      ${test.failureMessages.length ? `<tr><td colspan="3"><pre>${escape(test.failureMessages.join('\n'))}</pre></td></tr>` : ''}`).join('')}
      </tbody></table></section>`).join('');
    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
      <title>Reporte de resultados en React Native</title><style>
      body{font:16px system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:0 24px;color:#172b4d}h1{color:#174ea6}
      table{border-collapse:collapse;width:100%;margin-bottom:24px}th,td{border:1px solid #ccd5e0;padding:10px;text-align:left}
      th{background:#edf3fb}pre{white-space:pre-wrap;overflow-wrap:anywhere}section{break-inside:avoid}dt{font-weight:bold}dd{margin-bottom:8px}
      </style><h1>Reporte de resultados en React Native</h1><p>ConnectaOficios · Jest + React Native Testing Library</p>
      <p>Fecha: ${new Date(results.startTime).toISOString()} · Resultado: ${results.numFailedTests || results.numFailedTestSuites || results.wasInterrupted ? 'FAILED' : 'PASSED'}</p>
      <dl><dt>Test Suites</dt><dd>${results.numTotalTestSuites} (passed: ${results.numPassedTestSuites}, failed: ${results.numFailedTestSuites}, skipped: ${results.numPendingTestSuites})</dd>
      <dt>Total Tests</dt><dd>${results.numTotalTests}</dd><dt>Passed</dt><dd>${results.numPassedTests}</dd>
      <dt>Failed</dt><dd>${results.numFailedTests}</dd><dt>Skipped</dt><dd>${results.numPendingTests}</dd>
      <dt>Todo</dt><dd>${results.numTodoTests}</dd><dt>Snapshots</dt><dd>${results.snapshot.total}</dd>
      <dt>Time</dt><dd>${duration} s</dd></dl>${rows}</html>`;
    const directory = path.join(process.cwd(), 'reports', 'components');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'index.html'), html);
    fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify(results, null, 2));
  }
};
