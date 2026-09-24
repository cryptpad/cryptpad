from pyinfra.operations import apt, server, git


git.repo(
  src = "https://github.com/cryptpad/cryptpad.git",
  dest = "Desktop/Temp/cryptpad",
  branch = "staging",
)


# Run shell commands ######################################

server.shell(
    name="Update CryptPad dependencies",
    commands=[
      "npm ci --allow-git=all", 
      "npm run install:components",
      "cp config/config.example.js config/config.js"],
    _chdir = host.data.get("installPath")
)

server.shell(
    name="Update OnlyOffice",
    commands=[
      "./install-office.sh -a",],
    _chdir = host.data.get("installPath")
)