var slack = require('slack-notify')(process.env.WEBHOOK_URL);
const sendSlackNotifications = async (name, credits) => {
    slack.send({
        channel: process.env.CHANNEL_NAME ,
        text: `Engineer for today is ${name}`,
        icon_emoji: ':responsible:',
        username: 'ROTA',
        fields: {
            'Number of days done': credits,
          },
        color: 'good',
      });
};

module.exports = { sendSlackNotifications };