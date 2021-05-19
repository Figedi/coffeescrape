## coffeescrape

A tiny scraper to get me some sweet coffee deals and notify me in telegram

Currently supported providers

- espressoperfetto
- kaffeezentrale
- mcc
- moba
- moema

## Installation 

No special setup needed, just run 
`npm ci`

## Usage 

You need to provide an env-file for local usage, see .env.example for values, names should be self explainatory.

## Building / Deployment

This project is deployed to google cloud-run and triggered via cloud-scheduler periodically. The provided gh-actions workflow directly 
deploy new versions. 
To deploy your own version, do the following:
- Setup gh secrets (see all of them in the workflows file {{ .secrets.<NAME> }})
- Setup in gcp service-account with proper access rights (cloudrun-admin, service-account-user, storage-admin), also put it in secrets
- Commit and deploy 🚀

- If it works, yay. If it doesnt, meh. Try reading the errors, it is most likely a permission issue w/ gcp. Note that you might have to go to the console to adjust the network access

Note: I did not use secrets for now and instead pass secret values via env-vars, naughty me.

Your service should be deployed and up and running as you will, if you want a similar setup as I have, try combine the deployment w/ cloud-scheduler for periodic checking.
