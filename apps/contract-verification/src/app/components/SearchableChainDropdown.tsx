import React, { useState, useEffect, useRef, useMemo } from 'react'
import Fuse from 'fuse.js'
import { Chain } from '../types/VerificationTypes'
import { AppContext } from '../AppContext'

interface DropdownProps {
  label: string
  id: string
  setSelectedChain: (chain: Chain) => void
  selectedChain: Chain
}

export const SearchableChainDropdown: React.FC<DropdownProps> = ({ label, id, setSelectedChain, selectedChain }) => {
  const { chains } = React.useContext(AppContext)
  const ethereumChainIds = [1, 3, 4, 5, 11155111, 17000]

  // Add Ethereum chains to the head of the chains list. Sort the rest alphabetically
  const dropdownChains = useMemo(
    () =>
      chains.sort((a, b) => {
        const isAInEthereum = ethereumChainIds.includes(a.chainId)
        const isBInEthereum = ethereumChainIds.includes(b.chainId)

        if (isAInEthereum && !isBInEthereum) return -1
        if (!isAInEthereum && isBInEthereum) return 1
        if (isAInEthereum && isBInEthereum) return ethereumChainIds.indexOf(a.chainId) - ethereumChainIds.indexOf(b.chainId)

        return (a.title || a.name).localeCompare(b.title || b.name)
      }),
    [chains]
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<Chain[]>(dropdownChains)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fuse = new Fuse(dropdownChains, {
    keys: ['name'],
    threshold: 0.3,
  })

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredOptions(dropdownChains)
    } else {
      const result = fuse.search(searchTerm)
      setFilteredOptions(result.map(({ item }) => item))
    }
  }, [searchTerm, dropdownChains])

  // Close dropdown when user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setIsOpen(true)
  }

  const handleOptionClick = (option: Chain) => {
    setSelectedChain(option)
    setSearchTerm(option.name)
    setIsOpen(false)
  }

  const openDropdown = () => {
    setIsOpen(true)
    setSearchTerm('')
  }

  if (!dropdownChains || dropdownChains.length === 0) {
    return (
      <div className="dropdown">
        <label htmlFor={id}>{label}</label>
        <div>Loading chains...</div>
      </div>
    )
  }

  return (
    <div className="dropdown" ref={dropdownRef}>
      {' '}
      {/* Add ref here */}
      <label htmlFor={id}>{label}</label>
      <input type="text" value={searchTerm} onChange={handleInputChange} onClick={openDropdown} placeholder="Select a chain" className="form-control" />
      {isOpen && (
        <ul className="dropdown-menu show w-100" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredOptions.map((chain) => (
            <li key={chain.chainId} onClick={() => handleOptionClick(chain)} className={`dropdown-item ${selectedChain?.chainId === chain.chainId ? 'active' : ''}`} style={{ cursor: 'pointer', whiteSpace: 'normal' }}>
              {chain.title || chain.name} ({chain.chainId})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
