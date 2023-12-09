import { Address } from 'viem'
// import {polygonMumbai,arbitrumGoerli,scrollTestnet,celoAlfajores,baseGoerli,lineaTestnet, filecoinCalibration} from 'viem/chains'
import {polygonMumbai as chain} from 'viem/chains'

export const contractAddress = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as Address

export const currChain = chain

export const minWager = 0.00001
export const maxWager = 0.01
