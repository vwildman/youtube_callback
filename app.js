const dotenv = require('dotenv').config();
const YouTubeNotifier = require('youtube-notification');
const TES = require('tesjs');
const axios = require('axios');
const delay = ms => new Promise(res => setTimeout(res, ms));

const notifier = new YouTubeNotifier({
  hubCallback: process.env.CALLBACK_URL,
  port: process.env.PORT,
  path: '/youtube-hub',
});
notifier.setup();
const base_topic = 'https://www.youtube.com/xml/feeds/videos.xml?channel_id=';

console.log('Listening on port ' + process.env.PORT);


const tes = new TES({
  identity: {
      id: process.env.TWITCH_CLIENT_ID,
      secret: process.env.TWITCH_CLIENT_SECRET 
  },
  listener: {
      baseURL: process.env.CALLBACK_URL,
      secret: process.env.TWITCH_WEBHOOK_SECRET,
      server: notifier.server
  }
});

console.log('Listening to Twitch Events')

notifier.on('subscribe', async data => {
  console.log('Subscribed');
  console.log(data);
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
        "username": `Youtube Subscription Test`,
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
      "username": `Youtube Unsubscription Test`,
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
        "username": `Youtube Denied Test`,
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
    url: process.env.PIPEDREAM_YOUTUBE_WEBHOOK,
    headers: {
      "Content-Type": 'application/json',
    },
    data: {
      "youtube_id": data.video.id,
      "youtube_channel_id": data.channel.id,
      "youtube_title": youtube_title,
      "yt_link_test": data.video.link,
    }
  })
});

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
        "username": `Youtube Discord Test`,
        "content": `Call to test_discord directory`,
      }
    })
  }
})

// Twitch Subsciptions
var twitch_subs_array = process.env.TWITCH_SUBS.split(",");
for (twitch_sub of twitch_subs_array) {
  tes.unsubscribe('stream.online', {
    broadcaster_user_id: twitch_sub
  });
  delay(5000);
}

// List all Twitch subsciptions
tes.getSubscriptionsByType('stream.online').then(data => {
  console.log(JSON.stringify(data,0,2));
});

// Receive Twitch Notification
tes.on('stream.online', async event => {
  console.log(`Event User Name: ${event.broadcaster_user_name}`);
  console.log(`Event User ID: ${event.broadcaster_user_id}`);
  console.log(`Event User Login: ${event.broadcaster_user_login}`);
  var twitch_webhook;
  twitch_webhook = await axios({
    method: "POST",
    url: process.env.PIPEDREAM_TWITCH_WEBHOOK,
    headers: {
      "Content-Type": 'application/json',
    },
    data: {
      "twitch_user_id": `${event.broadcaster_user_id}`,
      "twitch_user_login": `${event.broadcaster_user_login}`,
      "twitch_user_name": `${event.broadcaster_user_name}`,
    },
  })
})

