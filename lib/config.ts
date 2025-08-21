export type AppConfig = {
  env: 'development' | 'production' | 'test'
  appUrl: string
  socketUrl: string
  farcaster: {
    enabled: boolean
    embed: {
      imageUrl: string
      buttonTitle: string
      name: string
      splashImageUrl: string
      splashBackgroundColor: string
    }
  }
}

function getWindowLocationOrigin(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }
  return ''
}

const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL || getWindowLocationOrigin() || 'http://localhost:3000'

export const config: AppConfig = {
  env: (process.env.NODE_ENV as AppConfig['env']) || 'development',
  appUrl: defaultAppUrl,
  socketUrl:
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NODE_ENV === 'production' ? 'wss://webstacks.zeabur.app' : 'ws://localhost:3001'),
  farcaster: {
    enabled: (process.env.NEXT_PUBLIC_FARCASTER_ENABLED || 'true') === 'true',
    embed: {
      imageUrl: process.env.NEXT_PUBLIC_EMBED_IMAGE_URL || `${defaultAppUrl}/share_preview.png`,
      buttonTitle: process.env.NEXT_PUBLIC_EMBED_BUTTON_TITLE || 'Play Now',
      name: process.env.NEXT_PUBLIC_MINIAPP_NAME || 'Stacks',
      splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL || `${defaultAppUrl}/logo.png`,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BG || '#000000',
    },
  },
}

export default config 