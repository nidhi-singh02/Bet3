'use client'

import * as React from 'react'
import Image from 'next/image'
import { WagmiConfig } from 'wagmi'
import blockies from 'ethereum-blockies'
import {
  AvatarComponent,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { chains, config } from '@/wagmi'
import { LocalStateContextProvider } from '@/app/context'
import { Alfajores, CeloProvider } from '@celo/react-celo'
import '@celo/react-celo/lib/styles.css'
import { MetaMaskProvider } from '@metamask/sdk-react'

export const WC_PROJECT_ID = 'cbd4dfc72c388f372fc45f003becb013'

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return ensImage ? (
    <Image
      src={ensImage}
      width={size}
      height={size}
      alt="ens-avatar"
      className="rounded"
    />
  ) : (
    <Image
      src={blockies.create({ seed: address }).toDataURL()}
      width={size}
      height={size}
      alt="blockie"
      className="rounded"
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  console.log('all chains', chains)
  return (
    <WagmiConfig config={config}>
      <MetaMaskProvider
        debug={false}
        sdkOptions={{
          checkInstallationImmediately: false,
          dappMetadata: {
            name: 'Demo React App',
            url: window.location.host,
          },
        }}
      >
        <CeloProvider
          dapp={{
            name: 'react-celo demo',
            description: 'A demo DApp to showcase functionality',
            url: 'https://react-celo.vercel.app',
            icon: 'https://react-celo.vercel.app/favicon.ico',
            walletConnectProjectId: WC_PROJECT_ID,
          }}
          network={{
            name: 'Alfajores',
            rpcUrl: 'https://alfajores-forno.celo-testnet.org',
            graphQl: 'https://alfajores-blockscout.celo-testnet.org/graphiql',
            explorer: 'https://alfajores-blockscout.celo-testnet.org',
            chainId: 44787,
          }}
          defaultNetwork={Alfajores.name}
          connectModal={{
            providersOptions: { searchable: true },
          }}
        >
          <RainbowKitProvider
            chains={chains}
            avatar={CustomAvatar}
            theme={darkTheme({
              accentColor: '#375BD2',
              accentColorForeground: '#FFFFFF',
            })}
            modalSize="compact"
          >
            <LocalStateContextProvider>
              {mounted && children}
            </LocalStateContextProvider>
          </RainbowKitProvider>
        </CeloProvider>
      </MetaMaskProvider>
    </WagmiConfig>
  )
}
