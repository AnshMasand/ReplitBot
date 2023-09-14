# Telegram ChatGPT Concierge Bot (+ Voice!)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/e7XF13?referralCode=eZ-TPi)

![Telegram ChatGPT Concierge Bot](./img/demo.png)

This is a Telegram bot that uses:

- OpenAI's ChatGPT, obviously, as "the brain"
- [LangchainJS](https://github.com/hwchase17/langchainjs) to constructs prompts, handle convo history and interact with Google
- OpenAI's Whisper API to generate text from voice
- [Play.ht](https://play.ht) to generate voice from text and reply to voice messages
- In the `config` folder, replace the `PINECONE_NAME_SPACE` with a `namespace` where you'd like to store your embeddings on Pinecone when you run `npm run ingest`. This namespace will later be used for queries and retrieval.
- In `utils/makechain.ts` chain change the `QA_PROMPT` for a specific usecase.
### How to use

> Prerequisite: You need Node 18, a Telegram bot token and an OpenAI API key with access to GPT-4. Optionally you can use other model by setting `OPENAI_MODEL` env var. Ask ChatGPT how to get these. You'll also need `ffmpeg` installed to use voice interactions.

1. `git clone https://github.com/RafalWilinski/telegram-chatgpt-concierge-bot`
2. `cd telegram-chatgpt-concierge-bot`
3. `touch .env` and fill the following:

```
TELEGRAM_TOKEN=
OPENAI_API_KEY=
PLAY_HT_SECRET_KEY=
PLAY_HT_USER_ID=
PLAY_HT_VOICE= # check docs for available voices https://playht.github.io/api-docs-generator/#utra-realistic-voices
OPENAI_MODEL=gpt-3.5-turbo # only if you don't have access to GPT-4
#SERVE_THIS_USER_ONLY=99999999 # uncomment this if you want to only serve this user id. The ID will be printed on stdout.
PINECONE_ENVIRONMENT=
PINECONE_API_KEY=
PINECONE_INDEX=
OPENAI_API_KEY=

```

4. `npm install`

5. Inside `docs` folder, add your pdf files or folders that contain pdf files.

6. Run the script `npm run ingest` to 'ingest' and embed your docs. If you run into errors troubleshoot below.

7. Check Pinecone dashboard to verify your namespace and vectors have been added.

8. `npm start`

---

Follow me on [Twitter](https://twitter.com/RafalWilinski)

Discuss on [Twitter](https://twitter.com/rafalwilinski/status/1645123663514009601) or [HackerNews](https://news.ycombinator.com/item?id=35510516)
