#!/bin/sh

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

progname=`basename $0`
tmpdir=${TMPDIR-${TEMP-${TMP-/tmp}}}/$progname.$$

case "$progname" in
  allec)
    encoding=T1;;
  *)
    encoding=OT1;;
esac

case "$1" in
  -r)
    DVIPS=dvired
    shift
    ;;
  *)
    DVIPS=dvips
    ;;
esac

body()
{
  cat <<-'eof'
	\pagestyle{empty}
	\parindent0in
	\hfuzz=\maxdimen
	\hbadness=10000
	\textheight9.5in
	\textwidth6.5in
	\newcommand{\myformula}{\sum a_{b_{c_d}} = c}
	\newcommand{\mytext}{text $\mathcal{\myformula}\mathrm{\myformula}
	\mathbf{\myformula}\mathsf{\myformula}\mathtt{\myformula}
	\mathnormal{\myformula}\mathit{\myformula}$}

	\newcommand{\TestSizes}{{%
	\tiny \mytext\scriptsize \mytext\footnotesize \mytext\small \mytext
	\normalsize \mytext
	\large \mytext\Large \mytext\LARGE \mytext\huge \mytext\Huge \mytext}}
	\newcommand{\TestRM}{rm-family: {\rmfamily\TestSizes}\newline}
	\newcommand{\TestSF}{sf-family: {\sffamily\TestSizes}\newline}
	\newcommand{\TestTT}{tt-family: {\ttfamily\TestSizes}\newline}
	\newcommand{\TestFamilies}{\TestRM\TestSF\TestTT\newline}
	\newcommand{\TestMD}{md-series: {\mdseries\TestFamilies}}
	\newcommand{\TestBF}{bf-series: {\bfseries\TestFamilies}}
	\newcommand{\TestSeries}{\TestBF\TestMD\par}
	\newcommand{\TestUP}{up-shape: {\upshape\TestSeries}\par}
	\newcommand{\TestIT}{it-shape: {\itshape\TestSeries}\par}
	\newcommand{\TestSL}{sl-shape: {\slshape\TestSeries}\par}
	\newcommand{\TestSC}{sc-shape: {\scshape\TestSeries}\par}
	\newcommand{\TestShapes}{\TestUP\TestIT\TestSL\TestSC}
	\begin{document}
	\TestShapes
	\end{document}
eof
}

head()
{
  echo '\documentclass['$1'pt]{article}'
  echo '\usepackage['$encoding']{fontenc}'
}

# before we create the tmpdir, set trap for cleanup
trap '
  rm -rf $tmpdir
  exit 1
' 1 2 3 7 13 15

(umask 077; mkdir "$tmpdir") || {
  echo "$progname: failed to create temp directory." >&2
  exit 1
}

cd $tmpdir || exit 1
echo >&2
echo "---------------------------------------------------------------------" >&2
echo ">>>>>>>>>>>  Generating testfiles for 10pt, 11pt and 12pt. <<<<<<<<<<" >&2
echo "---------------------------------------------------------------------" >&2
head 10 > allcm10.tex
head 11 > allcm11.tex
head 12 > allcm12.tex
body >> allcm10.tex
body >> allcm11.tex
body >> allcm12.tex

echo >&2
echo "---------------------------------------------------------------------" >&2
echo ">>>>>>>>>>>  Calling latex...                              <<<<<<<<<<" >&2
echo "---------------------------------------------------------------------" >&2
latex allcm10 >/dev/null
latex allcm11 >/dev/null
latex allcm12 >/dev/null

echo >&2
echo "---------------------------------------------------------------------" >&2
echo ">>>>>>>>>>>  Now, calling $DVIPS to make missing fonts...  <<<<<<<<<<" >&2
echo "---------------------------------------------------------------------" >&2
$DVIPS ${1+"$@"} -V -f allcm10 > /dev/null
$DVIPS ${1+"$@"} -V -f allcm11 > /dev/null
$DVIPS ${1+"$@"} -V -f allcm12 > /dev/null

cd /
rm -rf $tmpdir
