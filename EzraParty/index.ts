import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { CosmosClient } from "@azure/cosmos"
import config from './config'
const uuidv4 = require('uuid/v4')

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const { endpoint, key } = config
    const client = new CosmosClient({ endpoint, key })
    const { database: { id: databaseId }, container: { id: containerId } } = config

    interface PotluckItem {
        id: string,
        user: string,
        dish: string
    }

    function fetchPropFromReq(prop) {
        return req.query[prop] || (req.body && req.body[prop])
    }

    async function createDinnerItem (user: string, dish: string) {
        return await client.database(databaseId).container(containerId).items.upsert({ id: uuidv4(), user, dish })
    }

    async function deleteDinnerItem (id: string) {
        return await client.database(databaseId).container(containerId).item(id, id).delete()
    }

    async function readDinnerItem (id: string) {
        return await client.database(databaseId).container(containerId).item(id, id).read<PotluckItem>()
    }

    async function updateDinnerItem (id: string, updates: { user?: string, dish?: string }) {
        const { resource } = await client.database(databaseId).container(containerId).item(id, id).read<PotluckItem>()
        return await client.database(databaseId).container(containerId).item(id, id).replace({ id, user: updates.user || resource.user, dish: updates.dish || resource.dish })
    }

    const crudOp = fetchPropFromReq('op')

    if (!crudOp) {
        context.res = {
            status: 400,
            body: 'Missing op property from either querystring or body of request'
        }
    } else {
        try {
            if (crudOp === 'create') {
                const user = fetchPropFromReq('user')
                const dish = fetchPropFromReq('dish')
                if (!user || !dish) {
                    context.res = {
                        status: 400,
                        body: 'Missing user or dish property from either querystring or body of request'
                    }
                } else {
                    const { resource: { id } } = await createDinnerItem(user, dish)
                    context.res = {
                        status: 200,
                        body: `Successfully created dish ${dish} for user ${user} with id: ${id}`
                    }
                }
            } else if (crudOp === 'read') {
                const id = fetchPropFromReq('id')
                if (!id) {
                    context.res = {
                        status: 400,
                        body: 'Missing id property from either querystring or body of request'
                    }
                } else {
                    const result = await readDinnerItem(id)
                    const { resource: { user, dish } } = result
                    context.res = {
                        status: 200,
                        body: `Item (${id}) - Dish (${dish}) - User (${user})`
                    }
                }
            } else if (crudOp === 'update') {
                const id = fetchPropFromReq('id')
                const updates = fetchPropFromReq('updates')
                if (!id || !updates) {
                    context.res = {
                        status: 400,
                        body: 'Missing id or updates property from either querystring or body of request'
                    }
                } else { 
                    const result = await updateDinnerItem(id, updates)
                    context.res = {
                        status: 200,
                        body: `Successfully updated item ${id}`
                    }
                }
            } else if (crudOp === 'delete') {
                const id = fetchPropFromReq('id')
                if (!id) {
                    context.res = {
                        status: 400,
                        body: 'Missing id property from either querystring or body of request'
                    }
                } else {
                    const result = await deleteDinnerItem(id)
                    context.res = {
                        status: 200,
                        body: `Successfully deleted item ${id}`
                    }
                }
            } else {
                context.res = {
                    status: 400,
                    body: 'Invalid op property. Should be: create, read, update, or delete'
                }
            }
        } catch (error) {
            context.log.error(error)
            context.res = {
                status: 500,
                body: error
            }
        }
    }

    return
}

export default httpTrigger
