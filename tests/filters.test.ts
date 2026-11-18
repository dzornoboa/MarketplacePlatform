import test from 'node:test'
import assert from 'node:assert/strict'
import { containsPattern, filterOptions, opportunityKind, searchColumns } from '../lib/filters.ts'

test('sector options survive empty results and preserve older selected values', () => {
  assert.deepEqual(filterOptions(['FinTech', 'Agribusiness', 'FinTech', null], 'Logistics'), ['Agribusiness', 'FinTech', 'Logistics'])
  assert.deepEqual(filterOptions([], 'Agribusiness'), ['Agribusiness'])
  assert.equal(opportunityKind('partnership'), 'partnership')
  assert.equal(opportunityKind('constructor'), '')
})

test('search keeps punctuation inside the pattern and escapes LIKE wildcards', () => {
  assert.equal(containsPattern('  50%_Growth  '), '%50\\%\\_Growth%')
  assert.equal(searchColumns('Accra, Inc. (HQ)', ['title', 'summary']), 'title.ilike."%Accra, Inc. (HQ)%",summary.ilike."%Accra, Inc. (HQ)%"')
})
