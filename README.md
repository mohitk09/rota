# Rota

## Description

Lists the order in which people will take turns. This project will give all the team members equal 
responsibility to do a particular job. It can be giving demonstration on sprint retro, taking
stand up actions, etc. A member will be picked daily so that it is more optimal and less biased
than picking members weekly. Currently we use some random spinner, which is not very accurate in 
picking up the members. This project takes care of people who are on leave by calling Bamboo Apis 
and making them unavailable for that day, and then next person is given the turn. There is a lambda
function `pickMember` which gets triggered by a cloudwatch event rule, the cron for that lambda is
configured to run at a set time from monday to friday. The output from that lambda function is
shown on the slack channel. The output on the slack channel looks something like this.

![logo](slack-output.png)

This project also provides the functionality to mark a person unavailable for the day. There might be
several reasons to this for example that person is busy doing some other stuff or off sick. Marking a person unavailable for the day is simple it is just invoking the lambda function from the slack 
channel. AWS chatbot service is used to integrate slack channel with the lambda, so that lambda 
function can be invoked from the slack channel only. Lambda invocation from the slack channel look 
like this.

![logo](slack-invoke.png)

## Gotchas
1. This project does not take care the account of flexible holidays as they are not recorded in 
Bamboo so if a person is absent, he shall be marked unavailable through slack channel only.
2. Some national holidays are also not stored in bamboo so people picked on that day would have the extra credit.
3. [individual auth tokens only](https://documentation.bamboohr.com/docs#section-authentication) - BambooHR doesn't allow you to create system users to use a set api key, it must be authenticated and permissioned as if it were a real user of the software.
