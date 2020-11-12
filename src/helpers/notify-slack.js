var slack = require("slack-notify")(process.env.WEBHOOK_URL);


const sendSlackNotifications = async (name, credits, message) => {
  await new Promise((resolve, reject) => {
    slack.send({
      channel: process.env.CHANNEL_NAME,
      text: `${message} ${name}`,
      icon_emoji: ":responsible:",
      username: "ROTA",
      fields: {
        "Number of days done": credits
      },
      color: "good"
    }, (err) => {
      if (err) reject(err);
      else resolve(null);
    });
  });
  return null;
};

module.exports = { sendSlackNotifications };
