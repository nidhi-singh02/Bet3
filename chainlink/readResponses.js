const { decodeResult, ReturnType } = require("@chainlink/functions-toolkit");
const { Contract } = require("ethers");

const { signer } = require("../connection.js");
const { abi } = require("../contracts/abi/FunctionsConsumer.json");



const consumerAddress = "0x3e37D4b2cC189dD3a4ef34d0aBB17e5842239004"
const readResponse = async () => {
  const functionsConsumer = new Contract(consumerAddress, abi, signer);

  const responseBytes = await functionsConsumer.s_lastResponse()
  console.log("\nResponse Bytes : ", responseBytes)

  const decodedResponse = decodeResult(responseBytes, ReturnType.uint)

  console.log("\nDecoded response from API:", decodedResponse)
};

readResponse().catch(err => {
  console.log("Error reading response: ", err);
});
