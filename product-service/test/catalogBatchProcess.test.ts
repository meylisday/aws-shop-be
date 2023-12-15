import { handler } from "../src/handlers/catalogBatchProcess";
import { SQSEvent } from "aws-lambda";
import { parseRecord } from "../src/utils";

jest.mock("../src/utils");
(parseRecord as jest.MockedFunction<typeof parseRecord>).mockImplementation(jest.requireActual("../src/utils").parseRecord);
jest.mock("@aws-sdk/client-sns");

const mockEventsCount = 5;
const mockEvent: SQSEvent = {
  Records: new Array(mockEventsCount).fill(null).map(() => ({
    body: JSON.stringify({
      title: "",
      description: "",
      price: 0,
      count: 0,
    }),
    messageId: "",
    receiptHandle: "",
    attributes: null as any,
    messageAttributes: null as any,
    eventSource: "",
    awsRegion: "",
    eventSourceARN: "",
    md5OfBody: "",
  })),
};

describe("Given catalogBatchProcess handler", () => {
  describe("when it is invoked", () => {
    it("should create all products", async () => {
      await handler(mockEvent);

      expect(
        parseRecord as jest.MockedFunction<typeof parseRecord>
      ).toHaveBeenCalledTimes(mockEventsCount);
    });
  });
});