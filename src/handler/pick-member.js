const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const { sendSlackNotifications } = require("../helpers/notify-slack");
const { getEmployeeDetails } = require("../helpers/get-employee-details");

const pickMember = async event => {
  const { stage } = process.env;
  const { teamName, source, name } = event;
  let peopleUnavailable = [];
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
    if (source) absentiesList = await getEmployeeDetails(memberNames);

    console.log("memmbes", members);

    //check availability of member here and also decrement the count of the selected member
    let personSelected = members[0].name;
    let personCredits = members[0].credits;
    for (let i = 0; i < members.length; i++) {
      if (
        !absentiesList.includes(members[i].name) &&
        !peopleUnavailable.includes(members[i].name)
      ) {
        personSelected = members[i].name;
        personCredits = members[i].credits;
        break;
      }
    }

    members.forEach(item => {
      if (item.name === personSelected) {
        item.credits += 1;
        item.previous = item.current;
        item.current = new Date().valueOf();
      }
    });
    const updateParams = {
      ExpressionAttributeNames: {
        "#members": "members",
        "#daysElapsed": "daysElapsed",
        "#peopleUnavailable": "peopleUnavailable"
      },
      ExpressionAttributeValues: {
        ":members": members,
        ":daysElapsed": daysElapsed + 1,
        ":peopleUnavailable": absentiesList
      },
      Key: {
        teamName: teamName
      },
      ReturnValues: "ALL_NEW",
      TableName: `ais-${stage}-rota`,
      UpdateExpression:
        "SET #members = :members, #daysElapsed = :daysElapsed, #peopleUnavailable = :peopleUnavailable"
    };

    await Promise.all([
      dynamodb.update(updateParams).promise(),
      sendSlackNotifications(personSelected, personCredits)
    ]);
    console.log("Engineer for today is", personSelected);
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = { pickMember };
