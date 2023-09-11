# Deprecated in favour of https://github.com/digicatapult/openapi-merger
# wasp-open-api

Serves a single merged [`OpenAPI`](https://swagger.io/specification/) spec based on any number of wasp OpenAPI specs defined under `paths` in [`values.yaml`](helm/wasp-open-api/values.yaml).

Includes a node service with three endpoints:
- GET `/api-docs` to access the merged API spec
- `/swagger` to view the merged API spec in Swagger
- POST `/set-api-docs` to set the merged API spec

The merge is automated via a Helm [`CronJob`](helm/wasp-open-api/templates/cronjob.yaml). that runs [`openapi-merge-cli`](https://www.npmjs.com/package/openapi-merge-cli) then posts the merged doc to `set-api-docs` every minute.

## Getting started

`wasp-open-api` can be run in a similar way to most nodejs applications. First install required dependencies using `npm`:

```sh
npm install
```

And run the application in development mode with:

```sh
npm run dev
```

Or run tests with:

```sh
npm test
```

## Environment Variables

`wasp-open-api` is configured primarily using environment variables as follows:

| variable  | required | default | description                                                                          |
| :-------- | :------: | :-----: | :----------------------------------------------------------------------------------- |
| LOG_LEVEL |    N     | `info`  | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| PORT      |    N     |  `80`   | Port on which the service will listen                                                |
| API_DOCS_FILE_PATH|   N   |   `./api-docs.json` | Location of the api-docs file on the filesystem |

## Helm/Kubernetes

Install `minikube` and `helm` using Homebrew, then start `minikube` and update helm dependencies:
```
brew install minikube helm
minikube start --vm=true --driver=hyperkit
minikube addons enable ingress
helm dependency update helm/wasp-open-api
```

Eval is required to provide helm with visibility for your local docker image repository:
```
eval $(minikube docker-env)
```

Build the docker image:
```
DOCKER_BUILDKIT=1 docker build -t wasp-open-api:latest .
```

To test the CronJob against mock services on Kubernetes use the `ct-values.yaml`:
```
helm install wasp-open-api helm/wasp-open-api -f helm/wasp-open-api/ci/ct-values.yaml
```

Check the pods are running successfully using:
```
kubectl get pods -A
```
