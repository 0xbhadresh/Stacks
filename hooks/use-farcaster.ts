import { useEffect, useState } from 'react'
import config from '@/lib/config'

export type FarcasterUser = {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  bio?: string
  location?: { placeId: string; description: string }
}

// Frontend-driven FID management
class FidManager {
  private static readonly FARCASTER_FID_KEY = 'farcaster_fid'
  private static readonly BROWSER_FID_KEY = 'browser_fid'
  private static readonly USER_DATA_KEY = 'user_data'

  static generateBrowserFid(): string {
    return `u_${Math.random().toString(36).slice(2, 10)}`
  }

  static getStoredFarcasterFid(): string | null {
    try {
      return localStorage.getItem(this.FARCASTER_FID_KEY)
    } catch {
      return null
    }
  }

  static getStoredBrowserFid(): string | null {
    try {
      return localStorage.getItem(this.BROWSER_FID_KEY)
    } catch {
      return null
    }
  }

  static storeFarcasterFid(fid: string): void {
    try {
      localStorage.setItem(this.FARCASTER_FID_KEY, fid)
      console.log('✅ Farcaster FID stored:', fid)
    } catch (e) {
      console.log('❌ Failed to store Farcaster FID:', e)
    }
  }

  static storeBrowserFid(fid: string): void {
    try {
      localStorage.setItem(this.BROWSER_FID_KEY, fid)
      console.log('✅ Browser FID stored:', fid)
    } catch (e) {
      console.log('❌ Failed to store Browser FID:', e)
    }
  }

  static storeUserData(user: FarcasterUser): void {
    try {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user))
      console.log('✅ User data stored:', user.fid)
    } catch (e) {
      console.log('❌ Failed to store user data:', e)
    }
  }

  static getStoredUserData(): FarcasterUser | null {
    try {
      const data = localStorage.getItem(this.USER_DATA_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  static getCurrentFid(): string {
    // Priority: Farcaster FID > Browser FID > Generate new Browser FID
    const farcasterFid = this.getStoredFarcasterFid()
    if (farcasterFid) {
      console.log('🎯 Using stored Farcaster FID:', farcasterFid)
      return farcasterFid
    }

    let browserFid = this.getStoredBrowserFid()
    if (!browserFid) {
      browserFid = this.generateBrowserFid()
      this.storeBrowserFid(browserFid)
      console.log('🎯 Generated new Browser FID:', browserFid)
    } else {
      console.log('🎯 Using stored Browser FID:', browserFid)
    }

    return browserFid
  }

  static isFarcasterFid(fid: string): boolean {
    return !fid.startsWith('u_') && !isNaN(Number(fid))
  }
}

// Frontend API calls
async function apiCall(endpoint: string, method: 'GET' | 'POST', data?: any) {
  try {
    const baseUrl = config.socketUrl.replace(/^ws/, 'http')
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    })
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.log(`❌ API call failed (${endpoint}):`, error)
    throw error
  }
}

async function getUserFromApi(fid: string) {
  return apiCall(`/api/user?fid=${fid}`, 'GET')
}

async function createUserViaApi(fid: string, profile?: Partial<FarcasterUser>) {
  return apiCall('/api/user', 'POST', { fid, ...profile })
}

async function updateChipsViaApi(fid: string, operation: 'add' | 'sub', amount: number) {
  return apiCall('/api/chips', 'POST', { fid, operation, amount })
}

// Enhanced Farcaster detection
async function detectFarcasterEnvironment() {
  console.log('🔍 Starting Farcaster environment detection...')
  
  try {
    // Method 1: Check if we're in a Mini App
    const { sdk } = await import('@farcaster/miniapp-sdk')
    console.log('📦 Farcaster SDK imported successfully')
    
    const isInMiniApp = await sdk.isInMiniApp()
    console.log('🔍 sdk.isInMiniApp() result:', isInMiniApp)
    
    if (!isInMiniApp) {
      console.log('❌ Not in a Mini App environment')
      return { isMiniApp: false, sdk: null }
    }
    
    console.log('✅ Confirmed: Running in Mini App environment')
    
    // Method 2: Try to initialize the SDK
    try {
      await sdk.actions.ready()
      console.log('✅ SDK ready() called successfully')
    } catch (readyError) {
      console.log('⚠️ SDK ready() failed:', readyError)
    }
    
    // Method 3: Check for user context using correct API
    let userContext = null
    try {
      // Context might be a Promise, so we need to await it
      const context = await sdk.context
      userContext = context?.user
      console.log('🔍 SDK context.user:', userContext)
    } catch (contextError) {
      console.log('❌ Failed to access SDK context:', contextError)
    }
    
    // Method 4: Check for other SDK properties
    console.log('🔍 SDK properties:', {
      hasContext: !!sdk.context,
      hasActions: !!sdk.actions,
      hasReady: !!sdk.actions?.ready,
      hasIsInMiniApp: !!sdk.isInMiniApp,
      contextUser: userContext,
    })
    
    return { isMiniApp: true, sdk, userContext }
  } catch (error) {
    console.log('❌ Farcaster SDK import failed:', error)
    return { isMiniApp: false, sdk: null }
  }
}

// Simplified user detection using the correct API
async function detectFarcasterUser(sdk: any) {
  console.log('👤 Starting Farcaster user detection...')
  
  try {
    // Wait a moment for SDK to be fully ready
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Use the correct API: await sdk.context.user
    const context = await sdk.context
    const user = context?.user
    console.log('🔍 Direct sdk.context.user access:', user)
    
    if (user && typeof user.fid === 'number') {
      console.log('🎉 Farcaster user detected via sdk.context.user!')
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        bio: user.bio,
        location: user.location,
      }
    }
    
    // Fallback: Try with additional delay
    console.log('🔄 User not immediately available, trying with longer delay...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const contextDelayed = await sdk.context
    const userDelayed = contextDelayed?.user
    console.log('🔍 Delayed sdk.context.user access:', userDelayed)
    
    if (userDelayed && typeof userDelayed.fid === 'number') {
      console.log('🎉 Farcaster user detected via delayed access!')
      return {
        fid: userDelayed.fid,
        username: userDelayed.username,
        displayName: userDelayed.displayName,
        pfpUrl: userDelayed.pfpUrl,
        bio: userDelayed.bio,
        location: userDelayed.location,
      }
    }
    
    // Final attempt: Check if context exists but user is null
    if (context) {
      console.log('🔍 Context exists but user is null/undefined')
      console.log('🔍 Full context object:', context)
    } else {
      console.log('❌ No context object found')
    }
    
    console.log('❌ Failed to detect Farcaster user - context.user is not available')
    return null
    
  } catch (error) {
    console.log('❌ Error accessing sdk.context.user:', error)
    return null
  }
}

export function useFarcasterMiniApp() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [currentFid, setCurrentFid] = useState<string>('')
  const [chips, setChips] = useState<number | null>(null)

  // Listen for server chip updates
  useEffect(() => {
    const handleServerChipsUpdate = (event: CustomEvent) => {
      const { chips: serverChips } = event.detail;
      console.log('💰 Farcaster: Received server chips update:', serverChips);
      setChips(serverChips);
    };

    window.addEventListener('serverChipsUpdate', handleServerChipsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('serverChipsUpdate', handleServerChipsUpdate as EventListener);
    };
  }, []);

  // Fetch user data on page reload/reconnect
  useEffect(() => {
    const fetchUserDataOnReload = async () => {
      if (currentFid && isReady) {
        try {
          const userData = await getUserFromApi(currentFid);
          if (userData && userData.chips !== undefined) {
            setChips(userData.chips);
          }
        } catch (e) {
          console.log('⚠️ Farcaster: Failed to fetch user data on reload:', e);
        }
      }
    };

    // Fetch user data when component is ready and has FID
    fetchUserDataOnReload();

    // Also fetch when window regains focus
    const handleFocus = () => {
      if (isReady && currentFid) {
        fetchUserDataOnReload();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentFid, isReady]);

  useEffect(() => {
    if (!config.farcaster.enabled) {
      console.log('🚫 Farcaster disabled in config')
      setIsReady(true)
      return
    }

    let cancelled = false

    async function init() {
      try {
        console.log('🚀 Initializing Farcaster Mini App detection...')
        console.log('🔧 Config:', { 
          enabled: config.farcaster.enabled, 
          socketUrl: config.socketUrl 
        })
        
        // Step 1: Get current FID (from storage or generate)
        const fid = FidManager.getCurrentFid()
        setCurrentFid(fid)
        console.log('📱 Current FID:', fid)

        // Step 2: Enhanced Farcaster environment detection
        const { isMiniApp: detected, sdk, userContext } = await detectFarcasterEnvironment()
        
        if (cancelled) return
        setIsMiniApp(detected)
        console.log('🔍 Final Mini App detection result:', detected)

        if (detected && sdk) {
          console.log('🎯 Mini App detected, attempting user detection...')
          
          // Step 3: Enhanced user detection
          const fcUser = await detectFarcasterUser(sdk)
          
          if (fcUser && !cancelled) {
            console.log('🎉 Farcaster user successfully detected:', fcUser.fid)
            
            // Store Farcaster data
            FidManager.storeFarcasterFid(String(fcUser.fid))
            FidManager.storeUserData(fcUser)
            
            // Update current FID
            setCurrentFid(String(fcUser.fid))
            setUser(fcUser)
            
            // Create/update user in database
            try {
              await createUserViaApi(String(fcUser.fid), fcUser)
              console.log('✅ Farcaster user created in database')
            } catch (e) {
              console.log('⚠️ Failed to create user in database:', e)
            }
          } else {
            console.log('❌ Failed to detect Farcaster user')
          }
        } else {
          console.log('ℹ️ Not in Mini App or SDK not available')
        }

        // Step 4: Get user data from database (for both Farcaster and browser users)
        try {
          const userData = await getUserFromApi(fid)
          if (userData && userData.chips !== undefined) {
            setChips(userData.chips)
            console.log('💰 User chips loaded from database:', userData.chips)
          }
        } catch (e) {
          console.log('⚠️ Failed to get user from database:', e)
          // If user doesn't exist, create them
          try {
            const newUser = await createUserViaApi(fid)
            if (newUser && newUser.chips !== undefined) {
              setChips(newUser.chips)
              console.log('💰 New user created with chips:', newUser.chips)
            }
          } catch (createError) {
            console.log('❌ Failed to create user:', createError)
          }
        }

        if (!cancelled) {
          setIsReady(true)
          console.log('✅ Farcaster initialization complete')
        }
      } catch (e: any) {
        if (!cancelled) {
          console.log('❌ Farcaster init failed:', e)
          setError(e?.message || 'Farcaster init failed')
          setIsReady(true) // Still mark as ready so app can function
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  // Helper functions for external use
  const addChips = async (amount: number) => {
    if (!currentFid) return
    try {
      const result = await updateChipsViaApi(currentFid, 'add', amount)
      if (result && result.chips !== undefined) {
        setChips(result.chips)
        console.log('💰 Chips added via API:', amount, 'New balance:', result.chips)
      }
      return result
    } catch (e) {
      console.log('❌ Failed to add chips:', e)
      throw e
    }
  }

  const subtractChips = async (amount: number) => {
    if (!currentFid) return
    try {
      const result = await updateChipsViaApi(currentFid, 'sub', amount)
      if (result && result.chips !== undefined) {
        setChips(result.chips)
        console.log('💰 Chips subtracted via API:', amount, 'New balance:', result.chips)
      }
      return result
    } catch (e) {
      console.log('❌ Failed to subtract chips:', e)
      throw e
    }
  }

  // Manual test function for debugging
  const testFarcasterDetection = async () => {
    console.log('🧪 Manual Farcaster detection test started...')
    try {
      const { isMiniApp: detected, sdk, userContext } = await detectFarcasterEnvironment()
      console.log('🧪 Test result:', { detected, hasSdk: !!sdk, userContext })
      
      if (detected && sdk) {
        const fcUser = await detectFarcasterUser(sdk)
        console.log('🧪 User detection result:', fcUser)
        return fcUser
      }
    } catch (e) {
      console.log('🧪 Test failed:', e)
    }
    return null
  }

  return { 
    isReady, 
    error, 
    enabled: config.farcaster.enabled, 
    isMiniApp, 
    user, 
    currentFid,
    chips,
    addChips,
    subtractChips,
    isFarcasterUser: user !== null && FidManager.isFarcasterFid(currentFid),
    testFarcasterDetection
  }
} 