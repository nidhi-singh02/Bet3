import 'server-only'

import { cache } from 'react'
import { add, getUnixTime } from 'date-fns'
import {
  currentGameStatuses,
  currentSeason,
  leaguesCountLimit,
} from '@/config/api'
import { Sport, Game, League, LeagueResponse } from '@/types'
import { readFileSync } from 'fs';
import { json } from 'stream/consumers'

export const fetchCurrentGames = async (sport: Sport, leagueId: number) => {

  console.log("games First")
  const jsonString = readFileSync('game-baseball.json', 'utf8');
  // Parse the JSON string into a JavaScript object
  const jsonObject = JSON.parse(jsonString);
  const res1 = jsonObject

  const games: Game[] = res1.response.map((game: any) =>
    transformGame(game, sport),
  )
  console.log("games 1",games)


  // const games = await fetchGames(sport, leagueId, currentSeason)
  console.log("games our",games)
  const upcoming: Game[] = games.filter((game: Game) =>
    currentGameStatuses.includes(game.status),
  )
  return upcoming
}

const gamesPaths = {
  [Sport.Basketball]: '/games',
  [Sport.Baseball]: '/games',
  [Sport.Hockey]: '/games',
  [Sport.Rugby]: '/games',
  [Sport.Soccer]: '/fixtures',
}

export const fetchGames = async (
  sport: Sport,
  leagueId: number,
  season: number,
) => {
  const params = new URLSearchParams({
    league: leagueId.toString(),
    season: season.toString(),
  })
  
  console.log("debug1")
  // const res = await fetchSportData(sport, gamesPaths[sport], params)

  const jsonString = readFileSync('game-baseball.json', 'utf8');
  // Parse the JSON string into a JavaScript object
  const jsonObject = JSON.parse(jsonString);
  const res1 = jsonObject


  const games: Game[] = res1.response.map((game: any) =>
    transformGame(game, sport),
  )
  console.log("debugg")
  return games
}

const transformGame = (game: any, sport: Sport) => {
  switch (sport) {
    case Sport.Basketball:
    case Sport.Baseball:
    case Sport.Hockey:
    case Sport.Rugby:
      return {
        id: game.id,
        date: new Date(game.date),
        timestamp: game.timestamp,
        timezone: game.timezone,
        status: game.status.short,
        teams: {
          home: {
            name: game.teams.home.name,
            logo: game.teams.home.logo,
          },
          away: {
            name: game.teams.away.name,
            logo: game.teams.away.logo,
          },
        },
        scores: transformScore(game.scores, sport),
        sportId: sport,
      } as Game
    case Sport.Soccer:
      return {
        id: game.fixture.id,
        date: new Date(game.fixture.date),
        timestamp: game.fixture.timestamp,
        timezone: game.fixture.timezone,
        status: game.fixture.status.short,
        teams: {
          home: {
            name: game.teams.home.name,
            logo: game.teams.home.logo,
          },
          away: {
            name: game.teams.away.name,
            logo: game.teams.away.logo,
          },
        },
        scores: transformScore(game.goals, sport),
        sportId: sport,
      } as Game
    default:
      throw new Error(`Unknown sport ${sport}`)
  }
}

const transformScore = (scores: any, sport: Sport) => {
  switch (sport) {
    case Sport.Basketball:
    case Sport.Baseball:
      return {
        home: scores.home.total,
        away: scores.away.total,
      }
    case Sport.Hockey:
    case Sport.Rugby:
    case Sport.Soccer:
      return {
        home: scores.home,
        away: scores.away,
      }
    default:
      throw new Error(`Unknown sport ${sport}`)
  }
}

export const fetchCurrentLeagues = async (sport: Sport) => {
  // const res = await fetchSportData(
  //   sport,
  //   '/leagues',
  //   new URLSearchParams(),
  //   3600 * 24,
  // )

  const jsonString = readFileSync('Baseball_data.json', 'utf8');

// Parse the JSON string into a JavaScript object
const jsonObject = JSON.parse(jsonString);
// const currentLeagues = jsonObject
  let res1 = jsonObject
  const allLeagues: LeagueResponse[] = res1.response
  const currentLeagues = allLeagues.filter((league: LeagueResponse) =>
    league.seasons.some((season) => season.current === true),
  )
  // console.log("currentLeagues",currentLeagues)
  console.log("reverse",currentLeagues.reverse().slice(0, leaguesCountLimit))
  return currentLeagues.reverse().slice(0, leaguesCountLimit)
}

export const fetchLeagueDetails = async (sport: Sport, leagueId: number) => {
  const params = new URLSearchParams({
    id: leagueId.toString(),
  })
  const res = await fetchSportData(sport, '/leagues', params, 3600 * 24)
  const league = res.response[0]

  if (sport === Sport.Soccer) {
    return {
      id: league?.league.id,
      name: league?.league.name,
      country: league?.country.name,
      logo: league?.league.logo,
    } as League
  }

  return {
    id: league?.id,
    name: league?.name,
    country: league?.country.name,
    logo: league?.logo,
  } as League
}

// todo: remove after implementing dummy games
export const fetchTestGames = async (
  sport: Sport,
  leagueId: number,
  season: number,
) => {
  const games = await fetchGames(sport, leagueId, season)
  const finishedGames = games.filter((game) => game.status === 'FT')
  const testGames = finishedGames.map((game) => ({
    ...game,
    date: new Date(new Date().getTime() + 5 * 60000),
    timestamp: getUnixTime(add(new Date(), { minutes: 5 })),
  }))
  return testGames
}

const baseUrls = {
  [Sport.Basketball]: 'https://v1.basketball.api-sports.io',
  [Sport.Baseball]: 'https://v1.baseball.api-sports.io',
  [Sport.Hockey]: 'https://v1.hockey.api-sports.io',
  [Sport.Rugby]: 'https://v1.rugby.api-sports.io',
  [Sport.Soccer]: 'https://v3.football.api-sports.io',
}
const apiKey = process.env.API_KEY || ''

const fetchSportData = cache(
  async (
    sport: Sport,
    path: string,
    params: URLSearchParams,
    revalidate = 3600,
  ) => {
    const response = await fetch(
      `${baseUrls[sport]}${path}?${params.toString()}`,
      {
        headers: {
          'x-apisports-key': apiKey,
        },
        next: {
          revalidate,
        },
      },
    )
    if (response.status !== 200) {
      throw new Error(`Status ${response.status}`)
    }
    return response.json()
  },
)
