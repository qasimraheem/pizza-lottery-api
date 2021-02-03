import { NowRequest, NowResponse } from '@now/node';
import Web3 from 'web3'
import BigNumber from 'bignumber.js'

const chefABI = require('../contracts/chef')

const getBalanceNumber = (balance: any, decimals = 18) => {
  const displayBalance = balance.dividedBy(new BigNumber(10).pow(decimals))
  return displayBalance.toNumber()
}

const web3 = new Web3(
    new Web3.providers.HttpProvider(
        "https://bsc-dataseed.binance.org"
    )
);

const pending = async (pid: number, address: string) => {
    const chef = new web3.eth.Contract(chefABI, '0xD3849bCefE2D032b7EA4e01aA18EA5D1797bdcc6');
    const pending = await chef.methods.pendingPizza(pid, address).call()
    const poolInfo = await chef.methods.poolInfo(pid).call()
    return {
        pending: getBalanceNumber(new BigNumber(pending)),
        poolInfo
    }

}

export default async (_req: NowRequest, res: NowResponse) => {
  const { address = '0x4cabCd8350F1A0018Bf4b15E52D262b381A0b6E8', pid='1' } = _req.query
  const data = await pending(pid, address)
  res.status(200).send(data);
};
