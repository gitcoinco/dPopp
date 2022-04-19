# dPopp

# Quick Start

Prerequisites: [Node (v16 LTS)](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> run DPOPP:

```bash
git clone https://github.com/gitcoinco/dPopp.git
npm install --global lerna
lerna bootstrap
yarn start
```

## app

This will be the web app allowing users to interact with their dpopp

> start only the 📱 frontend:

```bash
cd app
yarn start
```

## iam

This is the server handling incoming requests to issue credentials and process verifications

> start only the IAM server:

```bash
cd iam
yarn start
```

## identity

This is a helper package to compile Spruce DIDKit and export functions for use in `iam` and `app` packages.
