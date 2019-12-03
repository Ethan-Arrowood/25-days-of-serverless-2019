import tap from 'tap'
import { runStubFunctionFromBindings, createHttpTrigger, setContextLogger } from 'stub-azure-function-context'
import SecretSanta from '../SecretSanta'

// Currently invalid

tap.test('SecretSanta should return png files', async t => {
  setContextLogger({log: () => {}}) // noop logger
  const url = "https://repo.etarrowo.com"
  const imagePath = "SecretSanta/bulldog.png"
  const body = {
    "repository": {
      "url": url
    },
    "commits": [
      {
        "added": [ 
          'SecretSanta/index.js', // this file should not be in res.imagesAdded
          imagePath 
        ]
      }
    ]
  }
  const context = await runStubFunctionFromBindings(SecretSanta, [
    { type: 'httpTrigger', name: 'req', direction: 'in', data: createHttpTrigger('POST', 'http://etarrowo.com', {}, {}, body)},
    { type: 'http', name: 'res', direction: 'out' }
  ])
  console.log(context.res)
  t.ok(context.res.body.imagesAdded.length === 1, 'imagesAdded should contain a single image')
  t.ok(context.res.body.imagesAdded[0] === `${url}/${imagePath}`, 'image path should be url/imagePath')
})

tap.test('SecretSanta should return 400 if body is missing required property: ', async t => {
  setContextLogger({log: () => {}}) // noop logger
  t.test('`commits`', async t => {
    const body = {}
    const context = await runStubFunctionFromBindings(SecretSanta, [
      { type: 'httpTrigger', name: 'req', direction: 'in', data: createHttpTrigger('POST', 'http://etarrowo.com', {}, {}, body)},
      { type: 'http', name: 'res', direction: 'out' }
    ])
    t.ok(context.res.status === 400)
    t.ok(context.res.body === 'Request body is missing property `commits`')
  })
  t.test('`repository`', async t => {
    const body = {
      "commits": []
    }
    const context = await runStubFunctionFromBindings(SecretSanta, [
      { type: 'httpTrigger', name: 'req', direction: 'in', data: createHttpTrigger('POST', 'http://etarrowo.com', {}, {}, body)},
      { type: 'http', name: 'res', direction: 'out' }
    ])
    t.ok(context.res.status === 400)
    t.ok(context.res.body === 'Request body is missing property `repository`')
  })
  t.test('`repository.url`', async t => {
    const body = {
      "commits": [],
      "repository": {}
    }
    const context = await runStubFunctionFromBindings(SecretSanta, [
      { type: 'httpTrigger', name: 'req', direction: 'in', data: createHttpTrigger('POST', 'http://etarrowo.com', {}, {}, body)},
      { type: 'http', name: 'res', direction: 'out' }
    ])
    console.log(context.res)
    t.ok(context.res.status === 400)
    t.ok(context.res.body === 'Request body is missing property `repository.url`')
  })
})