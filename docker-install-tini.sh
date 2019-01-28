#!/bin/sh

# Figure out latest release via GitHub API
release=$(curl --silent "https://api.github.com/repos/krallin/tini/releases/latest" | jq -r .tag_name)

# _Reliable_ way to get which arch for tini download
arch=$(python <<EOF
from __future__ import print_function
import platform
processor = platform.machine()
if processor == 'aarch64':
    print('arm64', end='')
elif processor == 'x86 64' or processor == 'x86_64':
    print('amd64', end='')
elif processor == 'armv7l':
    print('armhf', end='')

EOF
)

# Download/install tini
curl -L https://github.com/krallin/tini/releases/download/$release/tini-static-$arch \
     -o /sbin/tini
chmod a+x /sbin/tini

