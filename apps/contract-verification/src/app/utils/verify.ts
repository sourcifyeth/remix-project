import { getNetworkName, getEtherScanApi, getReceiptStatus, getProxyContractReceiptStatus } from "."
import { CompilationResult } from "@remixproject/plugin-api"
import { CompilerAbstract } from '@remix-project/remix-solidity'
import axios from 'axios'
import { PluginClient } from "@remixproject/plugin"

const resetAfter10Seconds = (client: PluginClient, setResults: (value: string) => void) => {
  setTimeout(() => {
    client.emit("statusChanged", { key: "none" })
    setResults("")
  }, 10000)
}

export type EtherScanReturn = {
  guid: any,
  status: any,
}
export const verify = async (
  apiKeyParam: string,
  contractAddress: string,
  contractArgumentsParam: string,
  contractName: string,
  compilationResultParam: CompilerAbstract,
  chainRef: number | string,
  isProxyContract: boolean,
  expectedImplAddress: string,
  client: PluginClient,
  onVerifiedContract: (value: EtherScanReturn) => void,
  setResults: (value: string) => void
) => {
  let networkChainId
  let etherscanApi
  if (chainRef) {
    if (typeof chainRef === 'number') {
      networkChainId = chainRef
      etherscanApi = getEtherScanApi(networkChainId)
    } else if (typeof chainRef === 'string') etherscanApi = chainRef
  } else {
    const { network, networkId } = await getNetworkName(client)
    if (network === "vm") {
      return {
        succeed: false,
        message: "Cannot verify in the selected network"
      }
    } else {
      networkChainId = networkId
      etherscanApi = getEtherScanApi(networkChainId)
    }
  }

  try {
    const contractMetadata = getContractMetadata(
      // cast from the remix-plugin interface to the solidity one. Should be fixed when remix-plugin move to the remix-project repository
      compilationResultParam.data as unknown as CompilationResult,
      contractName
    )

    if (!contractMetadata) {
      return {
        succeed: false,
        message: "Please recompile contract"
      }
    }

    const contractMetadataParsed = JSON.parse(contractMetadata)

    const fileName = getContractFileName(
      // cast from the remix-plugin interface to the solidity one. Should be fixed when remix-plugin move to the remix-project repository
      compilationResultParam.data as unknown as CompilationResult,
      contractName
    )

    const jsonInput = {
      language: 'Solidity',
      sources: compilationResultParam.source.sources,
      settings: {
        optimizer: {
          enabled: contractMetadataParsed.settings.optimizer.enabled,
          runs: contractMetadataParsed.settings.optimizer.runs
        }
      }
    }

    const data: { [key: string]: string | any } = {
      apikey: apiKeyParam, // A valid API-Key is required
      module: "contract", // Do not change
      action: "verifysourcecode", // Do not change
      codeformat: "solidity-standard-json-input",
      sourceCode: JSON.stringify(jsonInput),
      contractname: fileName + ':' + contractName,
      compilerversion: `v${contractMetadataParsed.compiler.version}`, // see http://etherscan.io/solcversions for list of support versions
      constructorArguements: contractArgumentsParam ? contractArgumentsParam.replace('0x', '') : '', // if applicable
    }

    if (isProxyContract) {
      data.action = "verifyproxycontract"
      data.expectedimplementation = expectedImplAddress
      data.address = contractAddress
    } else {
      data.contractaddress = contractAddress
    }

    const body = new FormData()
    Object.keys(data).forEach((key) => body.append(key, data[key]))

    client.emit("statusChanged", {
      key: "loading",
      type: "info",
      title: "Verifying ...",
    })
    const response = await axios.post(etherscanApi, body)
    const { message, result, status } = await response.data

    if (message === "OK" && status === "1") {
      resetAfter10Seconds(client, setResults)
      let receiptStatus
      if (isProxyContract) {
        receiptStatus = await getProxyContractReceiptStatus(
          result,
          apiKeyParam,
          etherscanApi
        )
        if (receiptStatus.status === '1') {
          receiptStatus.message = receiptStatus.result
          receiptStatus.result = 'Successfully Updated'
        }
      } else receiptStatus = await getReceiptStatus(
        result,
        apiKeyParam,
        etherscanApi
      )

      const returnValue = {
        guid: result,
        status: receiptStatus.result,
        message: `Verification request submitted successfully. Use this receipt GUID ${result} to track the status of your submission`,
        succeed: true,
        isProxyContract
      }
      onVerifiedContract(returnValue)
      return returnValue
    } else if (message === "NOTOK") {
      client.emit("statusChanged", {
        key: "failed",
        type: "error",
        title: result,
      })
      const returnValue = {
        message: result,
        succeed: false,
        isProxyContract
      }
      resetAfter10Seconds(client, setResults)
      return returnValue
    }
    return {
      message: 'unknown reason ' + result,
      succeed: false
    }
  } catch (error: any) {
    console.error(error)
    setResults("Something wrong happened, try again")
    return {
      message: error.message,
      succeed: false
    }
  }
}

export const getContractFileName = (
  compilationResult: CompilationResult,
  contractName: string
) => {
  const compiledContracts = compilationResult.contracts
  let fileName = ""

  for (const file of Object.keys(compiledContracts)) {
    for (const contract of Object.keys(compiledContracts[file])) {
      if (contract === contractName) {
        fileName = file
        break
      }
    }
  }
  return fileName
}

export const getContractMetadata = (
  compilationResult: CompilationResult,
  contractName: string
) => {
  const compiledContracts = compilationResult.contracts
  let contractMetadata = ""

  for (const file of Object.keys(compiledContracts)) {
    for (const contract of Object.keys(compiledContracts[file])) {
      if (contract === contractName) {
        contractMetadata = compiledContracts[file][contract].metadata
        if (contractMetadata) {
          break
        }
      }
    }
  }
  return contractMetadata
}
