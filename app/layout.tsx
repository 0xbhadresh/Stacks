import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import config from '@/lib/config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stacks',
  description: 'Andar Bahar Mini App',
}

function buildMiniAppEmbed() {
  const embed = {
    version: '1',
    imageUrl: config.farcaster.embed.imageUrl,
    button: {
      title: config.farcaster.embed.buttonTitle,
      action: {
        type: 'launch_miniapp',
        url: config.appUrl,
        name: config.farcaster.embed.name,
        splashImageUrl: config.farcaster.embed.splashImageUrl,
        splashBackgroundColor: config.farcaster.embed.splashBackgroundColor,
      },
    },
  }
  return JSON.stringify(embed)
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const miniAppMeta = buildMiniAppEmbed()

  return (
    <html lang="en">
      <head>
        <meta name="fc:miniapp" content={miniAppMeta} />
        <meta name="fc:frame" content={miniAppMeta} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
