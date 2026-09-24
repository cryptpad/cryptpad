from pyinfra.operations import apt, server, git

# Declare end state: the vim package should be installed.
# On every run pyinfra checks the host and only runs apt if vim is missing.
apt.packages(
    name = "Ensure the apt packages are installed",
    packages = ["git"],
    update = True,
    _sudo = True,
)

git.repo(
  src = "https://github.com/cryptpad/cryptpad.git",
  dest = "cryptpad",
  branch = "staging",
)

# server.shell(
#     name="Update CryptPad dependencies",
#     commands=["lxd init --auto"],
# )
