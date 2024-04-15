# Gemini Pro Chat

## Environment Variables

You can control the website through environment variables.

-   API_KEY
-   MODEL
-   AUTH_SECRET
-   AUTH_GITHUB_ID
-   AUTH_GITHUB_SECRET
-   KV_URL
-   KV_REST_API_URL
-   KV_REST_API_TOKEN
-   KV_REST_API_READ_ONLY_TOKEN
  
## Note

If you in China, maybe change and add next code:

```javascript
// npm i undici
const { setGlobalDispatcher, ProxyAgent } = require("undici");
const dispatcher = new ProxyAgent({ uri: new URL('http://127.0.0.1:7890').toString() });
// Global fetch call enables proxy
setGlobalDispatcher(dispatcher);
```

[The more about TypeError: fetch failed](https://github.com/google/generative-ai-js/issues/29)

## Acknowledgements

This project is inspired by and based on the following open-source project:

-   [sinnedpenguin](https://www.sinnedpenguin.me/) - For the foundational codebase and features.