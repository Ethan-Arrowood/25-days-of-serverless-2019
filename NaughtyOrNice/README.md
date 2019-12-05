# Naughty or Nice

For challenge 5, I built an Azure function that uses Azure Cognitive Services Text Analysis API to analyze messages and return if they are naughty or nice.

The function starts by retreiving a list of objects containing the messages. This is enforced using [JSON Schema]() and the [AJV]() library. 
```typescript
const documentsSchema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id": { "type": "string" },
            "text": { "type": "string" }
        },
        "required": [ "id", "text" ]
    }
}

const ajv = new Ajv()
const documentsValidator = ajv.compile(documentsSchema)

if (!req.body.hasOwnProperty('documents')) {
    context.res = {
        status: 400,
        body: 'Request body missing required property `documents`'
    }
    return 
}

const { documents } = req.body

if (!documentsValidator(documents)) {
    context.res = {
        status: 400,
        body: ajv.errorsText
    }
    return
}
```

Then it creates a connection with the Cognitive Services API and establishes a Text Analysis client for processing use. The credentials are protected using environment variables. 
```typescript
const subscriptionKey = process.env.CSTA_SUB_KEY
const endpoint = process.env.CSTA_ENDPOINT

const creds = new CognitiveServicesCredentials.ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': subscriptionKey } });
const textAnalyticsClient = new TextAnalyticsAPIClient.TextAnalyticsClient(creds, endpoint);
```

It takes the input and makes a request to `textAnalyticsClient.detectLanguage`. With this result, it prepares the input object for the sentiment analysis.
```typescript
interface documentInterface {
    id: string,
    text: string
}

function getDocumentTextById(documents: documentInterface[], id: string) {
    for (var document of documents) {
        if (document.id === id) return document.text
    }
    return ''
}

const languageInput = { documents }
const detectLanguageResults = await textAnalyticsClient.detectLanguage({
    languageBatchInput: languageInput
})

const sentimentInput = {
    documents: []
}

for (let result of detectLanguageResults.documents) {
    if (result.detectedLanguages.length > 0) {
        sentimentInput.documents.push({
            id: result.id,
            text: getDocumentTextById(documents, result.id),
            language: result.detectedLanguages[0].iso6391Name
        })
    }
}
```

Lastly, it processes the result from `textAnalyticsClient.sentiment` and checks the returned sentiment score to determine if the text was naughty or nice. Azure Cognitive Services Text Analytics can process sentiment analysis on other languages as long as you tell it what the language is! Additionally, a bug was discovered in the type definitions for Text Analytics; an [issue](https://github.com/Azure/azure-sdk-for-js/issues/6425) was opened and if advised I'll open a PR to solve it. For now a TypeScript `as <type>` is used to cast the type so the function can build properly.
```typescript
const detectSentimentResults = await textAnalyticsClient.sentiment({
    multiLanguageBatchInput: sentimentInput
})

const naughtyOrNice = {}
const detectSentimentResultsDocuments = (detectSentimentResults as TextAnalyticsAPIClient.TextAnalyticsModels.SentimentBatchResult)['documents']
for (let result of detectSentimentResultsDocuments) {
    naughtyOrNice[result.id] = result.score > 0.5 ? 'nice' : 'naughty'
}
```

An example request body for this function is:
```json
{
	"documents": [
		{
			"id": "Adam",
			"text": "爸爸和圣诞老人​​很相似"
		},
		{
			"id": "Eva",
			"text": "mina föräldrar är verkligen inte bra på tekniska saker"
		},
		{
			"id": "Jenifer",
			"text": "I really like the bike I got for a present"
		},
		{
			"id": "Sergio",
			"text": "o cachorro vizinho é estúpido e fedorento"
		},
		{
			"id": "Tracy",
			"text": "meu professor é legal"
		}
	]
}
```