// @ts-check
import { module } from "@prisma/composer";
import { postgres, dataContract } from "@prisma/composer-prisma-cloud/orm";
import healmindContractJson from "./src/prisma/contract.json" with { type: "json" };
import healmindBackendContractJson from "./backend/src/prisma/contract.json" with { type: "json" };
import healmindService from "./service.mjs";
import healmindBackendService from "./backend/service.mjs";

export default module("moneymaker", ({ provision }) => {
  const healmindDb = provision(postgres({ name: "healminddatabase", contract: dataContract(healmindContractJson), config: "./prisma.config.ts" }));
  provision(healmindService, { deps: { db: healmindDb } });
  const healmindbackendDb = provision(postgres({ name: "healmindbackenddatabase", contract: dataContract(healmindBackendContractJson), config: "./backend/prisma.config.ts" }));
  provision(healmindBackendService, { id: "healmindbackend", deps: { db: healmindbackendDb } });
});
