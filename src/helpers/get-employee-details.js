const AWS = require("aws-sdk");
const secretsmanager = new AWS.SecretsManager();
const axios = require("axios");

/*
The below function calls the bamboo api to find people on leave, if a person is on leave for 3 days
or above in a week this function would include that person in the list.
*/
async function UnavailableForMostOfTheWeek(members) {
  try {
    const response = await callBambooApi();
    const absentiesList = (response.data || []).filter(item =>
      members.includes(item.name)
    );
    absentiesList.forEach(item => {
      var date1 = new Date(item.start);
      var date2 = new Date(item.end);
      var timeDiff = date2.getTime() - date1.getTime();
      var daysDiff = timeDiff / (1000 * 3600 * 24) + 1;
      const today = new Date();
      const todayDate =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      let endDateOfTheWeek = addDays(todayDate, 4);
      endDateOfTheWeek =
        endDateOfTheWeek.getFullYear() +
        "-" +
        (endDateOfTheWeek.getMonth() + 1) +
        "-" +
        endDateOfTheWeek.getDate();

      console.log(endDateOfTheWeek);
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function callBambooApi() {
  try {
    const { SecretString } = await secretsmanager
      .getSecretValue({ SecretId: "Bamboo" })
      .promise();
    const { API_KEY } = JSON.parse(SecretString);
    const response = await axios({
      url:
        "https://api.bamboohr.com/api/gateway.php/peak/v1/time_off/whos_out/",
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: API_KEY
      }
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function absentToday(members) {
  try {
    const response = await callBambooApi();
    const absentiesList = (response.data || []).filter(item =>
      members.includes(item.name)
    );
    const today = new Date();
    const todayDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    const absentToday = absentiesList
      .filter(item => {
        const start = new Date(item.start);
        const startDate =
          start.getFullYear() +
          "-" +
          (start.getMonth() + 1) +
          "-" +
          start.getDate();
        const end = new Date(item.end);
        const endDate =
          end.getFullYear() + "-" + (end.getMonth() + 1) + "-" + end.getDate();
        if (todayDate >= startDate && todayDate <= endDate) return item;
      })
      .map(({ name }) => name);
    return absentToday;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
const members = [
  "Lauren Rodgers",
  "Michael Harrison",
  "Syed",
  "Michael Pearce",
  "Adam Waterhouse",
  "Deepak Rathee",
  "Chris Newton",
  "Mohit Khotani"
];

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

UnavailableForMostOfTheWeek(members);
module.exports = { absentToday, UnavailableForMostOfTheWeek };
