---
title: A Tool to convert Bluesky posts to Pixela graph
description: A Tool to convert Bluesky posts to Pixela graph
tags: ["Bluesky", "Pixela", "Python"]
published: true
---

I created a tool that converts my daily [Bluesky](https://bsky.app) posts into a [Pixela](https://pixe.la) graph. [The source code is available on GitHub](https://github.com/mahata/bsky-pixela-tracker).

For my account, it looks like this 📊 :

![Pixela bsky-post-graph](https://pixe.la/v1/users/mahata/graphs/bsky-graph)

I’m aware that I tend to post on Bluesky only when I have free time. This tool helps visualize that pattern.

## Implementation

The tool works by calling the Bluesky API, aggregating the number of posts per day, and then sending the data to Pixela via POST requests.

[![Interactions with Bluesky and Pixela](https://mermaid.ink/img/pako:eNplUMtOwzAQ_BXLV9pYXH2oBAJ6QlQKJ2QJLfamsXBs4wdqFeXf2aQNHPBlPbOjGe2MXAeDXPKMXxW9xgcLxwSD8oxeq5ONhW13uxt27yrmz7Nk-8dX1pcSsxTig5gmB23BiVOKWkCMzUJ2iKY5YrmrpQ_pidDF8moze26v_pIdQi6ZhW7d_k8_2BM6IOVLS_o1PhLbOBDft6JmTFmM8_Aw4CToitgTs8x3aybl-YYPmAawhg4e5xDFS48DKi7pa7CD6oriyk8khVpCe_aay5IqbngK9dhz2YHLhGo0UNa2ftkI_i2EP4zGlpCeLxUvTU8_gut_Fw?type=png)](https://mermaid.live/edit#pako:eNplUMtOwzAQ_BXLV9pYXH2oBAJ6QlQKJ2QJLfamsXBs4wdqFeXf2aQNHPBlPbOjGe2MXAeDXPKMXxW9xgcLxwSD8oxeq5ONhW13uxt27yrmz7Nk-8dX1pcSsxTig5gmB23BiVOKWkCMzUJ2iKY5YrmrpQ_pidDF8moze26v_pIdQi6ZhW7d_k8_2BM6IOVLS_o1PhLbOBDft6JmTFmM8_Aw4CToitgTs8x3aybl-YYPmAawhg4e5xDFS48DKi7pa7CD6oriyk8khVpCe_aay5IqbngK9dhz2YHLhGo0UNa2ftkI_i2EP4zGlpCeLxUvTU8_gut_Fw)

I won't go into details here because you can check the source code. It's small enough to take a look at. One thing I'd like to point out is that both the Bluesky and Pixela APIs are straightforward and easy to work with.

## Appendix

The repository includes a GitHub Actions workflow that runs the script periodically:

```yaml
name: Post to Pixela on a daily basis
on:
  schedule:
    - cron: '0 0 * * *' # Every day at 00:00 UTC
  workflow_dispatch:

jobs:
  slack:
    runs-on: ubuntu-24.04
    steps:
      - name: Check out repository code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'
          cache: 'pip'

      - name: Install Dependencies
        run: pip install -r requirements.txt

      - name: Run the script
        run: python main.py
        env:
          BSKY_APP_PASSWORD: ${{ vars.BSKY_APP_PASSWORD }}
          BSKY_USERNAME: ${{ vars.BSKY_USERNAME }}
          PIXELA_GRAPH_ID: ${{ vars.PIXELA_GRAPH_ID }}
          PIXELA_USERNAME: ${{ vars.PIXELA_USERNAME }}
          PIXELA_USER_TOKEN: ${{ vars.PIXELA_USER_TOKEN }}
```

If you’re interested, you can clone the code, set up your Bluesky and Pixela environment variables, and have your graph updated automatically on a regular basis!
