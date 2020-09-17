# Rota
Lists the order in which people will take turns. This project will give all the team members equal 
responsibility to do a particular job. It can be giving demonstration on sprint retro, taking
stand up actions, etc. A member will be picked daily so that it is more optimal and less biased
than picking members weekly. Currently we use some random spinner, which is not very accurate in 
picking up the members. This project takes care of people who are on leave by calling Bamboo Apis 
and making them unavailable for that day, and then next person is given the turn. There is a lambda
function `pickMember` which gets triggered by a cloudwatch event rule, the cron for that lambda is
configured to run at a set time from monday to friday. The output from that lambda function is
shown on the slack channel. The output on the slack channel looks something like this:-

![logo](slack-output.png)

