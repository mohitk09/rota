var slack = require("slack-notify")(process.env.WEBHOOK_URL);

const wait = time =>
  new Promise(resolve => {
    setTimeout(() => resolve(), time);
  });

const sendSlackNotifications = async (name, credits, message) => {
  await slack.send({
    channel: process.env.CHANNEL_NAME,
    text: `${message} ${name}`,
    icon_emoji: ":responsible:",
    username: "ROTA",
    fields: {
      "Number of days done": credits
    },
    color: "good"
  });
  await wait(1500);
  return null;
};

module.exports = { sendSlackNotifications };
