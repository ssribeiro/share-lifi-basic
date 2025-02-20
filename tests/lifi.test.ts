import "dotenv/config";
import { expect } from "chai";
import { ethers } from "ethers";

import {
  getQuote,
  QuoteRequest,
  createConfig,
  EVM,
  convertQuoteToRoute,
  executeRoute,
} from "@lifi/sdk";
import { Chain } from "viem";
import { createWalletClient, http, Client, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum, mainnet, optimism, polygon, scroll } from "viem/chains";

describe("Lifi Basic", async () => {
  it("TEST LI.FI", async () => {
    // Let's use polygon provider drpc
    const provider = new ethers.JsonRpcProvider(
      "https://lb.drpc.org/ogrpc?network=polygon&dkey=" +
        process.env.DRPC_API_KEY!
    );
    const proofProvider = await provider.getBlockNumber();
    expect(proofProvider).to.be.greaterThan(0);

    // Let's add wallet of adm
    const wallet = new ethers.Wallet(
      process.env.POLYGON_PRIVATE_KEY!,
      provider
    );
    expect(wallet.address).to.be.not.undefined;
    console.log("wallet.address", wallet.address);

    // Let's check balances on polygon.
    const balanceGasPol = await provider!.getBalance(wallet.address);
    const erc20ForBalanceUSDC = new ethers.Contract(
      "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      [
        "function balanceOf(address) view returns (uint)",
        "function decimals() view returns (uint8)",
      ],
      wallet
    );
    const balanceUSDC = await erc20ForBalanceUSDC.balanceOf(wallet.address);
    const erc20ForBalanceUSDT = new ethers.Contract(
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      [
        "function balanceOf(address) view returns (uint)",
        "function decimals() view returns (uint8)",
      ],
      wallet
    );
    const balanceUSDT = await erc20ForBalanceUSDT.balanceOf(wallet.address);
    const balances = {
      balanceGasPol,
      balanceUSDC,
      balanceUSDT,
    };
    console.log("balances", balances);
    expect(true).to.be.true;

    // Let's get route
    const headers = {
      "x-lifi-api-key": process.env.LIFI_API_KEY || "",
    };
    const params_route = {
      fromChain: 137,
      toChain: 137,
      fromToken: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
      toToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC
      fromAmount: "5000000",
      fromAddress: wallet.address,
      toAddress: wallet.address,
    };
    const paramsUrlEncoded = (params: any) => {
      return (
        "?" +
        Object.keys(params)
          .map((key) => key + "=" + params[key])
          .join("&")
      );
    };
    const result = await fetch(
      "https://li.quest/v1/quote" + paramsUrlEncoded(params_route),
      {
        method: "GET",
        headers,
      }
    );
    const response_route = await result.json();
    console.log("response_route");
    console.log(response_route);

    console.log("response_route.includedSteps[0]");
    console.log(response_route.includedSteps[0]);

    const transactionRequest = response_route.transactionRequest;
    console.log("transactionRequest", transactionRequest);
    expect(transactionRequest).to.be.exist;

    // Let's execute route.
    const tx = await wallet.sendTransaction(transactionRequest);
    try {
      await tx.wait();
    } catch (err) {
      console.log("err");
      console.log(err);
      expect(err).to.be.undefined;
    }

    console.log("tx");
    console.log(tx);
    expect(tx.hash).to.be.exist;
  }).timeout(4400000);

  it.only("TEST LI.FI WITH SDK", async () => {
    // Config li.fi with polygon:
    const account = privateKeyToAccount(
      ("0x" + process.env.POLYGON_PRIVATE_KEY!) as Hex
    );
    const chains = [arbitrum, mainnet, optimism, polygon, scroll];
    const client = createWalletClient({
      account,
      chain: mainnet,
      transport: http(),
    }) as Client;

    createConfig({
      apiKey: process.env.LIFI_API_KEY!,
      integrator: "GVNR",
      providers: [
        EVM({
          getWalletClient: async () => client,
          switchChain: async (chainId) =>
            // Switch chain by creating a new wallet client
            createWalletClient({
              account,
              chain: chains.find((chain) => chain.id == chainId) as Chain,
              transport: http(),
            }) as Client,
        }),
      ],
    });

    // Let's use polygon provider drpc
    const provider = new ethers.JsonRpcProvider(
      "https://lb.drpc.org/ogrpc?network=polygon&dkey=" +
        process.env.DRPC_API_KEY!
    );
    const proofProvider = await provider.getBlockNumber();
    expect(proofProvider).to.be.greaterThan(0);

    // Let's add wallet of adm
    const wallet = new ethers.Wallet(
      process.env.POLYGON_PRIVATE_KEY!,
      provider
    );
    expect(wallet.address).to.be.not.undefined;
    console.log("wallet.address", wallet.address);

    const quoteRequest: QuoteRequest = {
      fromChain: 137, // Arbitrum
      toChain: 137, // Optimism
      fromToken: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDC on Arbitrum
      toToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // DAI on Optimism
      fromAmount: "5000000", // 10 USDC
      // The address from which the tokens are being transferred.
      fromAddress: wallet.address,
      toAddress: wallet.address,
    };

    const quote = await getQuote(quoteRequest);

    console.log("quote");
    console.log(quote);

    // Let's check balances on polygon.
    const balanceGasPol = await provider!.getBalance(wallet.address);
    const erc20ForBalanceUSDC = new ethers.Contract(
      "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      [
        "function balanceOf(address) view returns (uint)",
        "function decimals() view returns (uint8)",
      ],
      wallet
    );
    const balanceUSDC = await erc20ForBalanceUSDC.balanceOf(wallet.address);
    const erc20ForBalanceUSDT = new ethers.Contract(
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      [
        "function balanceOf(address) view returns (uint)",
        "function decimals() view returns (uint8)",
      ],
      wallet
    );
    const balanceUSDT = await erc20ForBalanceUSDT.balanceOf(wallet.address);
    const balances = {
      balanceGasPol,
      balanceUSDC,
      balanceUSDT,
    };
    console.log("balances", balances);

    // EXECUTE
    /*
    const route = convertQuoteToRoute(quote);

    const executedRoute = await executeRoute(route, {
      // Gets called once the route object gets new updates
      updateRouteHook(route) {
        console.log("route hook update:");
        console.log(route);
        },
        });
        console.log("executedRoute");
        console.log(executedRoute);
    */
  }).timeout(4400000);
});
