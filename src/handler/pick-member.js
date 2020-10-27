const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const { sendSlackNotifications } = require("../helpers/notify-slack");
const {
  absentToday,
  UnavailableForMostOfTheWeek
} = require("../helpers/get-employee-details");

const pickMember = async event => {
  let message = "Engineer for today is";
  const { stage } = process.env;
  const { teamName, source, name } = event;
  try {
    const params = {
      TableName: `ais-${stage}-rota`,
      KeyConditionExpression: "#teamName = :teamName",
      ExpressionAttributeNames: {
        "#teamName": "teamName"
      },
      ExpressionAttributeValues: {
        ":teamName": teamName
      }
    };

    const { Items } = await dynamodb.query(params).promise();
    const { members, daysElapsed } = Items[0];

    if (!source) {
      members.forEach(item => {
        if (item.name === name) {
          item.credits -= 1;
          item.current = item.previous;
        }
      });

      const updateParams = {
        ExpressionAttributeNames: {
          "#members": "members"
        },
        ExpressionAttributeValues: {
          ":members": members
        },
        Key: {
          teamName: teamName
        },
        ReturnValues: "ALL_NEW",
        TableName: `ais-${stage}-rota`,
        UpdateExpression: "SET #members = :members"
      };
      await dynamodb.update(updateParams).promise();
    }

    // sorting the members so that minimum credit person is picked first
    members.sort((a, b) => {
      // in case the credits are equal person who did last would be picked first
      if (a.credits === b.credits) return a.current - b.current;
      return a.credits - b.credits;
    });
    const memberNames = members.map(item => item.name);

    let absentiesList = [];
    let updatedDays = daysElapsed;

    // gets called only when lambda is triggered from the slack
    if (!source) absentiesList = await absentToday(memberNames);
    // Called every Monday from cloudwatch event rule
    else absentiesList = await UnavailableForMostOfTheWeek(memberNames);

    //check availability of member here and also decrement the count of the selected member
    let personSelected = members[0].name;
    let personCredits = members[0].credits;
    for (let i = 0; i < members.length; i++) {
      if (
        !absentiesList.includes(members[i].name) &&
        name !== members[i].name
      ) {
        personSelected = members[i].name;
        personCredits = members[i].credits;
        members[i].previous = members[i].current;
        members[i].current = new Date().valueOf();
        members[i].credits += 1;
        // if triggered by cloudwatch event rule total credits would be 5
        if (source) {
          updatedDays += 5;
          members[i].credits += 4;
          message = "Engineer for this week is";
        }
        break;
      }
    }

    const updateParams = {
      ExpressionAttributeNames: {
        "#members": "members",
        "#daysElapsed": "daysElapsed"
      },
      ExpressionAttributeValues: {
        ":members": members,
        ":daysElapsed": updatedDays
      },
      Key: {
        teamName: teamName
      },
      ReturnValues: "ALL_NEW",
      TableName: `ais-${stage}-rota`,
      UpdateExpression: "SET #members = :members, #daysElapsed = :daysElapsed"
    };

    await Promise.all([
      dynamodb.update(updateParams).promise(),
      sendSlackNotifications(personSelected, personCredits, message)
    ]);
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = { pickMember };
