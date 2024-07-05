interface Currency {
  name: string
  symbol: string
  decimals: number
}
// types for https://chainid.network/chains.json (i.e. https://github.com/ethereum-lists/chains)
export interface Chain {
  name: string
  title?: string
  chainId: number
  shortName?: string
  network?: string
  networkId?: number
  nativeCurrency?: Currency
  rpc: Array<string>
  faucets?: string[]
  infoURL?: string
}

export type VerifierIdentifier = "Sourcify" | "Etherscan" | "Blockscout"

export interface VerifierSettings {
  apiUrl: string
  apiKey?: string
}

export interface VerifierInfo {
  name: VerifierIdentifier
  apiUrl: string
}

export interface VerificationReceipt {
  receiptId?: string
  verifierInfo: VerifierInfo
  status: string | 'error' | 'pending' | null
  message?: string
}

export interface SubmittedContract {
  type: 'contract'
  id: string
  filePath: string
  contractName: string
  chainId: string
  address: string
  date: string
  receipts: VerificationReceipt[]
}

export interface SubmittedProxyContract {
  type: 'proxy'
  id: string
  implementation: SubmittedContract
  proxy: SubmittedContract
}

// This and all nested subtypes should be pure interfaces, so they can be converted to JSON easily
export interface SubmittedContracts {
  [id: string]: SubmittedContract | SubmittedProxyContract
}

export function isProxy(contract: SubmittedContract | SubmittedProxyContract): contract is SubmittedProxyContract {
  return contract.type === 'proxy'
}

export function isContract(contract: SubmittedContract | SubmittedProxyContract): contract is SubmittedContract {
  return contract.type === 'contract'
}

export interface VerificationResponse {
  status: string | 'pending'
  receiptId: string | null
}

export interface EtherscanRequest {
  chainId?: string
  codeformat: 'solidity-standard-json-input'
  sourceCode: string
  contractaddress: string
  contractname: string
  compilerversion: string
  constructorArguements?: string
}
export interface EtherscanResponse {
  status: '0' | '1'
  message: string
  result: string
}
