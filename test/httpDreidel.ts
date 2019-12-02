import tap from 'tap'
import { runStubFunctionFromBindings, createHttpTrigger, setContextLogger } from 'stub-azure-function-context'
import HttpDreidel from '../HttpDreidel'

tap.test('HttpDreidel should return a dreidel side at random', async t => {
  setContextLogger({log: () => {}}) // noop logger
  const context = await runStubFunctionFromBindings(HttpDreidel, [
    { type: 'httpTrigger', name: 'req', direction: 'in', data: createHttpTrigger('http://etarrowo.com') },
    { type: 'http', name: 'res', direction: 'out' }
  ])
  const dreidelSidesHebrew = ['נ', 'ג', 'ה', 'ש']
  const dreidelSidesEnglish = ['nun', 'gimmel', 'hay', 'shin']
  t.ok(context.res.body.hasOwnProperty('hebrewCharacter'), 'has property hebrewCharacter')
  t.ok(context.res.body.hasOwnProperty('englishTranslation'), 'has property englishTranslation')
  t.ok(dreidelSidesHebrew.indexOf(context.res.body.hebrewCharacter) > -1, 'has valid hebrewCharacter')
  t.ok(dreidelSidesEnglish.indexOf(context.res.body.englishTranslation) > -1, 'has valid englishTranslation')
})