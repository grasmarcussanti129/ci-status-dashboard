# CI Status Dashboard

## Overview
CI Status Dashboard is a lightweight web application designed to monitor and display the real-time statuses of your Continuous Integration/Continuous Deployment (CI/CD) pipelines across various platforms such as GitHub Actions, Travis CI, and Jenkins.

## Features
- Real-time updates on pipeline statuses
- Toggle view between different CI tools
- Custom notifications for builds that fail
- Simple interface to add and remove pipelines

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ci-status-dashboard.git
   ```
2. Navigate into the project directory:
   ```bash
   cd ci-status-dashboard
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the application:
   ```bash
   npm start
   ```
5. Visit `http://localhost:3000` to view the dashboard.

## Usage
- To add a new pipeline, click on the 'Add Pipeline' button and fill the required fields:
  - Pipeline Name
  - CI service (GitHub Actions, Travis CI, etc.)
  - API token or access token if necessary.

## Contribution
Feel free to fork this repository and submit a pull request for any improvements or features. All contributions are welcome!

## License
MIT License
