import { NowRequest, NowResponse } from '@now/node';
import Web3 from 'web3'

const lotteryABI = require('../contracts/lottery')

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    "https://bsc-dataseed.binance.org"
  )
);

const lottery = async (history:number) => {
  const lottery = new web3.eth.Contract(lotteryABI, '0xbBC1779d0036928F8466c72Cd6b56581C2026bf7');

  const issueIndex = await lottery.methods.issueIndex().call()

  let finalNumbers = []
  for (let i = issueIndex - 1; i >= 0 && issueIndex - i < history; i--) {
    let numbers1 = []
    let numbers2 = []
    numbers1.push(await lottery.methods.historyNumbers(i, 0).call())
    numbers1.push(await lottery.methods.historyNumbers(i, 1).call())
    numbers1.push(await lottery.methods.historyNumbers(i, 2).call())
    numbers1.push(await lottery.methods.historyNumbers(i, 3).call())

    numbers2.push(await lottery.methods.historyAmount(i, 0).call())
    numbers2.push(await lottery.methods.historyAmount(i, 1).call())
    numbers2.push(await lottery.methods.historyAmount(i, 2).call())
    numbers2.push(await lottery.methods.historyAmount(i, 3).call())

    numbers2 = numbers2.map(n => parseInt(n)/1e18)

    finalNumbers.push({
      issueIndex: i,
      numbers1,
      numbers2
    })
  }
  return finalNumbers
}

export default async (_req: NowRequest, res: NowResponse) => {
  const { history = 10 } = _req.query
  const data = await lottery(history)
  res.status(200).send(data);
};
