# ArbitrageGraphs

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.2.

## Setting up environment and dependencies

Install [Node.js](https://nodejs.org/en/download/) (together with npm).

Run `npm install -g @angular/cli to install` [Angular](https://angular.dev/) globally (-g) to make sure you don’t have to install it separately for every project

## Development server

Run `ng serve` to start the development server over HTTP. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

Run `ng serve --ssl` to run the development server over HTTPS using a self-signed certificate from the `/certs` directory. Navigate to `https://localhost:4200/`.

Specify port if needed `--port 4201` (default 4200).

Development server uses `proxy.conf.json` file to proxy requests to the backend API. This configuration helps to avoid issues related to CORS and self-signed certificates during development.

## Run in docker container

App can be built and run in a Docker container over HTTPS using same self-signed certificate.

Run `docker-compose build` to build the Docker image.

Run `docker-compose up` to run the Docker container.

Navigate to `https://localhost`.

App is served using nginx. The nginx configuration includes Content Security Policy (CSP) with nonce values that replace `**CSP_NONCE**` in the served files. For the CSP `style-src` rule, hardcoded sha256 values are used from styles added by `force-graph` library. If you update `force-graph` library, make sure to adjust sha256 values in the CSP rules accordingly.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

Run `ng test --include="**/your-component-name.component.spec.ts"` to execute specified test file.

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
