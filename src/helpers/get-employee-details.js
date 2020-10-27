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
    let membersUnavailability = new Map();
    absentiesList.forEach(item => {
      const startDate = new Date(item.start);
      const endDate = new Date(item.end);
      const todayDate = new Date();
      const formattedTodayDate =
        todayDate.getFullYear() +
        "-" +
        (todayDate.getMonth() + 1) +
        "-" +
        todayDate.getDate();
      const endDateOfTheWeek = addDays(todayDate, 3);
      const formattedEndDateOfTheWeek =
        endDateOfTheWeek.getFullYear() +
        "-" +
        (endDateOfTheWeek.getMonth() + 1) +
        "-" +
        endDateOfTheWeek.getDate();
      console.log(item);
      if (item.start <= formattedEndDateOfTheWeek) {
        if (item.end >= formattedEndDateOfTheWeek) {
          const timeDiffWrtWeek =
            endDateOfTheWeek.getTime() - startDate.getTime();
          const daysDiffWrtWeek = Math.floor(
            timeDiffWrtWeek / (1000 * 3600 * 24) + 1
          );
          if (membersUnavailability.has(item.name)) {
            membersUnavailability.set(
              item.name,
              membersUnavailability.get(item.name) + daysDiffWrtWeek
            );
          } else {
            membersUnavailability.set(item.name, daysDiffWrtWeek);
          }
        } else {
          if (formattedTodayDate >= item.start) {
            const timeDiffWrtStartDate =
              endDate.getTime() - todayDate.getTime();
            const dayDiffWrtStartDate =
              timeDiffWrtStartDate / (1000 * 3600 * 24) + 1;
            if (membersUnavailability.has(item.name)) {
              const value = membersUnavailability.get(item.name);
              membersUnavailability.set(item.name, value + dayDiffWrtStartDate);
            } else {
              membersUnavailability.set(item.name, dayDiffWrtStartDate);
            }
          } else {
            const timeDiffWrtEnd = endDate.getTime() - startDate.getTime();
            const daysDiffWrtEnd = timeDiffWrtEnd / (1000 * 3600 * 24) + 1;
            if (membersUnavailability.has(item.name)) {
              const value = membersUnavailability.get(item.name);
              membersUnavailability.set(item.name, value + daysDiffWrtEnd);
            } else {
              membersUnavailability.set(item.name, daysDiffWrtEnd);
            }
          }
        }
      }
    });

    for (let [key, value] of membersUnavailability.entries()) {
      console.log(key + " = " + value);
    }
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
  result.setDate(date.getDate() + days);
  return result;
}

UnavailableForMostOfTheWeek(members);
module.exports = { absentToday, UnavailableForMostOfTheWeek };
