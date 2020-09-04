var slack = require('slack-notify')(process.env.WEBHOOK_URL);
const sendSlackNotifications = async (name) => {
    slack.send({
        channel: process.env.CHANNEL_NAME,
        text: `Engineer for today is ${name}`,
        icon_emoji: ':responsible:',
      });
};

module.exports = { sendSlackNotifications };