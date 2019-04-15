#!/bin/sh

test -f /bin/sh5 && test -z "$RUNNING_SH5" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xULTRIX; } 2>/dev/null \
  && { RUNNING_SH5=true; export RUNNING_SH5; exec /bin/sh5 $0 ${1+"$@"}; }
unset RUNNING_SH5

test -f /bin/bsh && test -z "$RUNNING_BSH" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xAIX; } 2>/dev/null \
  && { RUNNING_BSH=true; export RUNNING_BSH; exec /bin/bsh $0 ${1+"$@"}; }
unset RUNNING_BSH

progname=`basename $0`
dvired=false

case $1 in
-r)	DVIPS="dvips -x707"
	shift;;
*)	DVIPS=dvips;;
esac

case $# in
0)	echo "Usage: $progname [-r] files ..." >&2
	exit ;;
esac

findopt=
dvipsopt=

for i
do
	if [ -f $i ] || [ -d $i ]; then
		findopt="$findopt $i"
	else
		dvipsopt="$dvipsopt $i"
	fi
done

find $findopt -name \*.dvi -type f -print |
  while true; do
	read i
	test -z "$i" && exit
	echo "processing file '$i' ..."
	$DVIPS $dvipsopt -f "$i" >/dev/null
	echo
   done
