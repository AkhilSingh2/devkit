export const yamlSamples = {
  kubernetes: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-api
  labels:
    app: example-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: example-api
  template:
    metadata:
      labels:
        app: example-api
    spec:
      containers:
        - name: api
          image: example.com/api:1.4.0
          ports:
            - containerPort: 8080
          env:
            - name: LOG_LEVEL
              value: info
`,
  "docker-compose": `services:
  web:
    image: example.com/web:1.0.0
    ports:
      - "8080:80"
    environment:
      APP_ENV: production
  cache:
    image: redis:7
`,
  "github-actions": `name: ci
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: echo "test"
`,
  helm: `replicaCount: 2
image:
  repository: example.com/api
  tag: "1.4.0"
service:
  type: ClusterIP
  port: 80
resources:
  limits:
    cpu: 200m
    memory: 256Mi
`,
} as const;

export type YamlSampleId = keyof typeof yamlSamples;
