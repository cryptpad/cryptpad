#!/bin/sh

# kpsetool. Script to make teTeX-style kpsetool, kpsexpand and kpsepath
# available. Web2C's kpsewhich offers a superset of the functionality.
# For compatibilty with old versions of teTeX, this script provides the
# old command line interface of kpsetool, kpsexpand and kpsepath. All the
# real work is done inside Web2C's kpsewhich.
# Thomas Esser <te@dbs.uni-hannover.de>, Mar 1997, public domain.

export PATH

usage="
Usage: kpsexpand [options] string
Usage: kpsetool -w [options] pathtype filename
Usage: kpsepath  [options] pathtype

Valid options are the following:
  -n progname  : pretend to be progname to kpathsea
  -m mode      : set Metafont mode
  -w           : locate files (similar to kpsewhich)
  -p           : act like kpsepath
  -v           : act like kpsexpand

Valid pathtypes are:
  gf            : generic font bitmap
  pk            : packed bitmap font
  base          : Metafont memory dump
  bib           : BibTeX bibliography source
  bst           : BibTeX style files
  cnf           : Kpathsea runtime configuration files
  fmt           : TeX memory dump
  mem           : MetaPost memory dump
  mf            : Metafont source
  mfpool        : Metafont program strings
  mp            : MetaPost source
  mppool        : MetaPost program strings
  mpsupport     : MetaPost support files
  pict          : Other kinds of figures
  tex           : TeX source
  texpool       : TeX program strings
  tfm           : TeX font metrics
  vf            : virtual font
  dvips_config  : dvips config files
  dvips_header  : dvips header files
  troff_font    : troff fonts
"

action=kpsexpand
case $0 in
  */kpsewhich) action=kpsewhich;;
  */kpsepath)  action=kpsepath;;
esac

progname=`echo $0 | sed 's@.*/@@'`
flags=''

while true; do
  case x"$1" in
    x-n)
      if test $# = 1; then
        echo "$progname: missing argument for -n."
        echo "$usage"; exit 1
      else
        flags="$flags -progname=$2"; shift; shift
      fi;;
    x-m)
      if test $# = 1; then
        echo "$progname: missing argument for -m."
        echo "$usage"; exit 1
      else
        flags="$flags -mode=$2"; shift; shift
      fi;;
    x-w) action=kpsewhich; shift;; 
    x-p) action=kpsepath; shift;;
    x-v) action=kpsexpand; shift;;
    *) break;;
  esac
done

case "$action" in
  kpsewhich|kpsepath)
    case "$1" in
      gf)		format='gf';;
      pk)		format='pk';;
      base)		format='.base';;
      bib)		format='.bib';;
      bst)		format='.bst';;
      cnf)		format='.cnf';;
      fmt)		format='.fmt';;
      mem)		format='.mem';;
      mf)		format='.mf';;
      mfpool)		format='.pool';;
      mp)		format='.mp';;
      mppool)		format='.pool';;
      mpsupport)	format='MetaPost support';;
      pict)		format='.eps';;
      tex)		format='.tex';;
      texpool)		format='.pool';;
      tfm)		format='.tfm';;
      vf)		format='.vf';;
      dvips_config)	format='dvips config';;
      dvips_header)	format='.pro';;
      troff_font)	format='Troff fonts';;
      *)		echo "$progname: $1: unknown format"; echo "$usage"; exit 1;;
    esac
    shift;;
esac

case "$action" in
  kpsewhich)
    test $# = 1 || { echo "$progname: missing filename"; echo "$usage"; exit 1; }
    kpsewhich $flags -format="$format" "$1";;
  kpsepath)
    kpsewhich $flags -show-path="$format";;
  kpsexpand)
    test $# = 1 || { echo "$progname: missing string"; echo "$usage"; exit 1; }
    kpsewhich $flags -expand-var="$1";;
esac
