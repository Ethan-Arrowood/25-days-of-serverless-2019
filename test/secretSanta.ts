import tap from 'tap'
import { runStubFunctionFromBindings, createHttpTrigger, setContextLogger } from 'stub-azure-function-context'
import SecretSanta from '../SecretSanta'
import NoopLogger from './utils/noopLogger'

tap.test('SecretSanta should return png files', async t => {
  setContextLogger(NoopLogger)
  const body = {
    "repository": { "url": "repo.etarrowo.com" },
    "commits": [ { "added": ["dog.png", "cat.png"] } ]
  }
  const context = await runStubFunctionFromBindings(SecretSanta, [
    { type: 'httpTrigger', name: 'req', direction: 'in', data: createHttpTrigger('POST', 'https://etarrowo.com', {}, {}, body)},
    { type: 'http', name: 'res', direction: 'out' }
  ])
  t.ok(context.res.body.hasOwnProperty('imageUrls'))
  t.ok(context.res.body.imageUrls === ['repo.etarrowo.com/dog.png', 'repo.etarrowo.com/cat.png'])
})