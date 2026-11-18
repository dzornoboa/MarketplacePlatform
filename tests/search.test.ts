import test from 'node:test'
import assert from 'node:assert/strict'
import { containsSearchPhrase, suggestSearchResults } from '../lib/search.ts'

test('search matches phrases in display text across case and punctuation', () => {
  assert.equal(containsSearchPhrase('agri business', 'Trade in Agri-Business'), true)
  assert.equal(containsSearchPhrase('RI', 'Agribusiness'), false)
  assert.equal(containsSearchPhrase('!!!', 'Agribusiness'), false)
})

test('suggestions handle a misspelling and omit unrelated results', () => {
  const listings = ['Financial Technology', 'Investment in Agribusiness', 'Agribusiness Export Trade', 'Renewable Energy']
  assert.deepEqual(suggestSearchResults('agribusines exports', listings, item => item), [
    'Agribusiness Export Trade', 'Investment in Agribusiness',
  ])
  assert.deepEqual(suggestSearchResults('furniture', listings, item => item), [])
})
