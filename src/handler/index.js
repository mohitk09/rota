const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const axios = require('axios');

async function getEmployeeDetails(members) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        headers : {
            'accept': "application/json",
            'authorization': API_KEY
        },
      });
      const absentList = response.data.filter((item) => {
           return members.includes(item.name);
      });

      console.log('absenres', absentList);
      return absentList;

    } catch (error) {
      console.error(error);
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
    const absentList  = await getEmployeeDetails(memberNames);
    console.log('memmbes', members);
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();


    console.log('todat', date);

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