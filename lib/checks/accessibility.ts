import * as cheerio from 'cheerio'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'

export function runAccessibilityChecks(html: string): Issue[] {
  const $ = cheerio.load(html)
  const issues: Issue[] = []

  // Check 1: images-missing-alt-a11y (verified)
  // img without alt attribute at all (not alt="")
  const imagesNoAlt = $('img').toArray().filter(el => $(el).attr('alt') === undefined)
  if (imagesNoAlt.length > 0) {
    issues.push(withIssueMeta(
      { ...T['images-missing-alt-a11y'], value: `${imagesNoAlt.length} images` },
      'dom',
      [evidence('count', 'Images without alt attribute', imagesNoAlt.length)],
    ))
  }

  // Check 2: form-inputs-no-label (verified)
  // input:not([type="hidden"]) without associated label, aria-label, or aria-labelledby
  const inputs = $('input:not([type="hidden"]), textarea, select').toArray()
  const unlabeledInputs = inputs.filter((el) => {
    const $el = $(el)
    if ($el.attr('aria-label') || $el.attr('aria-labelledby')) return false
    const id = $el.attr('id')
    if (id && $(`label[for="${id}"]`).length > 0) return false
    // check if wrapped in label
    if ($el.closest('label').length > 0) return false
    return true
  })
  if (unlabeledInputs.length > 0) {
    issues.push(withIssueMeta(
      { ...T['form-inputs-no-label'], value: `${unlabeledInputs.length} inputs` },
      'dom',
      [evidence('count', 'Unlabeled inputs', unlabeledInputs.length)],
    ))
  }

  // Check 3: buttons-no-label (verified)
  // button with no text content AND no aria-label AND no aria-labelledby
  const unlabeledButtons = $('button').toArray().filter((el) => {
    const $el = $(el)
    if ($el.attr('aria-label') || $el.attr('aria-labelledby')) return false
    if ($el.text().trim()) return false
    return true
  })
  if (unlabeledButtons.length > 0) {
    issues.push(withIssueMeta(
      { ...T['buttons-no-label'], value: `${unlabeledButtons.length} buttons` },
      'dom',
      [evidence('count', 'Buttons without accessible label', unlabeledButtons.length)],
    ))
  }

  // Check 4: missing-lang-attribute (verified)
  // <html> element missing lang attribute
  if (!$('html').attr('lang')) {
    issues.push(withIssueMeta(
      { ...T['missing-lang-attribute'] },
      'dom',
      [evidence('selector', 'html[lang]', 'missing')],
    ))
  }

  // Check 5: missing-skip-navigation (heuristic)
  // No <a href="#main">, <a href="#content">, or element with class*="skip" before first nav
  const hasSkipLink =
    $('a[href="#main"], a[href="#main-content"], a[href="#content"]').length > 0 ||
    $('[class*="skip"]').length > 0
  if (!hasSkipLink) {
    issues.push(withIssueMeta(
      { ...T['missing-skip-navigation'] },
      'dom',
      [evidence('selector', 'a[href="#main-content"]', 'missing')],
    ))
  }

  return issues
}
