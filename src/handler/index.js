const { NUM_OF_PEOPLE, NAMES_MAPPING } = require('./names_mapping');

const rota = (event) =>{
    console.log('event', event);
    /* doing this so that every person does it for atleast a week and after these number of 
    days the system can reset
    */
    const daysAfterSystemReset = NUM_OF_PEOPLE*7;
    const workingDays = NUM_OF_PEOPLE*5;
    console.log('NUm', NUM_OF_PEOPLE);

    let isAvailable  = 1;
    return null;
};

module.exports = { rota };






