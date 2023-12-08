//Sample chainlink function to get the cricket data from API

// Execute the API request (Promise)
const apiResponse = await Functions.makeHttpRequest({
    url: 'https://unofficial-cricbuzz.p.rapidapi.com/matches/list',
    method: 'GET',
    headers: {
        "X-RapidAPI-Key": '04d0fbab6cmshd830b1e09090ff4p1c83c9jsn888c982d57f1',
        "X-RapidAPI-Host": 'unofficial-cricbuzz.p.rapidapi.com'
    },
    params: {
        matchState: 'recent'
    },
})

if (apiResponse.error) {
  console.error(apiResponse.error)
  throw Error("Request failed")
}

const { data } = apiResponse;

console.log('API response data:', JSON.stringify(data));

// Return Type of Match[0]
return Functions.encodeString(data.typeMatches[0].matchType)
