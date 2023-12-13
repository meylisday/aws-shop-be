import { get, isUndefined } from "lodash";
import { SQSRecord } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

export const response = (statusCode: number, body: any) => ({
  statusCode: statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  },
  body: JSON.stringify(body),
});

export const checkBodyParameters = (
  requiredParameters: string[],
  data: any
) => {
  return requiredParameters.every((parameter) => {
    const parameterValue = get(data, parameter);

    if (isUndefined(parameterValue)) {
      return false;
    }

    return true;
  });
};

export const parseRecord = (record: SQSRecord) => {
  const { body } = record;
  const {
    title = "",
    description = "",
    price = 0,
    count = 0,
  } = JSON.parse(body);

  const productId = uuidv4();
  
  return [
    {
      id: productId,
      title,
      description,
      price: Number(price),
    },
    {
      product_id: productId,
      count: Number(count),
    },
  ];
};
