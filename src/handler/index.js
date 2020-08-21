const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

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
    console.log('Items', Items);
    const { members, daysElapsed,teamSize } = Items[0];
    members.sort((a, b) => b.value - a.value);
    for(let i=0;i<members.length;i++){
        //check availability of member here and also decrement the count of the selected member
    }
    /* doing this so that every person does it for atleast a week and after these number of 
    days the system will increment the number of days
    */
    const updateDays = (daysElapsed+1)%(teamSize*5);

    if(!daysElapsed){
        // increment here count of every member by 5

    }
    console.log('members', members);    
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






