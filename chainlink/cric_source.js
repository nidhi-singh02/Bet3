//Sample chainlink function to get the cricket data from API
const baseUrl = "https://unofficial-cricbuzz.p.rapidapi.com/matches/get-info"
// Execute the API request (Promise)

const fetchSportData = async (sportId, param) => {
  const apiResponse = await Functions.makeHttpRequest({
      url: 'https://unofficial-cricbuzz.p.rapidapi.com/matches/get-info',
      //url: "https://unofficial-cricbuzz.p.rapidapi.com/matches/get-info?matchId=41881",
      method: 'GET',
      headers: {
          "X-RapidAPI-Key": '04d0fbab6cmshd830b1e09090ff4p1c83c9jsn888c982d57f1',
          "X-RapidAPI-Host": 'unofficial-cricbuzz.p.rapidapi.com'
      },
      params: {
        matchId: '85601',
      }
  })

  //console.log("API Reponse?", apiResponse)
  if (apiResponse.error) {
    console.error(apiResponse.error)
    throw Error("Request failed")
  }

  const { data } = apiResponse;

  //console.log('API response data:', JSON.stringify(data));
  const status = apiResponse.data.status;

  let team1 = apiResponse.data.team1.teamName;

  console.log("Team 1:", team1);
  let winner;

  if (status.includes(team1)){
    winner = 1
  }else{
    winner = 2
  }

  return Functions.encodeUint256(winner);

  // if (winner.length > 0) {
  //   // Return the first word
  //   return Functions.encodeString(winner[0]);
  // } else {
  //   // Return an empty string if the sentence is empty
  //   return '';
  // }

}

return fetchSportData(2, 41881)
