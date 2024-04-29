# AWS Copilot GitHub Action

This is a fork of [ksivamuthu/aws-copilot-github-action](https://github.com/ksivamuthu/aws-copilot-github-action), modernized.

## Usage

1. To install copilot-cli in your github actions.

```yaml
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          role-to-assume: arn:aws:iam::111111111111:role/my-github-actions-role-test
          aws-region: us-east-1
      - uses: ekojsalimm/aws-copilot-github-action@main
        with:
          command: install
      - run: |
          copilot --version
```

2. To deploy the app

```yaml
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          role-to-assume: arn:aws:iam::111111111111:role/my-github-actions-role-test
          aws-region: us-east-1
      - uses: ekojsalimm/aws-copilot-github-action@main
        with:
          command: deploy
          app: your-awesome-app
          env: prod
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Optional parameters

### Name

In the with attribute, the name value can be used to define the name of the job to be published

```yaml
  deploy:
    steps:
      - uses: smuada/aws-copilot-github-action@v0.0.1
        with:
          command: deploy
          app: your-awesome-app
          env: prod
          name: job-name
```

### Tag

In the with attribute, the tag value can be used to define the tag image name

```yaml
  deploy:
    steps:
      - uses: smuada/aws-copilot-github-action@v0.0.1
        with:
          command: deploy
          app: your-awesome-app
          env: prod
          tag: image-name
```
