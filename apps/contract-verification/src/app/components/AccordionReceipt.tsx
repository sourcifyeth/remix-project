import React, { useMemo } from 'react'
import { SubmittedContract, VerificationReceipt } from '../types'
import { shortenAddress, CustomTooltip } from '@remix-ui/helper'
import { AppContext } from '../AppContext'
import { CopyToClipboard } from '@remix-ui/clipboard'

interface AccordionReceiptProps {
  contract: SubmittedContract
  index: number
}

export const AccordionReceipt: React.FC<AccordionReceiptProps> = ({ contract, index }) => {
  const { chains } = React.useContext(AppContext)

  const [expanded, setExpanded] = React.useState(false)

  const chain = useMemo(() => {
    return chains.find((c) => c.chainId === parseInt(contract.chainId))
  }, [contract, chains])
  const chainName = chain?.name ?? 'Unknown Chain'

  const toggleAccordion = () => {
    setExpanded(!expanded)
  }

  return (
    <div className={`${expanded ? 'bg-light' : 'border-bottom '}`}>
      <div className="d-flex flex-row align-items-center">
        <button className="btn" onClick={toggleAccordion} style={{ padding: '0.45rem' }}>
          <i className={`fas ${expanded ? 'fa-angle-down' : 'fa-angle-right'} text-secondary`}></i>
        </button>

        <div className="small w-100 text-uppercase overflow-hidden text-break text-nowrap">
          <CustomTooltip placement="top" tooltipClasses="text-nowrap" tooltipText={`Contract: ${contract.contractName},  Address: ${contract.address}, Chain: ${chainName}`}>
            <span>
              {contract.contractName} at {shortenAddress(contract.address)}
            </span>
          </CustomTooltip>
        </div>

        <button className="btn" style={{ padding: '0.15rem' }}>
          <CopyToClipboard tip="Copy" content={contract.address} direction={'top'} />
        </button>
      </div>

      <div className={`${expanded ? '' : 'd-none'} px-2 pt-2 pb-3 small`}>
        <div>
          <span className="font-weight-bold">Chain: </span>
          {chainName} ({contract.chainId})
        </div>
        <div>
          <span className="font-weight-bold">File: </span>
          <span className="text-break">{contract.filePath}</span>
        </div>
        <div>
          <span className="font-weight-bold">Submitted at: </span>
          {new Date(contract.date).toLocaleString()}
        </div>

        {/* <CustomTooltip placement="top" tooltipText={`API URL: ${contract.verifierInfo}`}>
            <span>
              {contract.contractName} at {shortenAddress(contract.address)}
            </span>
          </CustomTooltip> */}
      </div>
    </div>
  )

  return (
    <div key={contract.address + '-' + index} className="bg-secondary p-3 accordion-item" id={contract.address + '-accordion-' + index}>
      <h3 className="accordion-header" id={`heading${index}`}>
        <button className="accordion-button d-flex flex-row align-items-center text-left w-100 border-0" type="button" onClick={toggleAccordion} aria-expanded={expanded} aria-controls={`collapse${index}`}>
          <span className={`accordion-arrow ${expanded ? 'fa-angle-down' : 'fa-angle-right'} fa w-0`} style={{ width: '0' }}></span>
          <span className="pl-4" style={{ fontSize: '1rem' }}>
            <CustomTooltip tooltipText={contract.address}>
              <span>{shortenAddress(contract.address)}</span>
            </CustomTooltip>{' '}
            on {chainName} {contract.proxyAddress ? 'with proxy' : ''}
          </span>
        </button>
      </h3>
      <div id={`collapse${index}`} className={`accordion-collapse p-2 collapse ${expanded ? 'show' : ''}`} aria-labelledby={`heading${index}`} data-bs-parent="#receiptsAccordion">
        <div className="accordion-body">
          <div>
            <span className="font-weight-bold">Chain ID: </span>
            {contract.chainId}
          </div>
          <div>
            <span className="font-weight-bold">File: </span>
            <span style={{ wordBreak: 'break-word' }}>{contract.filePath}</span>
          </div>
          <div>
            <span className="font-weight-bold">Contract: </span>
            <span style={{ wordBreak: 'break-word' }}>{contract.contractName}</span>
          </div>
          <div>
            <span className="font-weight-bold">Submission: </span>
            {new Date(contract.date).toLocaleString()}
          </div>
          {!contract.proxyAddress ? (
            <ReceiptsBody receipts={contract.receipts}></ReceiptsBody>
          ) : (
            <>
              <div>
                <span className="font-weight-bold" style={{ fontSize: '1.2rem' }}>
                  Implementation
                </span>
                <ReceiptsBody receipts={contract.receipts}></ReceiptsBody>
              </div>
              <div className="mt-3">
                <span className="font-weight-bold" style={{ fontSize: '1.2rem' }}>
                  Proxy
                </span>{' '}
                <CustomTooltip tooltipText={contract.proxyAddress}>
                  <span>{shortenAddress(contract.proxyAddress)}</span>
                </CustomTooltip>
                <ReceiptsBody receipts={contract.proxyReceipts}></ReceiptsBody>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const ReceiptsBody = ({ receipts }: { receipts: VerificationReceipt[] }) => {
  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Verifier</th>
            <th>API URL</th>
            <th>Status</th>
            <th>Message</th>
            <th>Link</th>
            <th>ReceiptID</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={`${receipt.isProxyReceipt ? 'proxy' : ''}-${receipt.receiptId}-${receipt.verifierInfo.name}`}>
              <td>{receipt.verifierInfo.name}</td>
              <td>{receipt.verifierInfo.apiUrl}</td>
              <td>
                <span className="font-weight-bold" style={{ textTransform: 'capitalize' }}>
                  {receipt.status}
                </span>
              </td>
              <td>{receipt.message}</td>
              <td>{!!receipt.lookupUrl && <a href={receipt.lookupUrl} target="_blank" className="fa fas fa-arrow-up-right-from-square"></a>}</td>
              <td>{receipt.receiptId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
