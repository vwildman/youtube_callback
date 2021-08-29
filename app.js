const dotenv = require('dotenv').config();
const YouTubeNotifier = require('youtube-notification');
const axios = require('axios');

const notifier = new YouTubeNotifier({
  hubCallback: process.env.YOUTUBE_CALLBACK_URL,
  port: process.env.PORT,
  secret: process.env.YOUTUBE_SECRET,
  path: '/youtube',
});
notifier.setup();

notifier.on('subscribe', async data => {
//  console.log('Subscribed');
//  console.log(data);
// Add message to my discord that the subscriptions have been sucessful
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

notifier.on('unsubscribe', async data => {
//  console.log('Unsubscribed');
//  console.log(data);
// Add message to my discord that an unsubscribe have been sucessful
var discord_webhook
// if (process.env.MESSAGE_DISCORD === 'true') {
  const discord_content = 'Unsubscribe received to Channel ID:' + data.channel
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
// }
});

notifier.on('denied', async data => {
  console.log('Denied');
  console.log(data);
  var discord_webhook
  // if (process.env.MESSAGE_DISCORD === 'true') {
    const discord_content = 'Denied message created. Check logs.'
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
  // }
  });

notifier.on('notified', async data => {
  console.log('New Video');
  console.log(data);
  var discord_webhook
  let youtube_title = data.video.title.trim().replace(/[-[/\]"\\]/g, '\\\$&')
  discord_webhook = await axios({
    method: "POST",
    url: process.env.PIPEDREAM_WEBHOOK,
    headers: {
      "Content-Type": 'application/json',
    },
    data: {
      "youtube_channel_id": data.video.id,
      "youtube_id": data.channel.id,
      "youtube_title": youtube_title,
    }
  })
});

console.log('Listening on port ' + process.env.PORT);

// Add root directory to server so it can be kept alive
notifier.server.get('/', function (req, res) {
  res.status(200).send('The website is alive.')
})

// Add test directory to server which will send a message to discord
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

