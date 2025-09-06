const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to enable CORS (Cross-Origin Resource Sharing)
app.use(cors());
// Middleware to parse incoming JSON requests
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Root endpoint that returns a welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the CI Status Dashboard API!');
});

// Endpoint to fetch pipeline statuses
app.get('/api/statuses', (req, res) => {
  try {
    // Placeholder for pipeline status logic
    res.json({ message: 'Fetching pipeline statuses...' });
  } catch (error) {
    // Handle potential errors
    console.error('Error fetching pipeline statuses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to fetch GitHub repositories
app.get('/api/github/repos', async (req, res) => {
  try {
    const { username, token } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CI-Status-Dashboard'
    };

    // Add authentication header if token is provided
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: headers
    });

    const repos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      updatedAt: repo.updated_at,
      hasActions: repo.permissions?.admin || false
    }));

    res.json({ repositories: repos });
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Endpoint to fetch GitHub Actions status for a repository
app.get('/api/github/actions/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token } = req.query;
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CI-Status-Dashboard'
    };

    // Add authentication header if token is provided
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/runs`, {
      headers: headers
    });

    const runs = response.data.workflow_runs.slice(0, 5).map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      url: run.html_url,
      branch: run.head_branch,
      platform: 'GitHub Actions'
    }));

    res.json({ runs });
  } catch (error) {
    console.error('Error fetching GitHub Actions:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub Actions data' });
  }
});

// Endpoint to fetch Travis CI status for a repository
app.get('/api/travis/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token } = req.query;
    
    const headers = {
      'Accept': 'application/vnd.travis-ci.2+json',
      'User-Agent': 'CI-Status-Dashboard'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    const response = await axios.get(`https://api.travis-ci.org/repos/${owner}/${repo}/builds`, {
      headers: headers
    });

    const builds = response.data.builds.slice(0, 5).map(build => ({
      id: build.id,
      name: build.message || `Build #${build.number}`,
      status: build.state,
      conclusion: build.state,
      createdAt: build.started_at,
      updatedAt: build.finished_at,
      url: `https://travis-ci.org/${owner}/${repo}/builds/${build.id}`,
      branch: build.branch,
      platform: 'Travis CI'
    }));

    res.json({ runs: builds });
  } catch (error) {
    console.error('Error fetching Travis CI:', error);
    res.status(500).json({ error: 'Failed to fetch Travis CI data' });
  }
});

// Endpoint to fetch Jenkins status for a repository
app.get('/api/jenkins/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { jenkinsUrl, token } = req.query;
    
    if (!jenkinsUrl) {
      return res.status(400).json({ error: 'Jenkins URL is required' });
    }
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'CI-Status-Dashboard'
    };

    if (token) {
      headers['Authorization'] = `Basic ${Buffer.from(token).toString('base64')}`;
    }
    
    const response = await axios.get(`${jenkinsUrl}/job/${owner}-${repo}/api/json`, {
      headers: headers
    });

    const builds = response.data.builds.slice(0, 5).map(build => ({
      id: build.number,
      name: build.displayName || `Build #${build.number}`,
      status: build.building ? 'in_progress' : (build.result || 'unknown'),
      conclusion: build.result || 'unknown',
      createdAt: new Date(build.timestamp).toISOString(),
      updatedAt: new Date(build.timestamp).toISOString(),
      url: build.url,
      branch: 'main', // Jenkins doesn't always provide branch info
      platform: 'Jenkins'
    }));

    res.json({ runs: builds });
  } catch (error) {
    console.error('Error fetching Jenkins:', error);
    res.status(500).json({ error: 'Failed to fetch Jenkins data' });
  }
});

// Endpoint to get all CI statuses for a repository
app.get('/api/ci-status/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token, jenkinsUrl } = req.query;
    
    const allStatuses = [];
    
    // GitHub Actions
    try {
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CI-Status-Dashboard'
      };
      if (token) headers['Authorization'] = `token ${token}`;
      
      const ghResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/runs`, {
        headers: headers
      });
      
      const ghRuns = ghResponse.data.workflow_runs.slice(0, 3).map(run => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        url: run.html_url,
        branch: run.head_branch,
        platform: 'GitHub Actions'
      }));
      
      allStatuses.push(...ghRuns);
    } catch (error) {
      console.log('GitHub Actions not available for this repo');
    }
    
    // Travis CI
    try {
      const headers = {
        'Accept': 'application/vnd.travis-ci.2+json',
        'User-Agent': 'CI-Status-Dashboard'
      };
      if (token) headers['Authorization'] = `token ${token}`;
      
      const travisResponse = await axios.get(`https://api.travis-ci.org/repos/${owner}/${repo}/builds`, {
        headers: headers
      });
      
      const travisBuilds = travisResponse.data.builds.slice(0, 3).map(build => ({
        id: build.id,
        name: build.message || `Build #${build.number}`,
        status: build.state,
        conclusion: build.state,
        createdAt: build.started_at,
        updatedAt: build.finished_at,
        url: `https://travis-ci.org/${owner}/${repo}/builds/${build.id}`,
        branch: build.branch,
        platform: 'Travis CI'
      }));
      
      allStatuses.push(...travisBuilds);
    } catch (error) {
      console.log('Travis CI not available for this repo');
    }
    
    // Sort by creation date (newest first)
    allStatuses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ runs: allStatuses.slice(0, 10) });
  } catch (error) {
    console.error('Error fetching CI statuses:', error);
    res.status(500).json({ error: 'Failed to fetch CI statuses' });
  }
});

// Endpoint to fetch pull requests for a repository
app.get('/api/pull-requests/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token, state = 'open' } = req.query;
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CI-Status-Dashboard'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      headers: headers,
      params: {
        state: state,
        sort: 'created',
        direction: 'desc',
        per_page: 20
      }
    });

    const pullRequests = response.data.map(pr => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      author: {
        login: pr.user.login,
        avatar: pr.user.avatar_url,
        url: pr.user.html_url
      },
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      url: pr.html_url,
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      mergeable: pr.mergeable,
      mergeableState: pr.mergeable_state,
      draft: pr.draft,
      labels: pr.labels.map(label => ({
        name: label.name,
        color: label.color
      })),
      assignees: pr.assignees.map(assignee => ({
        login: assignee.login,
        avatar: assignee.avatar_url,
        url: assignee.html_url
      })),
      requestedReviewers: pr.requested_reviewers.map(reviewer => ({
        login: reviewer.login,
        avatar: reviewer.avatar_url,
        url: reviewer.html_url
      }))
    }));

    res.json({ pullRequests });
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    res.status(500).json({ error: 'Failed to fetch pull requests' });
  }
});

// Endpoint to fetch all pull requests for a user's repositories
app.get('/api/all-pull-requests', async (req, res) => {
  try {
    const { username, token } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CI-Status-Dashboard'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    // First get all repositories
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: headers
    });

    const allPullRequests = [];

    // Fetch pull requests for each repository
    for (const repo of reposResponse.data) {
      try {
        const prResponse = await axios.get(`https://api.github.com/repos/${repo.full_name}/pulls`, {
          headers: headers,
          params: {
            state: 'open',
            sort: 'created',
            direction: 'desc',
            per_page: 5
          }
        });

        const prs = prResponse.data.map(pr => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          body: pr.body,
          state: pr.state,
          author: {
            login: pr.user.login,
            avatar: pr.user.avatar_url,
            url: pr.user.html_url
          },
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          url: pr.html_url,
          baseBranch: pr.base.ref,
          headBranch: pr.head.ref,
          mergeable: pr.mergeable,
          mergeableState: pr.mergeable_state,
          draft: pr.draft,
          labels: pr.labels.map(label => ({
            name: label.name,
            color: label.color
          })),
          assignees: pr.assignees.map(assignee => ({
            login: assignee.login,
            avatar: assignee.avatar_url,
            url: assignee.html_url
          })),
          requestedReviewers: pr.requested_reviewers.map(reviewer => ({
            login: reviewer.login,
            avatar: reviewer.avatar_url,
            url: reviewer.html_url
          })),
          repository: {
            name: repo.name,
            fullName: repo.full_name,
            url: repo.html_url
          }
        }));

        allPullRequests.push(...prs);
      } catch (error) {
        console.log(`Could not fetch PRs for ${repo.name}:`, error.message);
      }
    }

    // Sort by creation date (newest first)
    allPullRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ pullRequests: allPullRequests });
  } catch (error) {
    console.error('Error fetching all pull requests:', error);
    res.status(500).json({ error: 'Failed to fetch pull requests' });
  }
});

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parsing Error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// Handle 404 errors for any unspecified routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start the server and listen on the specified PORT
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});