# Project info

## Links

- [Demo environment](https://webdev-ht.nanjo.tech)
    - [Create account](https://webdev-ht.nanjo.tech/auth/register)
    - [Login](https://webdev-ht.nanjo.tech/auth/login)
    - [Messages](https://webdev-ht.nanjo.tech/messages)
- [Documentation](https://webdev-ht.nanjo.tech/documentation)

## Repository files and folders

- `docs/`  
    - Contains mkdocs pages (they need to be built into html using `mkdocs build`)
    - Contains any other files relevant to the documentation in `docs/docs/assets` e.g. images and code snippets
- `public/`
    - favicon and other public files
- `src/`
    - React source code files

- `pm2-process.json`
    - config file for pm2 (process manager 2)
        - cluster mode allows multiple nodejs instances to run at the same time to increase performance
        - will automatically restart whenever it crashes or when the server files are modified

- `index.html`
    - Template for app pages

- `server/` (back-end files)
    - `models`
        - Mongoose (MongoDB) document models
    - `routes`
        - All routes for the project (Demo environment, documentation and API)
    - `server.js`
        - Main app file for the ExpressJS server
