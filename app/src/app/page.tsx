import {
  fetchCurrentGames,
  fetchTestGames,
  fetchCurrentLeagues,
} from '@/lib/fetch-data'
import { ScrollArea } from '@/components/ui/scroll-area'
import LeagueSection from '@/components/league-section'
import GameCard from '@/components/game-card'
import { leaguesData, currentSeason } from '@/config/api'
import { Sport, Game } from '@/types'
import { setLeaguesIds } from '@/lib/server-context'
import { readFileSync } from 'fs';

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {

  // Read the JSON file
// const jsonString = readFileSync('Baseball_data.json', 'utf8');

// // Parse the JSON string into a JavaScript object
// const jsonObject = JSON.parse(jsonString);
  // const currentLeagues = jsonObject
//  const currentLeagues = await fetchCurrentLeagues(Sport.Rugby)
//  console.log("currentLeagues")
//   setLeaguesIds(currentLeagues.map((l) => l.id))
//   console.log("1",1)

const allGames: Game[] = await fetchCurrentGames(Sport.Cricket, 1)
// console.log("after fetch games1",allGames)
let data = [{league:{id:1,name : "World Cup", country : "India", logo : "/Default.png"},games:allGames}]
// console.log("after fetch games2",data[0].games)

  // const data = await Promise.all(
  //   allGames.map(async (league) => {
  //     console.log("all games 1")
  //     let allGames: Game[] = await fetchCurrentGames(Sport.Rugby, league.id)
  //     console.log("all games 2")
  //     // todo: remove after implementing dummy games
  //     // if (searchParams.mode === 'test') {
  //     //   const testGames = await fetchTestGames(
  //     //     Sport.Rugby,
  //     //     league.id,
  //     //     currentSeason,
  //     //   )
  //     //   allGames = [...testGames, ...allGames]
  //     // }

  //     console.log("all games 3")
  //     const games = allGames;

  //     // const games = searchParams.search
  //     //   ? allGames.filter(
  //     //       ({ teams }) =>
  //     //         teams.home.name
  //     //           .toLowerCase()
  //     //           .includes((searchParams.search as string).toLowerCase()) ||
  //     //         teams.away.name
  //     //           .toLowerCase()
  //     //           .includes((searchParams.search as string).toLowerCase()),
  //     //     )
  //     //   : allGames
  //       console.log("our game",games)

  //     return { league: leaguesData[league.id] || league, games }
  //   }),
  // )

  return (
    <ScrollArea className="h-[calc(100vh-64px)]">
      {data.map(({ league, games }) => (
        <>
          {games.length > 0 ? (
            <LeagueSection key={league.id} league={league}>
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </LeagueSection>
          ) : null}
        </>
      ))}
    </ScrollArea>
  )
}
