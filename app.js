const dotenv = require('dotenv').config();
const YouTubeNotifier = require('youtube-notification');
const axios = require('axios');

var myLogger = function (req, res, next) {
  console.log('LOGGED')
  next()
}
//notifier.server.use(myLogger)

const notifier = new YouTubeNotifier({
  hubCallback: process.env.YOUTUBE_CALLBACK_URL,
  port: process.env.PORT,
  secret: process.env.YOUTUBE_SECRET,
  path: '/youtube',
});
notifier.setup();

notifier.on('subscribe', async data => {
  console.log('Subscribed');
  console.log(data);
  var discord_webhook
  if (process.env.MESSAGE_DISCORD === 'true') {
    const discord_content = 'Subscription to Channel ID:' + data.channel
    discord_webhook = await axios({
      method: "POST",
      url: process.env.DISCORD_WEBHOOK,
      headers: {
        "Content-Type": 'application/json',
      },
      data: {
        "username": `Youtube PubSub Test`,
        "content": discord_content,
      }
    })
  }
});

notifier.on('unsubscribe', data => {
  console.log('Unsubscribed');
  console.log(data);
});

notifier.on('denied', data => {
  console.log('Denied');
  console.log(data);
});

notifier.on('notified', data => {
  console.log('New Video');
  console.log(data);
});

console.log('Listening on port ' + process.env.PORT);

notifier.server.get('/', function (req, res) {
  res.status(200).send('The webiste is alive.')
})

notifier.server.get('/test_discord', async function (req, res) {
  res.status(200).send('Sending message to discord if permitted.')
  var discord_webhook
  if (process.env.MESSAGE_DISCORD === 'true') {
    discord_webhook = await axios({
      method: "POST",
      url: process.env.DISCORD_WEBHOOK,
      headers: {
        "Content-Type": 'application/json',
      },
      data: {
        "username": `Youtube PubSub Test`,
        "content": `Call to test_discord directory`,
      }
    })
  }
})

