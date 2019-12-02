import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Spinning Dreidel...');

    const randomInt = Math.floor(Math.random() * Math.floor(4)) // Returns 0, 1, 2, or 3
    const dreidelSidesHebrew = ['נ', 'ג', 'ה', 'ש']
    const dreidelSidesEnglish = ['nun', 'gimmel', 'hay', 'shin']

    context.log(`Dreidel landed on: ${dreidelSidesHebrew[randomInt]}`)
    context.res = { 
        body: {
            hebrewCharacter: dreidelSidesHebrew[randomInt],
            englishCharacter: dreidelSidesEnglish[randomInt]
        }
    }
};

export default httpTrigger;
