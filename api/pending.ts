import { NowRequest, NowResponse } from "@vercel/node";
import BigNumber from "bignumber.js";
import { getContract } from "../lib/contract";

const chefABI = require("../contracts/chef");

const getBalanceNumber = (balance: any, decimals = 18) => {
  const displayBalance = balance.dividedBy(new BigNumber(10).pow(decimals));
  return displayBalance.toNumber();
};

const pending = async (pid: number, address: string) => {
  const chef = getContract(chefABI, "0xD3849bCefE2D032b7EA4e01aA18EA5D1797bdcc6");
  const pending = await chef.methods.pendingPizza(pid, address).call();
  const poolInfo = await chef.methods.poolInfo(pid).call();
  return {
    pending: getBalanceNumber(new BigNumber(pending)),
    poolInfo,
  };
};

export default async (_req: NowRequest, res: NowResponse) => {
  const { address = "0x4cabCd8350F1A0018Bf4b15E52D262b381A0b6E8", pid = "1" } = _req.query;
  if (Array.isArray(pid)) {
    res.status(400).send({ error: "Parameter Incorrect" });
  } else {
    const data = await pending(Number(pid), address as string);
    res.status(200).send(data);
  }
};
