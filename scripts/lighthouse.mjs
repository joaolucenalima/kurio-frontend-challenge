import { spawn, execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import * as chromeLauncher from 'chrome-launcher'
import { chromium } from '@playwright/test'

const outputDir = 'lighthouse-reports'
const base = 'http://127.0.0.1:4174'
const server = spawn('pnpm', ['preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], {
  stdio: 'inherit',
})
let chrome
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error('Preview encerrou antes de iniciar')
    try {
      const response = await fetch(base)
      if (response.ok) {
        ready = true
        break
      }
    } catch {
      /* Aguarda o servidor iniciar. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!ready) throw new Error('Preview não iniciou')
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })
  chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH || chromium.executablePath(),
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
  })
  const summary = {
    environment: {
      date: new Date().toISOString(),
      os: `${os.platform()} ${os.release()} ${os.arch()}`,
      node: process.version,
      chrome: execFileSync(process.env.CHROME_PATH || chromium.executablePath(), ['--version'], {
        encoding: 'utf8',
      }).trim(),
      lighthouse: (await import('lighthouse/package.json', { with: { type: 'json' } })).default
        .version,
      conditions:
        'Build demo, MSW success, Lighthouse throttling padrão; três medições sequenciais por página e perfil.',
    },
    results: [],
  }
  const median = (values) => values.sort((a, b) => a - b)[1]
  for (const [name, path] of [
    ['inicio', '/'],
    ['detalhe', '/nfts/emerald-ape'],
  ]) {
    for (const profile of ['mobile', 'desktop']) {
      const measurements = []
      for (let run = 1; run <= 3; run++) {
        const settings = {
          port: chrome.port,
          output: ['html', 'json'],
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        }
        const result = await lighthouse(
          base + path,
          settings,
          profile === 'desktop' ? desktopConfig : undefined,
        )
        if (!result || result.lhr.runtimeError)
          throw new Error(result?.lhr.runtimeError?.message || 'Lighthouse não retornou resultado')
        const stem = `${name}-${profile}-${run}`
        await writeFile(`${outputDir}/${stem}.html`, result.report[0], 'utf8')
        await writeFile(`${outputDir}/${stem}.json`, result.report[1], 'utf8')
        const { categories, audits } = result.lhr
        measurements.push({
          performance: categories.performance.score * 100,
          accessibility: categories.accessibility.score * 100,
          bestPractices: categories['best-practices'].score * 100,
          seo: categories.seo.score * 100,
          lcp: audits['largest-contentful-paint'].numericValue,
          cls: audits['cumulative-layout-shift'].numericValue,
          tbt: audits['total-blocking-time'].numericValue,
        })
        process.stdout.write(`${stem}: ${JSON.stringify(measurements.at(-1))}\n`)
      }
      const medians = Object.fromEntries(
        Object.keys(measurements[0]).map((key) => [
          key,
          median(measurements.map((value) => value[key])),
        ]),
      )
      summary.results.push({ page: name, profile, measurements, medians })
    }
  }
  await writeFile(`${outputDir}/summary.json`, JSON.stringify(summary, null, 2) + '\n', 'utf8')
} finally {
  if (chrome) await chrome.kill()
  server.kill('SIGTERM')
}
