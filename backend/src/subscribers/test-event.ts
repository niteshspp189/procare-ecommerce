import { 
  type SubscriberConfig, 
  type SubscriberArgs,
} from "@medusajs/framework"

export default async function testHandler({
  event: { data, name },
}: SubscriberArgs<any>) {
  console.log(`!!! TEST SUBSCRIBER TRIGGERED !!! Event: ${name}, Data: ${JSON.stringify(data)}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
