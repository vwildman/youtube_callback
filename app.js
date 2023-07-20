const dotenv = require('dotenv').config();
const YouTubeNotifier = require('youtube-notification');
const TES = require('tesjs');
const axios = require('axios');
const delay = ms => new Promise(res => setTimeout(res, ms));
const url = `${process.env.DISCORD_WEBHOOK}`;
const youtube_url = `${process.env.PIPEDREAM_YOUTUBE_WEBHOOK}`;
const twitch_url = `${process.env.PIPEDREAM_TWITCH_WEBHOOK}`;
const fetch = require('node-fetch');

function sendMessage(message) {
   fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"username": "Youtube Subscription Test", "content": `${message}`})
    });
}

function sendYoutubeMessage(message, title) {
   fetch(youtube_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"youtube_id": message.video.id,"youtube_channel_id": message.channel.id,"youtube_title": `${title}`,"youtube_link": message.video.link})
    });
}

function sendTwitchMessage(message) {
   fetch(twitch_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"twitch_user_id": `${message.broadcaster_user_id}`,"twitch_user_login": `${message.broadcaster_user_login}`,"twitch_user_name": `${message.broadcaster_user_name}`})
    });
}


//Set up youtube callback listener
const notifier = new YouTubeNotifier({
  hubCallback: process.env.CALLBACK_URL,
  port: process.env.PORT,
  path: '/youtube-hub',
});
notifier.setup();
const base_topic = 'https://www.youtube.com/xml/feeds/videos.xml?channel_id=';

console.log('Listening on port ' + process.env.PORT);

//Set up twitch callback listener
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

//Youtube subscription received
notifier.on('subscribe', async data => {
  console.log('Subscribed');
  console.log(data);
  // Add message to my discord that the subscriptions have been sucessful
  if (process.env.MESSAGE_DISCORD === 'true') {
    sendMessage('Subscription to Channel ID:' + data.channel)
  }
});

//Youtube unsubscription received
notifier.on('unsubscribe', async data => {
  console.log('Unsubscribed');
  console.log(data);
  // Add message to my discord that an unsubscribe have been sucessful
  if (process.env.MESSAGE_DISCORD === 'true') {
    sendMessage('Unsubscribe received to Channel ID:' + data.channel)
  }
});

//Youtube denied received
notifier.on('denied', async data => {
  console.log('Denied');
  console.log(data);
});

//Youtube new video received
notifier.on('notified', async data => {
  console.log('New Video');
  console.log(data);
  let youtube_title = data.video.title.trim().replace(/[-[/\]"\\]/g, '\\\$&')
  sendYoutubeMessage(data,youtube_title)
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
    sendMessage(`Call to test_discord directory`)
  }
})

// Add current Twitch Subsciptions
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
  sendTwitchMessage(event)
})
