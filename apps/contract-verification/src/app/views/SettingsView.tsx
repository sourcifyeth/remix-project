import { useContext, useState } from 'react'
import { SearchableChainDropdown, ConfigInput } from '../components'
import type { VerifierIdentifier, Chain, VerifierSettings, ContractVerificationSettings } from '../types'
import { mergeChainSettingsWithDefaults } from '../types'
import { AppContext } from '../AppContext'

export const SettingsView = () => {
  const { settings, setSettings } = useContext(AppContext)
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>()

  const chainSettings = selectedChain ? mergeChainSettingsWithDefaults(selectedChain.chainId.toString(), settings) : undefined

  const handleChange = (verifier: VerifierIdentifier, key: keyof VerifierSettings, value: string) => {
    const chainId = selectedChain.chainId.toString()
    const changedSettings: ContractVerificationSettings = JSON.parse(JSON.stringify(settings))

    if (!changedSettings.chains[chainId]) {
      changedSettings.chains[chainId] = { verifiers: {} }
    }
    if (!changedSettings.chains[chainId].verifiers[verifier]) {
      changedSettings.chains[chainId].verifiers[verifier] = {}
    }

    changedSettings.chains[chainId].verifiers[verifier][key] = value
    setSettings(changedSettings)
  }

  return (
    <>
      <SearchableChainDropdown label="Chain" id="network-dropdown" setSelectedChain={setSelectedChain} selectedChain={selectedChain} />

      {selectedChain && (
        <div>
          <div className="pt-2">
            <span className="font-weight-bold">Sourcify</span>
            <ConfigInput label="API URL" id="sourcify-api-url" secret={false} initialValue={chainSettings.verifiers['Sourcify']?.apiUrl ?? ''} saveResult={(result) => handleChange('Sourcify', 'apiUrl', result)} />
            <ConfigInput label="Repo URL" id="sourcify-explorer-url" secret={false} initialValue={chainSettings.verifiers['Sourcify']?.explorerUrl ?? ''} saveResult={(result) => handleChange('Sourcify', 'explorerUrl', result)} />
          </div>
          <div className="pt-2">
            <span className="font-weight-bold">Etherscan</span>
            <ConfigInput label="API Key" id="etherscan-api-key" secret={true} initialValue={chainSettings.verifiers['Etherscan']?.apiKey ?? ''} saveResult={(result) => handleChange('Etherscan', 'apiKey', result)} />
            <ConfigInput label="API URL" id="etherscan-api-url" secret={false} initialValue={chainSettings.verifiers['Etherscan']?.apiUrl ?? ''} saveResult={(result) => handleChange('Etherscan', 'apiUrl', result)} />
            <ConfigInput label="Explorer URL" id="etherscan-explorer-url" secret={false} initialValue={chainSettings.verifiers['Etherscan']?.explorerUrl ?? ''} saveResult={(result) => handleChange('Etherscan', 'explorerUrl', result)} />
          </div>
          <div className="pt-2">
            <span className="font-weight-bold">Blockscout</span>
            <ConfigInput label="Instance URL" id="blockscout-api-url" secret={false} initialValue={chainSettings.verifiers['Blockscout']?.apiUrl ?? ''} saveResult={(result) => handleChange('Blockscout', 'apiUrl', result)} />
          </div>
        </div>
      )}
    </>
  )
}
