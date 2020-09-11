const AWS = require('aws-sdk');

const markUnavailable = async(event) => {
    console.log('event', event);
    const { stage, region } = process.env;
    const lambda = new AWS.Lambda({ region });
    const response =  lambda.invokeAsync({
        FunctionName:  `rota-${stage}-pickMember`,
        Payload: JSON.stringify(event) 
    }).promise();
    console.log('response', response);
    return null;
};

module.exports = { markUnavailable };