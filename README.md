# vercel safe access
## add a password for u vercel access deploy
### how to use
Just choose to add  environment variable when you deploy the project:
```
// set NEXT_PUBLIC_ACCESSURL as u access url environment variable,such as https://domain.com/
let target = process.env.NEXT_PUBLIC_ACCESSURL;

// set NEXT_PUBLIC_SAFEPWD as u password environment variable
const PASSWORD = process.env.NEXT_PUBLIC_SAFEPWD;
```
