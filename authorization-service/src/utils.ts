import { get, isUndefined } from 'lodash'

export const response = (statusCode: number, body: any) => ({
    statusCode: statusCode,
    headers: {
        'Access-Control-Allow-Origin': "*",
        'Access-Control-Allow-Headers': "*"
    },
    body: JSON.stringify(body)
})

export const checkBodyParameters = (requiredParameters: string[], data: any) => {
    return requiredParameters.every((parameter) => {
        const parameterValue = get(data, parameter);

        if (isUndefined(parameterValue)) {
            return false
        }

        return true
    })
}