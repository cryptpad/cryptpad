#!/bin/sh
#
# Thomas Esser, Hans Fredrik Nordhaug, 2003, 2004.
# Public domain.
#
# kpsewhere is an extension to kpsewhich (as where is for which in tcsh).
# The intention is to provide a way to check for conflicts/shadowed
# files.
#
# Original version by Hans Fredrik Nordhaug <hans.fredrik@nordhaug.no>
#
# Bugs / limitations:
#   conflicts/shadowed files whithin each texmf tree are not found.
#


test -f /bin/sh5 && test -z "$RUNNING_SH5" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xULTRIX; } 2>/dev/null \
  && { RUNNING_SH5=true; export RUNNING_SH5; exec /bin/sh5 $0 ${1+"$@"}; }
unset RUNNING_SH5

test -f /bin/bsh && test -z "$RUNNING_BSH" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xAIX; } 2>/dev/null \
  && { RUNNING_BSH=true; export RUNNING_BSH; exec /bin/bsh $0 ${1+"$@"}; }
unset RUNNING_BSH

export PATH

help='Usage: kpsewhere [OPTION]... [FILENAME]...
  Expanding kpsewhich to iterate over each texmf tree listed in $TEXMF
  separately.

  See kpsewhich for help on options. 

  --help        show this help'

options=
while 
  case $1 in
     -h|-help|--help)
             echo "$help" >&2
             exit 0;;
     -*)     options="${options} '${1}'";;
      *)     break;;
  esac
do shift; done

case $# in
  0)
    echo "$help" >&2
    exit 1
    ;;
esac

IFS=':'
for file
do
    for path in `kpsewhich --expand-path='$TEXMF'`
    do
        eval TEXMF=\$path kpsewhich $options \"\$file\"
    done
done
exit 0
