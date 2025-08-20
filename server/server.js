const http = require('http')
const { Server } = require('socket.io')
const { MongoClient } = require('mongodb')

// MongoDB Configuration
const uri = process.env.MONGODB_URI || 'mongodb+srv://bhadresh:Bhadresh984@stacks.wgww0iq.mongodb.net/'

let client
let db
let collections = {}

async function connect() {
  if (db) return { db, collections }
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  db = client.db('stacks')
  collections.users = db.collection('users')
  collections.games = db.collection('games')
  collections.bets = db.collection('bets')
  collections.ledger = db.collection('ledger')
  collections.game_sessions = db.collection('game_sessions')
  await Promise.all([
    collections.users.createIndex({ fid: 1 }, { unique: true }),
    collections.bets.createIndex({ gameNumber: 1 }),
    collections.games.createIndex({ gameNumber: 1 }, { unique: true }),
    collections.ledger.createIndex({ fid: 1, createdAt: -1 }),
    collections.game_sessions.createIndex({ 'players.fid': 1, createdAt: -1 }),
    collections.game_sessions.createIndex({ gameNumber: 1 }),
  ])
  return { db, collections }
}

async function close() {
  if (client) await client.close()
  db = null
  collections = {}
}

const httpServer = http.createServer()

// Simple REST API for user get/create with CORS
httpServer.on('request', async (req, res) => {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }

    const url = new URL(req.url || '/', 'http://localhost')
    const path = url.pathname
    const { collections } = await connect()

    if (req.method === 'GET' && path === '/health') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
      return
    }

    if (req.method === 'GET' && path === '/api/user') {
      const fid = url.searchParams.get('fid')
      if (!fid) { res.statusCode = 400; res.end(JSON.stringify({ error: 'fid required' })); return }
      const user = await collections.users.findOne({ fid: String(fid) })
      if (!user) { res.statusCode = 404; res.end(JSON.stringify({ error: 'not found' })); return }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ fid: user.fid, chips: user.chips, username: user.username, displayName: user.displayName, pfpUrl: user.pfpUrl, bio: user.bio, location: user.location, isFarcaster: !!user.isFarcaster }))
      return
    }

    if (req.method === 'POST' && path === '/api/user') {
      const chunks = []
      for await (const chunk of req) { chunks.push(chunk) }
      const bodyStr = Buffer.concat(chunks).toString('utf8')
      let payload = {}
      try { payload = JSON.parse(bodyStr || '{}') } catch {}
      const fid = String(payload.fid || '')
      if (!fid) { res.statusCode = 400; res.end(JSON.stringify({ error: 'fid required' })); return }
      const isFarcaster = /^\d+$/.test(fid)
      const now = new Date()
      const existing = await collections.users.findOne({ fid })
      if (existing) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ fid: existing.fid, chips: existing.chips }))
        return
      }
      await collections.users.insertOne({
        fid,
        chips: isFarcaster ? 1000 : 0,
        isFarcaster,
        username: payload.username,
        displayName: payload.displayName,
        pfpUrl: payload.pfpUrl,
        bio: payload.bio,
        location: payload.location,
        createdAt: now,
        updatedAt: now,
      })
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ fid, chips: isFarcaster ? 1000 : 0 }))
      return
    }

    if (req.method === 'GET' && path === '/api/user-stats') {
      const fid = url.searchParams.get('fid')
      if (!fid) { res.statusCode = 400; res.end(JSON.stringify({ error: 'fid required' })); return }
      
      try {
        console.log('📊 Server: Fetching stats for FID:', fid)
        
        // Get user data
        const user = await collections.users.findOne({ fid: String(fid) })
        if (!user) { 
          console.log('❌ Server: User not found for FID:', fid)
          res.statusCode = 404; res.end(JSON.stringify({ error: 'user not found' })); return 
        }

        // Get game history for this user
        const gameHistory = await collections.game_sessions
          .find({ 'players.fid': String(fid) })
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray()

        console.log('📊 Server: Found', gameHistory.length, 'games for FID:', fid)

        // Calculate statistics
        let gamesPlayed = 0
        let wins = 0
        let currentStreak = 0
        let maxStreak = 0
        let tempStreak = 0
        let totalEarned = 0
        let totalLost = 0

        // First pass: calculate total games, wins, max streak, and totals
        for (const game of gameHistory) {
          const playerInGame = game.players.find(p => p.fid === String(fid))
          if (playerInGame && playerInGame.amount > 0) {
            gamesPlayed++
            
            if (playerInGame.won) {
              wins++
              tempStreak++
              maxStreak = Math.max(maxStreak, tempStreak)
              totalEarned += playerInGame.payout || 0
            } else {
              tempStreak = 0
              totalLost += playerInGame.amount || 0
            }
          }
        }

        // Second pass: calculate current streak from most recent games
        tempStreak = 0
        for (const game of gameHistory) {
          const playerInGame = game.players.find(p => p.fid === String(fid))
          if (playerInGame && playerInGame.amount > 0) {
            if (playerInGame.won) {
              tempStreak++
            } else {
              break // Stop counting when we hit a loss
            }
          }
        }
        currentStreak = tempStreak

        console.log('📊 Server: Detailed calculation for FID:', fid, {
          totalGames: gameHistory.length,
          gamesWithBets: gamesPlayed,
          wins,
          losses: gamesPlayed - wins,
          currentStreak,
          maxStreak,
          totalEarned,
          totalLost,
          recentGames: gameHistory.slice(0, 5).map(g => {
            const p = g.players.find(p => p.fid === String(fid))
            return p ? { won: p.won, amount: p.amount, payout: p.payout } : null
          })
        })

        const stats = {
          gamesPlayed,
          wins,
          losses: gamesPlayed - wins,
          winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
          currentStreak,
          maxStreak,
          chips: user.chips || 0,
          totalEarned,
          totalLost
        }

        console.log('📊 Server: Stats calculated for FID:', fid, stats)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(stats))
        return
      } catch (error) {
        console.error('❌ Server: Error fetching user stats:', error)
        res.statusCode = 500; res.end(JSON.stringify({ error: 'internal server error' })); return
      }
    }

    if (req.method === 'POST' && path === '/api/user-stats') {
      const chunks = []
      for await (const chunk of req) { chunks.push(chunk) }
      const bodyStr = Buffer.concat(chunks).toString('utf8')
      let payload = {}
      try { payload = JSON.parse(bodyStr || '{}') } catch {}
      const fid = String(payload.fid || '')
      const gameResult = payload.gameResult
      
      console.log('📊 Server: POST /api/user-stats received:', { fid, gameResult, bodyStr })
      
      if (!fid || !gameResult) { 
        console.log('❌ Server: Missing required fields:', { fid, gameResult })
        res.statusCode = 400; res.end(JSON.stringify({ error: 'fid and gameResult required' })); return 
      }
      
      try {
        const updateData = { 
          $set: { updatedAt: new Date() },
          $inc: {}
        }
        
        if (gameResult.won) {
          updateData.$inc.totalEarned = gameResult.payout || 0
        } else {
          updateData.$inc.totalLost = gameResult.amount || 0
        }

        await collections.users.updateOne({ fid }, updateData)
        console.log('📊 Server: Updated stats for FID:', fid, gameResult)
        
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true }))
        return
      } catch (error) {
        console.error('❌ Server: Error updating user stats:', error)
        res.statusCode = 500; res.end(JSON.stringify({ error: 'internal server error' })); return
      }
    }

    if (req.method === 'GET' && path === '/api/leaderboard') {
      const type = url.searchParams.get('type') || 'chips' // chips, wins, winRate, streak
      const limit = parseInt(url.searchParams.get('limit') || '10')
      
      try {
        console.log('🏆 Server: Fetching leaderboard type:', type, 'limit:', limit)
        
        let leaderboard = []
        
        if (type === 'chips') {
          // Top players by chip balance - only Farcaster users
          const usersWithChips = await collections.users
            .find({ chips: { $gt: 0 }, isFarcaster: true })
            .sort({ chips: -1 })
            .limit(limit * 2) // Get more users to filter
            .toArray()
          
          // Calculate stats for each user
          for (const user of usersWithChips) {
            const gameHistory = await collections.game_sessions
              .find({ 'players.fid': user.fid })
              .sort({ createdAt: -1 })
              .limit(100)
              .toArray()

            let gamesPlayed = 0
            let wins = 0
            let currentStreak = 0
            let maxStreak = 0
            let tempStreak = 0

            // Calculate stats
            for (const game of gameHistory) {
              const playerInGame = game.players.find(p => p.fid === user.fid)
              if (playerInGame && playerInGame.amount > 0) {
                gamesPlayed++
                
                if (playerInGame.won) {
                  wins++
                  tempStreak++
                  maxStreak = Math.max(maxStreak, tempStreak)
                } else {
                  tempStreak = 0
                }
              }
            }

            // Calculate current streak
            tempStreak = 0
            for (const game of gameHistory) {
              const playerInGame = game.players.find(p => p.fid === user.fid)
              if (playerInGame && playerInGame.amount > 0) {
                if (playerInGame.won) {
                  tempStreak++
                } else {
                  break
                }
              }
            }
            currentStreak = tempStreak

            const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0

            // Only include users who have actually played games or have chips
            if (gamesPlayed > 0 || user.chips > 100) {
              leaderboard.push({
                fid: user.fid,
                username: user.username || user.displayName || `User ${user.fid}`,
                displayName: user.displayName || null,
                pfpUrl: user.pfpUrl || null,
                chips: user.chips || 0,
                gamesPlayed: gamesPlayed || 0,
                wins: wins || 0,
                winRate: winRate || 0,
                currentStreak: currentStreak || 0,
                maxStreak: maxStreak || 0,
                isFarcaster: user.isFarcaster || false
              })
            }
          }
          
          // Sort by chips and limit
          leaderboard.sort((a, b) => b.chips - a.chips)
          leaderboard = leaderboard.slice(0, limit)
        } else {
          // For other types, we need to calculate stats for all Farcaster users
          const allFarcasterUsers = await collections.users.find({ isFarcaster: true }).toArray()
          
          for (const user of allFarcasterUsers) {
            const gameHistory = await collections.game_sessions
              .find({ 'players.fid': user.fid })
              .sort({ createdAt: -1 })
              .limit(100)
              .toArray()

            let gamesPlayed = 0
            let wins = 0
            let currentStreak = 0
            let maxStreak = 0
            let tempStreak = 0

            // Calculate stats
            for (const game of gameHistory) {
              const playerInGame = game.players.find(p => p.fid === user.fid)
              if (playerInGame && playerInGame.amount > 0) {
                gamesPlayed++
                
                if (playerInGame.won) {
                  wins++
                  tempStreak++
                  maxStreak = Math.max(maxStreak, tempStreak)
                } else {
                  tempStreak = 0
                }
              }
            }

            // Calculate current streak
            tempStreak = 0
            for (const game of gameHistory) {
              const playerInGame = game.players.find(p => p.fid === user.fid)
              if (playerInGame && playerInGame.amount > 0) {
                if (playerInGame.won) {
                  tempStreak++
                } else {
                  break
                }
              }
            }
            currentStreak = tempStreak

            const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0

            // Only include users who have actually played games
            if (gamesPlayed > 0) {
              leaderboard.push({
                fid: user.fid,
                username: user.username || user.displayName || `User ${user.fid}`,
                displayName: user.displayName || null,
                pfpUrl: user.pfpUrl || null,
                chips: user.chips || 0,
                gamesPlayed: gamesPlayed || 0,
                wins: wins || 0,
                winRate: winRate || 0,
                currentStreak: currentStreak || 0,
                maxStreak: maxStreak || 0,
                isFarcaster: user.isFarcaster || false
              })
            }
          }

          // Sort by the requested type
          if (type === 'wins') {
            leaderboard.sort((a, b) => b.wins - a.wins)
          } else if (type === 'winRate') {
            leaderboard.sort((a, b) => b.winRate - a.winRate)
          } else if (type === 'streak') {
            leaderboard.sort((a, b) => b.maxStreak - a.maxStreak)
          }
          
          // Filter out users with no games played for all types except chips
          if (type !== 'chips') {
            leaderboard = leaderboard.filter(player => player.gamesPlayed > 0)
          }
          
          leaderboard = leaderboard.slice(0, limit)
        }

        console.log('🏆 Server: Leaderboard calculated:', type, 'with', leaderboard.length, 'players')
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(leaderboard))
        return
      } catch (error) {
        console.error('❌ Server: Error fetching leaderboard:', error)
        res.statusCode = 500; res.end(JSON.stringify({ error: 'internal server error' })); return
      }
    }

    // Not found
    res.statusCode = 404
    res.end('Not found')
  } catch (e) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'internal' }))
  }
})

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

const suits = ['♠', '♥', '♦', '♣']
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const randomCard = () => {
  const suit = suits[Math.floor(Math.random() * suits.length)]
  const rank = ranks[Math.floor(Math.random() * ranks.length)]
  const color = suit === '♥' || suit === '♦' ? 'red' : 'black'
  return { suit, rank, color, id: `${rank}${suit}` }
}

let state = {
  phase: 'lobby',
  sessionId: 'session-1',
  playersCount: 0,
  totalBetsAndar: 0,
  totalBetsBahar: 0,
  jokerCard: randomCard(),
  drawnCards: [],
  winner: null,
  currentSide: 'andar',
  lobbyTimeLeft: 30,
  gameNumber: 1,
  lastGameWinner: null,
  lastGameJoker: null,
}

let lobbyInterval = null
let drawingInterval = null
let resultTimeout = null
const currentBets = new Map() // socketId -> { side, amount, fid }
const connectedClients = new Set()

function updatePlayersCount() {
  state.playersCount = connectedClients.size
}

function resetForNextGame() {
  state.phase = 'lobby'
  state.lobbyTimeLeft = 30
  state.jokerCard = randomCard()
  state.drawnCards = []
  state.winner = null
  state.currentSide = 'andar'
  state.gameNumber += 1
  state.totalBetsAndar = 0
  state.totalBetsBahar = 0
  currentBets.clear()
  io.emit('gameState', state)
}

// Re-added lobby timer function
function startLobbyTimer() {
  if (lobbyInterval) clearInterval(lobbyInterval)
  lobbyInterval = setInterval(() => {
    if (state.phase !== 'lobby') return
    state.lobbyTimeLeft = Math.max(0, state.lobbyTimeLeft - 1)
    io.emit('lobbyTimer', state.lobbyTimeLeft)
    if (state.lobbyTimeLeft === 0) {
      clearInterval(lobbyInterval)
      startGamePlay()
    }
  }, 1000)
}

async function persistGameSnapshot(dbCols) {
  const { games } = dbCols
  await games.updateOne(
    { gameNumber: state.gameNumber },
    {
      $set: {
        gameNumber: state.gameNumber,
        phase: state.phase,
        jokerCard: state.jokerCard,
        drawnCards: state.drawnCards,
        winner: state.winner,
        lastGameWinner: state.lastGameWinner,
        lastGameJoker: state.lastGameJoker,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  )
}

function startGamePlay() {
  state.phase = 'playing'
  state.drawnCards = []
  state.currentSide = 'andar'
  io.emit('gameState', state)

  let order = 0
  const draw = () => {
    const newCard = randomCard()
    const isMatching = newCard.rank === state.jokerCard.rank
    order += 1
    const drawnCard = { ...newCard, side: state.currentSide, isMatching, order }
    state.drawnCards.push(drawnCard)
    io.emit('cardDrawn', { card: drawnCard, currentSide: state.currentSide })

    if (isMatching) {
      clearInterval(drawingInterval)
      finishGame(drawnCard)
    } else {
      state.currentSide = state.currentSide === 'andar' ? 'bahar' : 'andar'
    }
  }

  drawingInterval = setInterval(draw, 1200)
}

async function finishGame(winningCard) {
  state.phase = 'results'
  state.winner = winningCard.side

  const { collections } = await connect()
  const payouts = {}

  for (const [socketId, bet] of currentBets.entries()) {
    if (bet.side === state.winner) {
      const payout = Math.floor(bet.amount * 1.9)
      payouts[socketId] = payout
      await collections.users.updateOne(
        { fid: bet.fid },
        { $inc: { chips: payout } }
      )
    }
  }

  await collections.games.updateOne(
    { gameNumber: state.gameNumber },
    { $set: { winner: state.winner, drawnCards: state.drawnCards, finishedAt: new Date() } },
    { upsert: true }
  )

  // Save game session for statistics
  try {
    const gameSession = {
      gameNumber: state.gameNumber,
      sessionId: state.sessionId,
      jokerCard: state.jokerCard,
      winner: state.winner,
      drawnCards: state.drawnCards,
      totalBetsAndar: state.totalBetsAndar,
      totalBetsBahar: state.totalBetsBahar,
      players: Array.from(currentBets.entries()).map(([socketId, bet]) => ({
        socketId,
        fid: bet.fid,
        side: bet.side,
        amount: bet.amount,
        won: bet.side === state.winner,
        payout: bet.side === state.winner ? Math.floor(bet.amount * 1.9) : 0
      })),
      createdAt: new Date(),
      finishedAt: new Date()
    }

    await collections.game_sessions.insertOne(gameSession)
    console.log('✅ Game session saved:', gameSession.gameNumber, 'with', gameSession.players.length, 'players')
  } catch (error) {
    console.error('❌ Failed to save game session:', error)
  }

  io.emit('gameComplete', {
    winner: state.winner,
    winningCard,
    totalCards: state.drawnCards.length,
    payouts,
  })

  resultTimeout = setTimeout(async () => {
    state.lastGameWinner = state.winner
    state.lastGameJoker = state.jokerCard
    await persistGameSnapshot(collections)
    resetForNextGame()
    startLobbyTimer()
  }, 5000)
}

io.on('connection', async (socket) => {
  connectedClients.add(socket.id)
  updatePlayersCount()

  const { collections } = await connect()

  // Require fid from client; treat numeric as Farcaster fid, else browser-generated u_*
  const fidRaw = socket.handshake.auth?.fid
  if (!fidRaw) { socket.disconnect(true); return }
  const fid = String(fidRaw)
  const isFarcaster = /^\d+$/.test(fid)
  socket.data.fid = fid

  let existing = await collections.users.findOne({ fid })
  if (!existing) {
    await collections.users.insertOne({ fid, chips: isFarcaster ? 1000 : 0, isFarcaster, createdAt: new Date(), updatedAt: new Date() })
    existing = await collections.users.findOne({ fid })
  }
  socket.emit('userInfo', { fid: existing.fid, chips: existing.chips })

  socket.emit('gameState', state)
  io.emit('gameState', state)

  socket.on('joinSession', ({ playerName } = {}) => {
    socket.data.playerName = playerName || 'Anonymous'
  })

  socket.on('requestUserInfo', async () => {
    try {
      const user = await collections.users.findOne({ fid: socket.data.fid })
      if (user) {
        socket.emit('userInfo', { fid: user.fid, chips: user.chips })
        console.log('Server: Sent user info for FID', user.fid, 'chips:', user.chips)
      } else {
        console.log('Server: User not found for FID', socket.data.fid)
      }
    } catch (error) {
      console.log('Server: Error fetching user info for FID', socket.data.fid, error)
    }
  })

  socket.on('farcasterUser', async (payload) => {
    try {
      const farFid = String(payload?.fid ?? '')
      if (!/^\d+$/.test(farFid)) return

      const randomFid = socket.data.fid
      // If current session uses a random fid, migrate to Farcaster fid
      if (randomFid && randomFid !== farFid && randomFid.startsWith('u_')) {
        const randUser = await collections.users.findOne({ fid: randomFid })
        const farUser = await collections.users.findOne({ fid: farFid })
        const randChips = randUser?.chips ?? 0
        const farChips = farUser?.chips ?? 0
        const totalChips = randChips + farChips
        await collections.users.updateOne(
          { fid: farFid },
          { $set: { chips: totalChips, isFarcaster: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        )
        if (randUser) {
          await collections.users.deleteOne({ fid: randomFid })
        }
        // Update session fid
        socket.data.fid = farFid
        // Update in-memory bet record fid if exists
        const bet = currentBets.get(socket.id)
        if (bet) {
          bet.fid = farFid
          currentBets.set(socket.id, bet)
        }
      }

      // Upsert profile fields on Farcaster fid
      await collections.users.updateOne(
        { fid: farFid },
        {
          $set: {
            username: payload.username,
            displayName: payload.displayName,
            pfpUrl: payload.pfpUrl,
            bio: payload.bio,
            location: payload.location,
            isFarcaster: true,
            updatedAt: new Date(),
          },
          $setOnInsert: { chips: 1000, createdAt: new Date() },
        },
        { upsert: true }
      )

      const updated = await collections.users.findOne({ fid: farFid })
      socket.emit('userInfo', { fid: updated?.fid, chips: updated?.chips ?? 0 })
    } catch {}
  })

  socket.on('placeBet', async ({ side, amount }) => {
    const amt = Number(amount) || 0
    if (state.phase !== 'lobby' || amt <= 0) return

    const u = await collections.users.findOne({ fid: socket.data.fid })
    if (!u || u.chips < amt) {
      socket.emit('gameError', 'Insufficient chips')
      return
    }

    await collections.users.updateOne({ fid: u.fid }, { $inc: { chips: -amt }, $set: { updatedAt: new Date() } })
    await collections.bets.insertOne({
      gameNumber: state.gameNumber,
      fid: u.fid,
      socketId: socket.id,
      side,
      amount: amt,
      placedAt: new Date(),
    })

    currentBets.set(socket.id, { side, amount: amt, fid: u.fid })
    if (side === 'andar') state.totalBetsAndar += amt
    if (side === 'bahar') state.totalBetsBahar += amt

    const updated = await collections.users.findOne({ fid: u.fid })
    socket.emit('chipsUpdate', { chips: updated?.chips ?? u.chips - amt })

    io.to(socket.id).emit('betAccepted', {
      playerId: socket.id,
      side,
      amount: amt,
      totalBetsAndar: state.totalBetsAndar,
      totalBetsBahar: state.totalBetsBahar,
    })

    io.emit('betUpdate', { playerId: socket.id, side, amount: amt })
    io.emit('gameState', state)
  })

  socket.on('chips:add', async (amount) => {
    const amt = Number(amount) || 0
    if (amt <= 0) return
    const fid = socket.data.fid
    await collections.users.updateOne({ fid }, { $inc: { chips: amt }, $set: { updatedAt: new Date() } })
    await collections.ledger.insertOne({ fid, type: 'credit', amount: amt, reason: 'manual', createdAt: new Date() })
    const updated = await collections.users.findOne({ fid })
    socket.emit('chipsUpdate', { chips: updated?.chips ?? 0 })
  })

  socket.on('chips:sub', async (amount) => {
    const amt = Number(amount) || 0
    if (amt <= 0) return
    const fid = socket.data.fid
    const u = await collections.users.findOne({ fid })
    if (!u || u.chips < amt) {
      socket.emit('gameError', 'Insufficient chips')
      return
    }
    await collections.users.updateOne({ fid }, { $inc: { chips: -amt }, $set: { updatedAt: new Date() } })
    await collections.ledger.insertOne({ fid, type: 'debit', amount: amt, reason: 'manual', createdAt: new Date() })
    const updated = await collections.users.findOne({ fid })
    socket.emit('chipsUpdate', { chips: updated?.chips ?? 0 })
  })

  socket.on('leaveSession', () => {
    currentBets.delete(socket.id)
    socket.disconnect(true)
  })

  socket.on('ping', () => {
    socket.emit('pong')
  })

  socket.on('disconnect', () => {
    currentBets.delete(socket.id)
    connectedClients.delete(socket.id)
    updatePlayersCount()
    io.emit('gameState', state)
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`)
  startLobbyTimer()
}) 