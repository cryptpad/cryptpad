#!/bin/sh
# options for dvips are passwd down

test -f /bin/sh5 && test -z "$RUNNING_SH5" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xULTRIX; } 2>/dev/null \
  && { RUNNING_SH5=true; export RUNNING_SH5; exec /bin/sh5 $0 ${1+"$@"}; }
unset RUNNING_SH5

test -f /bin/bsh && test -z "$RUNNING_BSH" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xAIX; } 2>/dev/null \
  && { RUNNING_BSH=true; export RUNNING_BSH; exec /bin/bsh $0 ${1+"$@"}; }
unset RUNNING_BSH

# hack around a bug in zsh:
test -n "${ZSH_VERSION+set}" && alias -g '${1+"$@"}'='"$@"'

progname=`basename "$0"`
help()
{
  echo "Usage: $progname [-hi|-lo] file[.dvi] [options for dvips]"
  echo "  -hi: use high fax resolution (204x196) (default)"
  echo "  -lo: use low fax resolution (204x98)"
  echo
  echo "Example: $progname foo -l 2"
}

dvipsconf=dfaxhigh; gsdev=dfaxhigh
case $1 in
  -hi) gsdev=dfaxhigh; shift;;
  -lo) gsdev=dfaxlow; shift;;
esac

case $# in
  0) help >&2
     exit 1
     ;;
esac

NAME=`basename "$1" .dvi`
dvips "$@" -P$dvipsconf -f |
  gs -q -dSAFER -sDEVICE=$gsdev -sOutputFile="$NAME-%03d.fax" -sNOPAUSE -
