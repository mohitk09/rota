const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const secretsmanager = new AWS.SecretsManager();
const axios = require('axios');
const { sendSlackNotifications } = require('./notify-slack');

async function getEmployeeDetails(members) {
  try {

    const  { SecretString } = await secretsmanager.getSecretValue({ SecretId: 'Bamboo' }).promise();
    const { API_KEY } = JSON.parse(SecretString);

    const response = await axios({
      url : 'https://api.bamboohr.com/api/gateway.php/peak/v1/time_off/whos_out/',
      method: 'GET',
      headers : {
          'accept': "application/json",
          'authorization': API_KEY
      },
    });
    const absentiesList = (response.data || []).filter((item) => {
          return members.includes(item.name);
    });
    const today = new Date();
    const todayDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const absentToday = absentiesList.filter((item) =>{
        const start = new Date(item.start);
        const startDate = start.getFullYear()+'-'+(start.getMonth()+1)+'-'+start.getDate();
        const end = new Date(item.end);
        const endDate = end.getFullYear()+'-'+(end.getMonth()+1)+'-'+end.getDate();
        if(todayDate >= startDate  && todayDate <= endDate) return item;
    }).map(({ name }) =>  name);
    return absentToday;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const pickMember = async(event) => {
    const { teamName, stage } = event;
    console.log('event', event);

    const params = {
        TableName: `ais-${stage}-rota`,
        KeyConditionExpression: '#teamName = :teamName',
        ExpressionAttributeNames: {
          '#teamName': 'teamName',
        },
        ExpressionAttributeValues: {
          ':teamName': teamName,
        },
      };

    try{
    const { Items } = await dynamodb.query(params).promise();
    const { members, daysElapsed } = Items[0];

    // sorting the members so that minimum credit person is picked first
    members.sort((a, b) => {
        if(a.credits === b.credits) return a.lastDone-b.lastDone;
        return a.credits-b.credits;
    });
    const memberNames = members.map((item) =>  item.name);
    const absentiesList  = await getEmployeeDetails(memberNames);
    console.log('memmbes', members);
    
    //check availability of member here and also decrement the count of the selected member
    let personSelected = members[0].name;
    let personCredits = members[0].credits;
    for(let i=0;i<members.length;i++){
      if(!absentiesList.includes(members[i].name)){
        personSelected = members[i].name;
        personCredits = members[i].credits;
        break;
      }
    }
    
    members.forEach((item) =>{
      if(item.name === personSelected){
        item.credits += 1;
        item.lastDone = new Date().valueOf();
      }
    });
    const updateParams =  {
      ExpressionAttributeNames: {
      "#members": "members", 
      "#daysElapsed": "daysElapsed",
      }, 
      ExpressionAttributeValues: {
      ':members': members,
      ':daysElapsed': daysElapsed+1,
      }, 
      Key: {
        'teamName': teamName
      },
      ReturnValues: 'ALL_NEW', 
      TableName: `ais-${stage}-rota`, 
      UpdateExpression: "SET #members = :members, #daysElapsed = :daysElapsed"
    };

    await dynamodb.update(updateParams).promise();
    await sendSlackNotifications(personSelected, personCredits);
    return null;
  }catch(error){
      console.log(error);
      return null;
  }
};

// rota({teamName: "devops", stage: "test"});

module.exports = { pickMember };