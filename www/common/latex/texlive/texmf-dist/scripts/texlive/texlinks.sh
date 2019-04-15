#!/bin/sh
# $Id: texlinks.sh 36938 2015-04-19 21:15:06Z karl $

# Thomas Esser, 1999, 2002, 2003. public domain.

# texlinks: script to maintain symlinks from format to engine. Interprets
# the lines given in fmtutil.cnf.

# History:
#   (Further changes in ChangeLog.)
#   Tue Oct  9 14:23:01 BST 2007
#      Added unlink option (-u) to aid OpenBSD package uninstall
#      Edd Barrett <vext01@gmail.com>
#   Sun Aug 28 21:41:06 CEST 2005
#      remove special cases for csplain,cslatex,pdfcslatex,pdfcsplain
#   Fr Apr  8 19:15:05 CEST 2005
#      cleanup now has an argument for the return code
#   So Mar 27 18:52:06 CEST 2005
#       honor $TMPDIR, $TEMP and $TMP, not just $TMP
#   Mon May 10 20:52:48 CEST 2004
#       kpseaccess instead of access
#   Thu Dec 25 22:11:53 CET 2003, te:
#       add version string
#   Tue Apr  9 22:46:34 CEST 2002, te:
#       do not create symlinks for cont-??, metafun and mptopdf

test -f /bin/sh5 && test -z "$RUNNING_SH5" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xULTRIX; } 2>/dev/null \
  && { RUNNING_SH5=true; export RUNNING_SH5; exec /bin/sh5 $0 ${1+"$@"}; }
unset RUNNING_SH5

test -f /bin/bsh && test -z "$RUNNING_BSH" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xAIX; } 2>/dev/null \
  && { RUNNING_BSH=true; export RUNNING_BSH; exec /bin/bsh $0 ${1+"$@"}; }
unset RUNNING_BSH

export PATH

# hack around a bug in zsh:
test -n "${ZSH_VERSION+set}" && alias -g '${1+"$@"}'='"$@"'

version='$Id: texlinks.sh 36938 2015-04-19 21:15:06Z karl $'
progname=texlinks
cnf=fmtutil.cnf   # name of the config file

usage='Usage: texlinks [OPTION]... [DIRECTORY]...

Create symbolic links format -> engine according to fmtutil setup.

Mandatory arguments to long options are mandatory for short options too.
  -e, --exeext EXT     append EXT to symlink targets (default: none)
  -f, --cnffile FILE   use FILE as config file (default: fmtutil.cnf)
  -m, --multiplatform  operate in all platform specific directories
                        (default: operate only in directory for this platform)
  -q, --quiet          silently skip existing scripts / binaries
                        (default: issue warning)
  -s, --silent         same as -q
  -u, --unlink	       remove symlinks created by texlinks
  -v, --verbose        enable verbose messages (default: off)
  -h, --help           show this help text
  --version            show version string

The DIRECTORY arguments are an optional list of directories in which to
operate.  If no directories are specified and --multiplatform is
likewise not specified, the directory of this script itself is used.
With --multiplatform, all child dirs of an upper-level bin/ dir are used.

Report bugs to: tex-k@tug.org
TeX Live home page: <http://tug.org/texlive/>
'

# print `errmsg' to stderr and exit with error code 1:
abort() { errmsg "texlinks: $1."; cleanup 1; }

# error message to stderr:
errmsg() { echo "$@" >&2; }

# give message to stderr only if "verbose" mode is on:
verbose_echo() { $verbose && errmsg "$@"; }

# in verbose mode: show command that is executed:
verbose_do() { verbose_echo "$@"; "$@"; }

# clean up the temp area and exit with proper exit status:
cleanup()
{
  rc=$1
  $needsCleanup && test -n "$tmpdir" && test -d "$tmpdir" \
    && { rm -f "$tmpdir"/*; cd /; rmdir "$tmpdir"; }
  exit $rc
}

###############################################################################
# setupTmpDir()
#   set up a temp directory and a trap to remove it
###############################################################################
setupTmpDir()
{
  $needsCleanup && return

  trap 'cleanup 1' 1 2 3 7 13 15
  needsCleanup=true
  (umask 077; mkdir "$tmpdir") \
    || abort "could not create directory \`$tmpdir'"
}


# search a binary along $PATH:
check_for_binary()
{
  testbin=$1
  set x `echo "$PATH" | sed 's/^:/.:/; s/:$/:./; s/::/:.:/g; s/:/ /g'`; shift
  for i
  do
    if [ -x "$i/$testbin" ]; then
      echo "$i/$testbin"
      return 0
    fi
  done
  return 1
}


###############################################################################
# install_link(dest src)
#   create a symlink like ln -s dest src, but make sure that src is not
#   an existing binary, possibly adding the executable extension if
#   passed on the command.
###############################################################################
install_link()
{
  # make symlink    src -> dest
  dest=$1; src=$2

  case $src in
    */mf)
      if test "$dest" = mf-nowin; then
        if test -f $selfautoloc/mfw; then
          dest=mfw  # name for windows-enabled mf, once upon a time
          verbose_echo "both mfw and mf-nowin exists, $src linked to $dest"
        fi
        if test -f $selfautoloc/mf && test -f $selfautoloc/mf-nowin; then
          # have both mf and mf-nowin binaries.  no link.
          verbose_echo "skipped metafont symlink $src -> $dest (special case)"
          return
        fi
      fi
      ;;
  esac

  # append .exe if supplied (for cygwin).
  test -n "$exeext" && dest="$dest$exeext"
  
  case $src in
    */cont-??|*/mptopdf)
      # context includes wrapper scripts that create/run these.
      verbose_echo "skipped ConTeXtish symlink $src -> $dest (special case)"
      ;;
    *)
      test "x$src" != "x`(ls -ld $src | awk '{print $NF}') 2>/dev/null`" &&
        rm -f "$src"
  
      if test -f "$src"; then
        if $silent; then :; else
          # i.e., the rm failed.
          errmsg "install_link $src -> $dest failed: file already exists."
        fi
      else
        if echo "$src" | grep '/pdfcsplain$' >/dev/null; then
          # at p.olsak insistence: we have three pdfcsplain entries in
          # fmtutil.cnf with different engines, but the executable link
          # must point to pdftex.
          verbose_echo "forcing pdfcsplain destination to be pdftex"
          dest=pdftex$exeext
        fi
        verbose_do ln -s "$dest" "$src"
      fi
      ;;
   esac
}

###############################################################################
# search_symlinkdir()
#   look if $PATH has only symlinks to the real binaries and find that
#   directory. Also check if this directory is writable.
###############################################################################
search_symlinkdir()
{
  kpsewhich=`check_for_binary kpsewhich`
  test -z "$kpsewhich" && return 1
  symlinkdir=`echo $kpsewhich | sed 's@/*kpsewhich$@@'`
  kpseaccess -w "$symlinkdir" || return 1
  touch "$symlinkdir/tl$$"
  if test -f "$selfautoloc/tl$$"; then
    rm -f "$symlinkdir/tl$$"
    return 1
  else
    rm -f "$symlinkdir/tl$$"
    return 0
  fi
}

###############################################################################
# upd_symlinkdir()
#   if $PATH has only symlinks to the real binaries, update that directory
#   that holds the symlinks
###############################################################################
upd_symlinkdir()
{
  search_symlinkdir || return 0
  for i in `sed 's@ .*@@' cnf_file_ln.$$`; do
    install_link "$selfautoloc/$i" "$symlinkdir/$i"
  done
}

###############################################################################
# rm_link()
#   Delete a previously installed link
###############################################################################
rm_link()
{
  link=$1;
  if test -e $link; then
    if test -h $link; then
      verbose_do rm -Rf $link
    else
      verbose_echo "kept $link, since not a symlink"
    fi
  else
    verbose_echo "skipped $link, non-existent"
  fi
}

###############################################################################
# main()
#   parse commandline arguments, initialize variables,
#   switch into temp. direcrory, execute desired command
###############################################################################
main()
{
  cnf_file=    # global variable: full name of the config file
  dirs=
  needsCleanup=false

  exeext=
  multiplatform=false
  verbose=false
  unlink=false
  silent=false
  thisdir=`pwd`
  : ${KPSE_DOT=$thisdir}; export KPSE_DOT
  selfautoloc=`kpsewhich --expand-var='$SELFAUTOLOC'`
  while 
    case $1 in
      --h*|-h)
          echo "$usage"; exit 0;;
      --version)
          echo "$progname version $version"; exit 0;;
      --cnffile|-f)
          shift; cnf_file=$1;;
      --e*|-e) shift; exeext=$1;;
      --m*|-m) multiplatform=true;;
      --s*|-s|--q*|-q) silent=true;;
      --u*|-u) unlink=true;;
      --v*|-v) verbose=true;;
      -*) errmsg "fmtutil: unknown option \`$1' ignored.";;
      *)  break;;
    esac
  do test $# -gt 0 && shift; done
  dirs="$*"

  # if no cnf_file from command-line, look it up with kpsewhich:
  test -z "$cnf_file" && cnf_file=`kpsewhich --format='web2c files' $cnf`
  test -f "$cnf_file" || abort "config file \`$cnf' not found"


  tmpdir=${TMPDIR-${TEMP-${TMP-/tmp}}}/texlinks.$$
  setupTmpDir
  cd "$tmpdir" || cleanup 1

  sed '/^[ 	]*#/d; /^[ 	]*$/d' $cnf_file \
    | awk '{print $1, $2}' > cnf_file_ln.$$

  if test -z "$dirs"; then
    if test $multiplatform = true; then
      case $selfautoloc in
        */bin) dirs=$selfautoloc;;
        *)     parent=`kpsewhich --expand-var='$SELFAUTODIR'`
               dirs=`find $parent -type f -name kpsewhich -print \
                       | sed 's@/kpsewhich$@@'`;;
      esac
    else
      dirs=$selfautoloc
    fi
  fi
  
  for d in $dirs; do
    kpseaccess -w $d \
      || { errmsg "$d: no write permissions. Skipping..."; continue; }
    # cnf_file_ln.$$ has lines with "format engine" pairs
    set x `cat cnf_file_ln.$$`; shift
    while test $# != 0; do
      fmt=$1; engine=$2; shift; shift

      # Some broken shells destroy the positional arguments when calling a
      # shellfunction. Therefore, we save and restore them "by hand" in the
      # main_args_while variable.
      main_args_while="$@"

      test "x$fmt" = "x$engine" && continue
      if test -f "$d/$engine$exeext"; then
        case $unlink in
        true)
          rm_link "$d/$fmt";;
        *)
          install_link "$engine" "$d/$fmt";;
        esac
      else
        verbose_echo "skipped $d/$engine, engine does not exist"
      fi

      # restore positional arguments:
      set x $main_args_while; shift

    done
  done
  upd_symlinkdir
}

main ${1+"$@"}

# set successful return code
cleanup 0
