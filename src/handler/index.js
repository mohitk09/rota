const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const axios = require('axios');

const url = 'https://api.bamboohr.com/api/gateway.php/peak/v1/time_off/whos_out/';

async function getEmployeeDetails(members) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        headers : {
            'accept': "application/json",
            'authorization': process.env.API_KEY
        },
      });
      const absentiesList = response.data.filter((item) => {
           return members.includes(item.name);
      });

      const today = new Date();
      const todayDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      const absentToday = absentiesList.filter((item) =>{
          const start = new Date(item.start);
          const startDate = start.getFullYear()+'-'+(start.getMonth()+1)+'-'+start.getDate();
          const end = new Date(item.end);
          const endDate = end.getFullYear()+'-'+(end.getMonth()+1)+'-'+end.getDate();
          if(todayDate >= startDate  && todayDate <= endDate){
              return item;
          }
      });
      return absentToday;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

const rota = async(event) => {
    console.log('event', event);
    const { teamName, stage } = event;

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
    const { members, daysElapsed,teamSize } = Items[0];

    // sorting the members so that minimum credit person is picked first
    members.sort((a, b) => {
        if(a.credits === b.credits) return a.lastDone-b.lastDone;
        return a.credits-b.credits;
    });
    const memberNames = members.map((item) =>  item.name);
    const absentiesList  = await getEmployeeDetails(memberNames);
    console.log('memmbes', members);
    

    for(let i=0;i<members.length;i++){
        //check availability of member here and also decrement the count of the selected member
        
    }  
    return null;
   }catch(error){
       console.log('In catch', error);
       return null;
   }
};

rota({
    teamName: 'devops',
    stage: 'test'
});
module.exports = { rota };