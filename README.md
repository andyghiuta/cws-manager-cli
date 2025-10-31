# CWS CLI

A TypeScript CLI tool for managing Chrome extensions in the Chrome Web Store using the Chrome Web Store API v2.

## Features

- 📦 **Upload** extension packages (.zip or .crx files)
- 🚀 **Publish** extensions with various options
- 📊 **Check status** of extensions and submissions
- ❌ **Cancel** active submissions
- 🎯 **Manage deployment** percentage for published extensions
- 🔧 **Easy configuration** with interactive setup
- 🔍 **Verbose output** and dry-run mode for testing

## Installation

**Requirements:** Node.js ≥18.0.0

### Global Installation (Recommended)

```bash
npm install -g cws-cli
```

### Local Installation

```bash
npm install cws-cli
npx cws --help
```

### From Source

```bash
git clone https://github.com/your-username/cws-cli.git
cd cws-cli
npm install
npm run build
npm link
```

## Quick Start

1. **Configure your credentials:**
   ```bash
   cws configure
   ```

2. **Upload an extension:**
   ```bash
   cws upload <item-id> <file.zip>
   ```

3. **Publish the extension:**
   ```bash
   cws publish <item-id>
   ```

4. **Check status:**
   ```bash
   cws status <item-id>
   ```

## Configuration

### Prerequisites

Before using this CLI, you need to:

1. **Enable the Chrome Web Store API** in Google Cloud Console
2. **Create OAuth2 credentials** (Client ID and Client Secret)  
3. **Generate a refresh token** for API access
4. **Get your Publisher ID** from the Chrome Web Store Developer Dashboard

### Detailed Setup Steps

#### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Chrome Web Store API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Chrome Web Store API"
   - Click "Enable"

#### 2. OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Desktop application" as the application type
4. Note down the **Client ID** and **Client Secret**

#### 3. Generate Refresh Token

You can use tools like the [Google OAuth2 Playground](https://developers.google.com/oauthplayground/) or use https://github.com/fregante/chrome-webstore-upload-keys the refresh token:

```bash
npx chrome-webstore-upload-keys
```

#### 4. Get Publisher ID

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Your Publisher ID is in the URL: `https://chrome.google.com/webstore/devconsole/YOUR_PUBLISHER_ID`

#### 5. Configure CLI

Run the interactive configuration:

```bash
cws configure
```

Or create a config file manually at `~/.cws-cli/config.json`:

```json
{
  "clientId": "your-client-id.apps.googleusercontent.com",
  "clientSecret": "your-client-secret",
  "refreshToken": "your-refresh-token", 
  "publisherId": "your-publisher-id"
}
```

## Commands

### `configure`

Set up API credentials interactively.

```bash
cws configure [options]

Options:
  -i, --interactive                    Interactive configuration mode (default: true)
  --client-id <id>                     Google OAuth2 client ID
  --client-secret <secret>             Google OAuth2 client secret  
  --refresh-token <token>              OAuth2 refresh token
  --publisher-id <id>                  Chrome Web Store publisher ID
```

### `upload`

Upload a new package to an existing extension.

```bash
cws upload <item-id> <file> [options]

Arguments:
  item-id                              Chrome Web Store item (extension) ID
  file                                 Path to the .zip or .crx file to upload

Options:
  -s, --skip-review                    Skip review process if possible
  -p, --publish-type <type>            Publish type: default, staged (default: "default")
  -d, --deploy-percentage <percentage> Initial deploy percentage (0-100) (default: "100")
  -a, --auto-publish                   Automatically publish after successful upload
  -w, --max-wait-time <seconds>        Maximum time to wait for upload processing (default: "300")
```

**Examples:**
```bash
# Basic upload
cws upload abcdefghijklmnopqrstuvwxyz1234567890 extension.zip

# Upload and auto-publish with 50% deployment
cws upload abcdefghijklmnopqrstuvwxyz1234567890 extension.zip -a -d 50

# Upload as staged (requires manual publish later)
cws upload abcdefghijklmnopqrstuvwxyz1234567890 extension.zip -p staged

# Upload with custom max wait time (10 minutes)
cws upload abcdefghijklmnopqrstuvwxyz1234567890 extension.zip -w 600
```

### `publish`

Publish an extension that has been uploaded.

```bash
cws publish <item-id> [options]

Arguments:
  item-id                              Chrome Web Store item (extension) ID

Options:
  -s, --skip-review                    Skip review process if possible
  -p, --publish-type <type>            Publish type: default, staged (default: "default")
  -d, --deploy-percentage <percentage> Initial deploy percentage (0-100) (default: "100")
```

**Examples:**
```bash
# Publish with default settings
cws publish abcdefghijklmnopqrstuvwxyz1234567890

# Publish to 25% of users initially  
cws publish abcdefghijklmnopqrstuvwxyz1234567890 -d 25

# Stage for later publishing
cws publish abcdefghijklmnopqrstuvwxyz1234567890 -p staged
```

### `status`

Get the current status of an extension.

```bash
cws status <item-id> [options]

Arguments:
  item-id                              Chrome Web Store item (extension) ID

Options:
  -w, --watch                          Watch for status changes (polls every 30 seconds)  
  -i, --interval <seconds>             Poll interval in seconds when watching (default: "30")
```

**Examples:**
```bash
# Check status once
cws status abcdefghijklmnopqrstuvwxyz1234567890

# Watch for changes every 60 seconds
cws status abcdefghijklmnopqrstuvwxyz1234567890 -w -i 60
```

### `cancel`

Cancel the current active submission.

```bash
cws cancel <item-id>

Arguments:  
  item-id                              Chrome Web Store item (extension) ID
```

**Example:**
```bash
cws cancel abcdefghijklmnopqrstuvwxyz1234567890
```

### `deploy`

Update the deployment percentage for a published extension.

```bash
cws deploy <item-id> <percentage>

Arguments:
  item-id                              Chrome Web Store item (extension) ID
  percentage                           Deployment percentage (0-100)
```

**Example:**
```bash
# Deploy to 75% of users
cws deploy abcdefghijklmnopqrstuvwxyz1234567890 75
```

## Global Options

All commands support these global options:

- `-c, --config <path>`: Path to config file (default: `~/.cws-cli/config.json`)
- `-v, --verbose`: Enable verbose output
- `--dry`: Dry run mode (don't actually make API calls)

**Examples:**
```bash
# Use custom config file
cws -c ./my-config.json status abcdefghijklmnopqrstuvwxyz1234567890

# Verbose output  
cws -v upload abcdefghijklmnopqrstuvwxyz1234567890 extension.zip

# Test commands without making API calls
cws --dry publish abcdefghijklmnopqrstuvwxyz1234567890
```

## CI/CD Integration

This CLI is perfect for automating extension deployments in CI/CD pipelines:

### GitHub Actions Example

```yaml
name: Deploy Extension

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install CLI
        run: npm install -g cws-cli
        
      - name: Create config
        run: |
          mkdir -p ~/.cws-cli
          echo '{}' | jq \\
            --arg clientId "$CLIENT_ID" \\
            --arg clientSecret "$CLIENT_SECRET" \\
            --arg refreshToken "$REFRESH_TOKEN" \\
            --arg publisherId "$PUBLISHER_ID" \\
            '{clientId: $clientId, clientSecret: $clientSecret, refreshToken: $refreshToken, publisherId: $publisherId}' \\
            > ~/.cws-cli/config.json
        env:
          CLIENT_ID: ${{ secrets.CHROME_WS_CLIENT_ID }}
          CLIENT_SECRET: ${{ secrets.CHROME_WS_CLIENT_SECRET }}
          REFRESH_TOKEN: ${{ secrets.CHROME_WS_REFRESH_TOKEN }}
          PUBLISHER_ID: ${{ secrets.CHROME_WS_PUBLISHER_ID }}
          
      - name: Upload and publish
        run: |
          cws upload ${{ secrets.EXTENSION_ID }} extension.zip --auto-publish
```

### Jenkins Example

```groovy  
pipeline {
    agent any
    
    environment {
        EXTENSION_ID = credentials('extension-id')
        CWS_CLIENT_ID = credentials('cws-client-id')
        CWS_CLIENT_SECRET = credentials('cws-client-secret')
        CWS_REFRESH_TOKEN = credentials('cws-refresh-token')
        CWS_PUBLISHER_ID = credentials('cws-publisher-id')
    }
    
    stages {
        stage('Install CLI') {
            steps {
                sh 'npm install -g cws-cli'
            }
        }
        
        stage('Configure') {
            steps {
                sh '''
                    mkdir -p ~/.cws-cli
                    cat > ~/.cws-cli/config.json << EOF
{
  "clientId": "${CWS_CLIENT_ID}",
  "clientSecret": "${CWS_CLIENT_SECRET}",
  "refreshToken": "${CWS_REFRESH_TOKEN}",
  "publisherId": "${CWS_PUBLISHER_ID}"
}
EOF
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'cws upload ${EXTENSION_ID} extension.zip --auto-publish'
            }
        }
    }
}
```

## API Reference

The CLI is built on top of the Chrome Web Store API v2. Here are the main API endpoints used:

- **Upload**: `POST /v2/publishers/{publisherId}/items/{itemId}:upload`
- **Publish**: `POST /v2/publishers/{publisherId}/items/{itemId}:publish`  
- **Status**: `GET /v2/publishers/{publisherId}/items/{itemId}:fetchStatus`
- **Cancel**: `POST /v2/publishers/{publisherId}/items/{itemId}:cancelSubmission`
- **Deploy**: `POST /v2/publishers/{publisherId}/items/{itemId}:setPublishedDeployPercentage`

## Troubleshooting

### Common Issues

1. **"Config file not found"**
   - Run `cws configure` to create the config file
   - Or specify a config path with `-c <path>`

2. **"Failed to obtain access token"**  
   - Check that your refresh token is valid
   - Ensure the Chrome Web Store API is enabled in Google Cloud Console
   - Verify your OAuth2 credentials

3. **"Upload failed: 400 Bad Request"**
   - Ensure the item ID exists and you have permissions
   - Check that the file is a valid .zip or .crx extension package
   - Verify the file size is under the 2GB limit

4. **"HTTP 403: Forbidden"**
   - Check your Publisher ID is correct
   - Ensure you have the right permissions for the extension
   - Verify the OAuth2 scope includes `https://www.googleapis.com/auth/chromewebstore`

### Debug Mode

Use verbose mode to see detailed API requests and responses:

```bash
cws -v status your-extension-id
```

Use dry run mode to test commands without making actual API calls:

```bash  
cws --dry upload your-extension-id extension.zip
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the build: `npm run build`
5. Run tests: `npm test`
6. Submit a pull request

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/cws-cli.git
cd cws-cli

# Install dependencies  
npm install

# Build the project
npm run build

# Link for local development
npm link

# Run in development mode
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Links

- [Chrome Web Store API Documentation](https://developer.chrome.com/docs/webstore/api)
- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/)
- [Google Cloud Console](https://console.cloud.google.com)
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)