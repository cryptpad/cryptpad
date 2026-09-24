from pyinfra.operations import apt, server, git
from pyinfra import host

git.repo(
  src = "https://github.com/cryptpad/cryptpad.git",
  dest = host.data.get("installPath"),
  branch = host.data.get("branch"),
)


# Run shell commands ######################################

server.shell(
    name="Update CryptPad dependencies",
    commands=[
      'NVM_DIR="$HOME/.nvm" . ~/.nvm/nvm.sh ; npm ci --allow-git=all', 
      'NVM_DIR="$HOME/.nvm" . ~/.nvm/nvm.sh ; npm run install:components', 
      ],
    _chdir = host.data.get("installPath")
)

server.shell(
    name="Update OnlyOffice",
    commands=[
      "./install-office.sh -a || ./install-onlyoffice.sh -a",],
    _chdir = host.data.get("installPath")
)
