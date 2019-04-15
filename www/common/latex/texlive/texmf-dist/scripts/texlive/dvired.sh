#!/bin/sh
#==============================================================================
# Version:      0.3
# Module:       dvired
# Purpose:      Translate dvi-file into postscript with reduced output size.
#		Two logical pages will be put on onto each physical sheet of
#		paper.
# System:	Linux. UNIX(tm) systems may work as well :-)
# Requires:	pstops (http://www.dcs.ed.ac.uk/home/ajcd/psutils/), dvips
# Created:      19.11.1992
# Last Change:  13.08.1999
# Language:     sh
# Author:       Thomas Esser
# Address:      te@dbs.uni-hannover.de
# Copyright:    (c) 1994, 1999 by Thomas Esser
# Copying:      GNU GENERAL PUBLIC LICENSE
#==============================================================================

test -f /bin/sh5 && test -z "$RUNNING_SH5" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xULTRIX; } 2>/dev/null \
  && { RUNNING_SH5=true; export RUNNING_SH5; exec /bin/sh5 $0 ${1+"$@"}; }
unset RUNNING_SH5

test -f /bin/bsh && test -z "$RUNNING_BSH" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xAIX; } 2>/dev/null \
  && { RUNNING_BSH=true; export RUNNING_BSH; exec /bin/bsh $0 ${1+"$@"}; }
unset RUNNING_BSH

help()
{
        cat <<eof

Usage: dvired [options] file

This programm behaves like dvips, execpt fot the fact that two logical
pages will be put on onto each physical sheet of paper.

For options see dvips(1). This program only interprets the options
-o, -P and -f. All other options will directly be passed to dvips.

If your paper is not in A4 format, you need to adjust the dimensions
in this program.

Examples: (it is assumed that the PRINTER-variable is set)
   dvired -Plw foo                 send output to printer lw
   dvired -o foo.ps foo            send output to file foo.ps
   dvired -pp4-7 foo               send 4 output-pages to printer
   dvired foo -f | ghostview -     preview output with ghostview
eof
}

case $# in
0)      help ; exit 1 ; ;;
esac

# This will work for A4 paper.
paper=a4 ;	pstopsopt='2:0(7.44mm,7.44mm)+1(7.44mm,-141.06mm)'

# The following are *UNTESTED*. Please let me know whether they work
# or not, if you can test them.
#paper=a3 ;	pstopsopt='2:0(7.44mm,7.44mm)+1(7.44mm,-202.56mm)'
#paper=letter ;	pstopsopt='2:0(7.44mm,7.44mm)+1(7.44mm,-132.26mm)'
#paper=legal ;	pstopsopt='2:0(7.44mm,7.44mm)+1(7.44mm,-170.36mm)'
#paper=ledger ;	pstopsopt='2:0(7.44mm,7.44mm)+1(7.44mm,-132.26mm)'
#paper=tabloid ;	pstopsopt='2:0(7.44mm,7.44mm)+1(7.44mm,-208.46mm)'

of=""
lpr_opt=""

case "$PRINTER" in
"")	dvips_pre="" ;;
*)	dvips_pre="-P$PRINTER" ;;
esac

dvips_pre="$dvips_pre -t $paper -t landscape"

while [ ! -z "$1" ] ; do
	case $1 in
	-P)	of="" ;  dvips_pre="$dvips_pre -P$2" ; lpr_opt="-P$2"
		shift ;;
	-P*)	of="" ;  dvips_pre="$dvips_pre $1" ; lpr_opt="$1" ;;
	-o)	of="$2"
		shift ;;
	-o*)	of="`echo $1| sed 's/..//'`" ;;
	-f)	of="-" ;;
	*)	opt="$opt $1"
	esac
	shift
done

case "$of" in
"")	dvips -x707 $dvips_pre $opt -f | pstops -q $pstopsopt | lpr $lpr_opt
	;;
"-")	dvips -x707 $dvips_pre $opt -f | pstops -q $pstopsopt
	;;
*)	dvips -x707 $dvips_pre $opt -f | pstops -q $pstopsopt > "$of"
	;;
esac
