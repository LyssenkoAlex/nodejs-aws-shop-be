
import { APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import { DynamoDbStore } from "../store/dynamodb/dynamodb-store";
import { ProductStore } from "../store/product-store";
import { logger, tracer, metrics } from "../powertools/utilities"
import middy from "@middy/core";
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { logMetrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const store: ProductStore = new DynamoDbStore();
const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.appendKeys({
    resource_path: event.requestContext.resourcePath
  });

  try {
    const result = await store.getProducts();

    logger.info('Products retrieved', { details: { products: result } });
    metrics.addMetric('productsRetrieved', MetricUnits.Count, 1);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: `{"products":${JSON.stringify(result)}}`,
    };
  } catch (error) {
      logger.error('Unexpected error occurred while trying to retrieve products', error as Error);

      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(error),
      };
  }
};

const handler = middy(lambdaHandler)
    .use(captureLambdaHandler(tracer))
    .use(logMetrics(metrics, { captureColdStartMetric: true }))
    .use(injectLambdaContext(logger, { clearState: true }));

export {
  handler
};