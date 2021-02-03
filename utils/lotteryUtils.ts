import { PromisifyBatchRequest } from "../lib/PromiseBatchRequest";
import { getContract } from "../lib/contract";
import { rates, ratesOld } from "./lotteryRates";

const lotteryABI = require("../contracts/lottery");

export interface SingleLotteryReturn {
  numbers1: Promise<[string, string, string, string]>;
  numbers2: Promise<[string, string, string, string]>;
  index: number;
}

export interface Lottery {
  numbers1: [string, string, string, string];
  numbers2: Array<number>;
  issueIndex: number;
}

export interface SingleLottery {
  lotteryNumber: number;
  lotteryDate: Date;
  poolSize: number;
  lotteryNumbers: number[];
  jackpotTicket: number;
  match3Ticket: number;
  match2Ticket: number;
  poolJackpot: number;
  poolMatch3: number;
  poolMatch2: number;
  burned: number;
  contractLink: string;
}

export interface LotteryHistory {
  lotteryNumber: number;
  poolSize: number;
  burned: number;
}


export const getSingleLotteryBatch = (index: number): SingleLotteryReturn => {
  const lotteryContract = getContract(lotteryABI, "0xbBC1779d0036928F8466c72Cd6b56581C2026bf7");
  const batch = new PromisifyBatchRequest<string>();
  const batch2 = new PromisifyBatchRequest<string>();
  [
    lotteryContract.methods.historyNumbers(index, 0).call,
    lotteryContract.methods.historyNumbers(index, 1).call,
    lotteryContract.methods.historyNumbers(index, 2).call,
    lotteryContract.methods.historyNumbers(index, 3).call,
  ].map((x) => batch.add(x));
  [
    lotteryContract.methods.historyAmount(index, 0).call,
    lotteryContract.methods.historyAmount(index, 1).call,
    lotteryContract.methods.historyAmount(index, 2).call,
    lotteryContract.methods.historyAmount(index, 3).call,
  ].map((x) => batch2.add(x));

  return {
    numbers1: batch.execute() as Promise<[string, string, string, string]>,
    numbers2: batch2.execute() as Promise<[string, string, string, string]>,
    index,
  };
};


const createLotteryItem = async (
  numbers1Prom: Promise<[string, string, string, string]>,
  numbers2Prom: Promise<[string, string, string, string]>,
  index: number,
  finalNumbers: Array<Lottery>
) => {
  const numbers1 = await numbers1Prom;
  const numbers2Res = await numbers2Prom;
  const numbers2: Array<number> = numbers2Res.map((n) => parseInt(n) / 1e18);

  finalNumbers.push({
    issueIndex: index,
    numbers1,
    numbers2,
  });
};

export const getIssueIndex = async (): Promise<number | { error: string; errorMessage: string }> => {
  const lotteryContract = getContract(lotteryABI, "0xbBC1779d0036928F8466c72Cd6b56581C2026bf7");
  let issueIndex: number | undefined = undefined;
  let retryIsseIndex = 0;
  while (typeof issueIndex === "undefined" && retryIsseIndex <= 3) {
    try {
      issueIndex = Number(await lotteryContract.methods.issueIndex().call());
    } catch (error) {
      retryIsseIndex++;
    }
  }
  if (typeof issueIndex === "undefined") {
    return {
      error: "Internal Server Error",
      errorMessage: `Internal Server Error try again later`,
    };
  }
  return issueIndex;
};

export const getRates = (lotteryNumber: number) => {
  const ratesToUse = lotteryNumber >= 206 ? rates : ratesOld;
  return ratesToUse;
};

export const getAllLotteries = (issueIndex: number): Promise<Array<Lottery>> => {
  const finalNumbersProm: Array<SingleLotteryReturn> = [];
  for (let i = issueIndex - 1; i >= 0; i--) {
    finalNumbersProm.push(getSingleLotteryBatch(i));
  }
  return computeLotteries(finalNumbersProm);
};


const retry = async (index: number, finalNumbers: Array<Lottery>, retries: number) => {
  let retrySuccess = false;
  let retryCount = 0;
  while (!retrySuccess && retryCount !== retries) {
    retryCount++;
    try {
      const { numbers1: numbers1Prom, numbers2: numbers2Prom } = getSingleLotteryBatch(index);
      await createLotteryItem(numbers1Prom, numbers2Prom, index, finalNumbers);
      retrySuccess = true;
    } catch (err) {
      console.log("retry err:", err);
      console.log("retry count:", retryCount);
    }
  }
};

export const computeLotteries = async (finalNumbersProm: Array<SingleLotteryReturn>): Promise<Array<Lottery>> => {
  const finalNumbers: Array<Lottery> = [];
  try {
    for (let i = 0; i < finalNumbersProm.length; i++) {
      const { numbers1: numbers1Prom, numbers2: numbers2Prom, index } = finalNumbersProm[i];
      try {
        await createLotteryItem(numbers1Prom, numbers2Prom, index, finalNumbers);
      } catch (error) {
        await retry(index, finalNumbers, 3);
      }
    }
  } catch (error) {
    console.error(error);
  }
  return finalNumbers;
};
