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
      let todayDate = new Date();
      todayDate =
        todayDate.getFullYear() +
        "-" +
        (todayDate.getMonth() + 1) +
        "-" +
        todayDate.getDate();
      let endDateOfTheWeek = addDays(todayDate, 4);
      endDateOfTheWeek =
        endDateOfTheWeek.getFullYear() +
        "-" +
        (endDateOfTheWeek.getMonth() + 1) +
        "-" +
        endDateOfTheWeek.getDate();
      if (startDate <= endDateOfTheWeek) {
        if (endDate >= endDateOfTheWeek) {
          const timeDiffWrtWeek =
            endDateOfTheWeek.getTime() - startDate.getTime();
          const daysDiffWrtWeek = timeDiffWrtWeek / (1000 * 3600 * 24) + 1;
          if (membersUnavailability.has(item.name)) {
            const value = membersUnavailability.get(item.name);
            membersUnavailability.set(value + daysDiffWrtWeek);
          } else {
            membersUnavailability.set(daysDiffWrtWeek);
          }
        } else {
          if (todayDate >= startDate) {
            const timeDiffWrtStartDate =
              endDate.getTime() - todayDate.getTime();
            const dayDiffWrtStartDate =
              timeDiffWrtStartDate / (1000 * 3600 * 24) + 1;
            if (membersUnavailability.has(item.name)) {
              const value = membersUnavailability.get(item.name);
              membersUnavailability.set(value + dayDiffWrtStartDate);
            } else {
              membersUnavailability.set(dayDiffWrtStartDate);
            }
          } else {
            const timeDiffWrtEnd = endDate.getTime() - startDate.getTime();
            const daysDiffWrtEnd = timeDiffWrtEnd / (1000 * 3600 * 24) + 1;
            if (membersUnavailability.has(item.name)) {
              const value = membersUnavailability.get(item.name);
              membersUnavailability.set(value + daysDiffWrtEnd);
            } else {
              membersUnavailability.set(daysDiffWrtEnd);
            }
          }
        }
      }

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
