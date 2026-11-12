# Setting up the phone line

Many grandparents will never tap a link, but they will always answer the
phone. With a phone number from a voice gateway, Kinstory can:

- **answer** when the storyteller rings, recognising them by caller ID or a
  six-digit code, and read them this week's question;
- **ring them** every week at a time you choose, in their own time zone;
- **text** them the answer link.

Calls and texts are billed by the gateway at its per-minute and per-message
rates, plus a monthly fee for the number.

## Twilio

1. Create a [Twilio](https://www.twilio.com) account and buy a phone number
   with voice (and SMS, if you want texts) in your storyteller's country.
2. Set these variables and restart Kinstory:

   ```ini
   PUBLIC_URL=https://stories.example.com
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+15550100199
   ```

3. In the Twilio console, open the number and set **A call comes in** to
   _Webhook_, `POST`, `https://stories.example.com/api/voice/incoming`.
4. In Kinstory, open **Settings**, add the storyteller's phone number, choose
   **Phone call**, and pick a day and time.
5. Print the card (**Print card**) and give it to them. It shows the number and
   their six-digit code, for when they call from a phone Kinstory doesn't
   know.

`PUBLIC_URL` must be the exact address Twilio uses to reach Kinstory, because
every webhook is checked against its signature. Requests whose signature
doesn't match are refused.

## What the storyteller hears

> Hello Rosa. This is Kinstory, with this week's question from Daniel.
> _What was the best meal you ever ate?_
> Take all the time you need. After the tone, tell your story. When you are
> finished, press the pound key, or simply hang up.

Recordings end after 20 seconds of silence (`VOICE_SILENCE_TIMEOUT`) or 30
minutes (`VOICE_MAX_RECORDING_SECONDS`). The voice and wording follow the
book's language. If an answering machine picks up a scheduled call, Kinstory
leaves a short message with the number to ring back.

## Other gateways

Kinstory speaks TwiML, which SignalWire also accepts. Point
`TWILIO_API_BASE` at your space's compatibility API, for example
`https://example.signalwire.com/api/laml`, use the project ID and token as
`TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`, and configure the number's voice
webhook as above.

## Privacy

Once Kinstory has downloaded a call recording, it asks the gateway to delete
its copy, so the only copy lives on your server. Transcription happens
locally with whisper.cpp unless you have pointed `TRANSCRIBE_URL` elsewhere.
