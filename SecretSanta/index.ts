import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { extname } from 'path'

if (process.env.NODE_ENV === 'testing') {
    require('dotenv').config({ path: './test/.env.test'})
}

const sql = require('mssql')

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest) {
    context.log.info('Secret Santa Azure Function')

    const config = {
        user: process.env.SQL_DB_ADMIN_USERNAME,
        password: process.env.SQL_DB_ADMIN_PASSWORD,
        server: process.env.SQL_DB_URL,
        database: "secret_santa_pictures",
        encrypt: true
    }

    if (!req.body.hasOwnProperty('commits')) {
        context.res = {
            status: 400,
            body: 'Request body is missing property `commits`'
        }
    } else if (!req.body.hasOwnProperty('repository')) {
        context.res = {
            status: 400,
            body: 'Request body is missing property `repository`'
        }
    } else if (!req.body.repository.hasOwnProperty('url')) {
        context.res = {
            status: 400,
            body: 'Request body is missing property `repository.url`'
        }
    } else {
        const { commits, repository: { url }  } = req.body

        try {
            await sql.connect(`mssql://${process.env.SQL_DB_ADMIN_USERNAME}:${process.env.SQL_DB_ADMIN_PASSWORD}@${process.env.SQL_DB_URL}/secret_santa_pictures?encrypt=true`)
            context.log('Connection success')
            const imageUrls = []
            for (var commit of commits) {
                for (var file of commit.added) {
                    if (extname(file) === '.png') {
                        imageUrls.push(`${url}/${file}`)
                    }
                }
            }
            const values = imageUrls.map(s => `('${s}')`).join(',')
            await sql.query(`INSERT INTO [dbo].[Pictures] VALUES ${values}`)
            context.res = {
                body: { imageUrls }
            }
        } catch (err) {
            context.log.error(err)
            context.res = {
                status: 500,
                body: err
            }
        }
    }
    return context
};

export default httpTrigger;
