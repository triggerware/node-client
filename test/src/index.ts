import { time } from "console";
import * as tw from "triggerware";

async function main() {
    const client = new tw.TriggerwareClient();
    await client.connect("localhost", 5221)

    console.log("--- REL DATA ---")
    let data = await client.getRelData();
    // console.log("description of group 0, index 0: ", data[0].elements[0].description);
    data.flatMap(group => group.elements).forEach((element,i) => {
        console.log("" + i + ": " + element.description)
    })


    // console.log("\n--- VIEWS ---")
    //
    // console.log("creating fol query")
    // let query = new tw.FolQuery("((x) s.t. (inflation 1990 1995 x))");
    // let view = new tw.View<any>(client, query);
    // let set = await view.execute();
    // console.log(set.cacheSnapshot().join(', '))
    //
    // console.log("\n--- PREPARED QUERIES ---")
    //
    // let prepared = new tw.PreparedQuery(client, new tw.SqlQuery("select * from inflation where year1=:y1 and year2=1995;"))
    // console.log("signature: ", prepared.inputSignatureNames)
    // await prepared.setParameter("?y1", 1980)
    // let result = await prepared.execute()
    // console.log("result was", result.cacheSnapshot().join(', '))
    //
    //
    // console.log("\n--- SUBSCRIPTIONS ---")
    //
    // class EventPrinter extends tw.Subscription<any> {
    //     handleNotification(data: any): void {
    //         console.log("received data: ", data)
    //     }
    // }
    //
    // const addNegativeTweet = (date: string, time: string, message: string, topic: string) => {
    //     let params = {
    //         "date": date,
    //         "time": time,
    //         "message": message,
    //         "topic": topic
    //     }
    //     client.call("add-negative-tweet", params)
    // }
    //
    // let sub = new EventPrinter(client, new tw.FolQuery("NEGATIVE-TWEET"))
    //
    // addNegativeTweet("2025-3-14", "6:45:00", "X-men is overrated", "movies")
    // addNegativeTweet("2025-3-14", "6:46:00", "politics are BORING", "politics")
    // addNegativeTweet("2025-3-14", "6:47:00", "", "politics")
    //
    await new Promise(resolve => setTimeout(resolve, 3000))

    client.close()
}

main();



