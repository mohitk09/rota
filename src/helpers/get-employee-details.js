const AWS = require('aws-sdk');

const secretsmanager = new AWS.SecretsManager();
const axios = require('axios');

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

module.exports = { getEmployeeDetails };

