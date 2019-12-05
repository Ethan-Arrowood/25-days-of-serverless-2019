import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as CognitiveServicesCredentials from '@azure/ms-rest-js'
import * as TextAnalyticsAPIClient from '@azure/cognitiveservices-textanalytics'
import * as Ajv from 'ajv'           

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

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
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

    const subscriptionKey = process.env.CSTA_SUB_KEY
    const endpoint = process.env.CSTA_ENDPOINT

    const creds = new CognitiveServicesCredentials.ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': subscriptionKey } });
    const textAnalyticsClient = new TextAnalyticsAPIClient.TextAnalyticsClient(creds, endpoint);

    
    try {
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

        const detectSentimentResults = await textAnalyticsClient.sentiment({
            multiLanguageBatchInput: sentimentInput
        })

        const naughtyOrNice = {}
        const detectSentimentResultsDocuments = (detectSentimentResults as TextAnalyticsAPIClient.TextAnalyticsModels.SentimentBatchResult)['documents'] // Issue for missing type: https://github.com/Azure/azure-sdk-for-js/issues/6425
        for (let result of detectSentimentResultsDocuments) {
            naughtyOrNice[result.id] = result.score > 0.5 ? 'nice' : 'naughty'
        }

        context.res = {
            status: 200,
            body: naughtyOrNice
        }

    } catch (error) {
        context.res = {
            status: 500,
            body: error
        }
    }
    
};

export default httpTrigger;
