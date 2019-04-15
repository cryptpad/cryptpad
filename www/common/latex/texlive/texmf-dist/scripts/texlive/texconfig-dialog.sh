#!/bin/sh
# $Id: texconfig-dialog.sh 34586 2014-07-13 00:06:11Z karl $
# texconfig-dialog
# Originally written by Thomas Esser. Public domain.
# Now maintained as part of TeX Live; correspondence to tex-live@tug.org.

# invoke the right shell:

test -f /bin/ksh && test -z "$RUNNING_KSH" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xULTRIX; } 2>/dev/null \
  && { RUNNING_KSH=true; export RUNNING_KSH; exec /bin/ksh $0 ${1+"$@"}; }
unset RUNNING_KSH

test -f /bin/bsh && test -z "$RUNNING_BSH" \
  && { UNAMES=`uname -s`; test "x$UNAMES" = xAIX; } 2>/dev/null \
  && { RUNNING_BSH=true; export RUNNING_BSH; exec /bin/bsh $0 ${1+"$@"}; }
unset RUNNING_BSH

# hack around a bug in zsh:
test -n "${ZSH_VERSION+set}" && alias -g '${1+"$@"}'='"$@"'

# preferentially use subprograms from our own directory.
mydir=`echo "$0" | sed 's,/[^/]*$,,'`
mydir=`cd "$mydir" && pwd`
PATH="$mydir:$PATH"; export PATH

# the version string
version='$Id: texconfig-dialog.sh 34586 2014-07-13 00:06:11Z karl $'

: ${PAGER=more}
progname=texconfig-dialog
tmpdir=${TMPDIR-${TEMP-${TMP-/tmp}}}/tcdtmp.$$
log=$tmpdir/log
tmpmenu=$tmpdir/tmpmenu
needsCleanup=false

###############################################################################
# cleanup()
#   clean up the temp area and exit with proper exit status
###############################################################################
cleanup()
{
  rc=$1
  $needsCleanup && test -n "$tmpdir" && test -d "$tmpdir" \
    && { cd / && rm -rf "$tmpdir"; }
  termCtl reset
  (exit $rc); exit $rc
}

###############################################################################
# setupTmpDir()
#   set up a temp directory and a trap to remove it
###############################################################################
setupTmpDir()
{
  case $needsCleanup in
    true) return;;
  esac

  trap 'cleanup 1' 1 2 3 7 13 15
  needsCleanup=true
  (umask 077; mkdir "$tmpdir") \
    || abort "could not create directory \`$tmpdir'"
}

###############################################################################
# abort(errmsg)
#   print `errmsg' to stderr and exit with error code 1
###############################################################################
abort()
{
  echo "$progname: $1." >&2
  cleanup 1
}

logexec()
{
  (echo; echo ">>> Executing \`$@' <<<") >> $log
  "$@" 2>&1 | tee -a $log
}

###############################################################################
# runDialog(args, ...)
#   execute the right dialog program with the right default parameters
###############################################################################
runDialog()
{
  if test -n "$DIALOG_PROG"; then
    termCtl clear
    $DIALOG_PROG --title "TeX setup utility" ${1+"$@"}
    runDialogRc=$?
    termCtl clear
  else
    abort "could not find dialog or whiptail program to run"
  fi
  (exit $runDialogRc)
  return $runDialogRc
}

###############################################################################
# findDialog(void)
#   set DIALOG_PROG to the system dialog program, or the empty string.
###############################################################################
findDialog()
{
  for bin in whiptail dialog
  do
    binLoc=`texconfig findprog $bin`
    case $binLoc in
      "") DIALOG_PROG="";;
      *)  DIALOG_PROG=$binLoc; break;;
    esac
  done
}

###############################################################################
# mktexdir(args)
#   call mktexdir script, disable all features (to prevent sticky directories)
###############################################################################
mktexdir()
{
  MT_FEATURES=none "$TEXMFMAIN/web2c/mktexdir" "$@" >&2
}

###############################################################################
# termCtl(arg)
#   some convenience utilities for terminal control
###############################################################################
termCtl()
{
  case $1 in
    clear)
      test -n "$NO_CLEAR" && return
      tty >/dev/null 2>&1 && clear
      ;;
    reset)
      test -n "$NO_CLEAR" && return
      reset 2>/dev/null
      stty sane 2>/dev/null
      reset 2>/dev/null
      termCtl clear
      ;;
    readln)
      echo
      echo "press return to continue..."
      read a
      ;;
  esac
}

###############################################################################
# menuMain(void)
#   the main menu
###############################################################################
menuMain()
{
  cat <<-'eof'
	The interactive texconfig utility will be started now. Make sure
	your screen has at least 24 rows and 80 columns. If texconfig
	crashes now, you can still set up your TeX system using the
	batch mode of texconfig.  Try 'texconfig help' to get a list
	of options.

	The interactive mode works best with a real vt100 terminal or
	inside an xterm window.
	
	More likely these days, you're better off using tlmgr.
	See http://tug.org/texlive/tlmgr.html.
eof
  termCtl readln

  while :; do
    logMessage='view logfile'

    runDialog \
      --menu "
Hint: all output of external commands (e.g. tex) is logged into
a file. You can look at this file using "LOG". If cursor keys make
trouble, you may have more luck with +/- and TAB.
" \
      23 80 14 \
      EXIT      'exit' \
      PAPER     'default paper: A4 or letter (us)' \
      MODE      'default metafont mode and resolution' \
      REHASH    'rebuild filename databases' \
      FORMATS   'edit format definitions' \
      HYPHENATION   'customize hyphenation' \
      DVIPS     'dvips configuration' \
      FAQ       'view frequently asked questions + answers' \
      CONF      'show configuration' \
      LOG       "$logMessage" \
      2>"$tmpmenu" || break
    
    case `cat "$tmpmenu"` in
      EXIT)
        break
        ;;
      PAPER)
        menuPaper
        ;;
      MODE)
        menuMode
        ;;
      REHASH)
        logexec texconfig rehash
        termCtl readln
        ;;
      FORMATS)
        texconfig formats
        termCtl readln
        ;;
      HYPHENATION)
        menuHyphenation
        ;;
      DVIPS)
        menuDvips
        ;;
      FAQ)
        texconfig faq
        termCtl readln
        ;;
      CONF)
        logexec texconfig conf
        termCtl readln
        ;;
      LOG)
        <"$log" eval $PAGER
        termCtl readln
        ;;
    esac
  done
}

menuGetMode()
{
  # we need eval to get the command line right... :-(
  eval \
    runDialog \
      --menu \""
Chosse a mode to be used when metafont generates font bitmaps. The resolution is the most important point, but there might
be differences between modes of the same resolution. See the comments in the file modes.mf for more details.
\"" \
      23 80 14 \
      `texconfig mode-list` 2>"$tmpmenu"
}

menuMode()
{
  menuGetMode
  mode=`cat "$tmpmenu"`

  if test -n "$mode"; then
    logexec texconfig mode "$mode"
    termCtl readln
  fi
}

menuDvips()
{
  menuDvipsDest=ps

  while :; do
    case $menuDvipsDest in
      ps)
        menuDvipsPrinterOpt=
        menuDvipsMsg="
dvips GLOBAL section. Define the most common default settings (config.ps).
To define settings for a specific printer, first ADD a printer definition,
then CHANGE it.
"
        ;;
      *)
        menuDvipsPrinterOpt="-P $menuDvipsDest"
        menuDvipsMsg="
dvips settings for printer $menuDvipsDest (config.$menuDvipsDest). Define
local settings for this printer. To switch back to global settings mode,
select GLOBAL.
"
        ;;
    esac

    runDialog \
      --menu "$menuDvipsMsg
You can use dvips for non PostScript printers, if you can setup your
printing system to convert PostScript to a format that your printer can
handle. Maybe, you can use GhostScript to do the conversion (if your
printer is supported)." \
      23 80 9 \
      RETURN	'back to the main menu' \
      DEST      'define default destination of the generated Postscript' \
      MODE      'change metafont mode/resolution' \
      OFFSET    'shift output by some offset' \
      PAPER     'define the default paper' \
      GLOBAL	'change global settings (config.ps)' \
      CHANGE	'change printer settings (config.$PRINTER)' \
      ADD	'add a printer configuration' \
      DEL	'remove a printer configuration' \
        2>"$tmpmenu" || break

    menuDvipsAns=`cat "$tmpmenu"`
    case $menuDvipsAns in
      RETURN)
        break
        ;;
      DEST)
        runDialog --inputbox "Enter the command to print.

In general, you need a command like 'lpr' or 'lpr -Pfoo'.

NOTE: If you just press return, printing will be disabled and the output saved to a file by default.
" 23 80 2>"$tmpmenu"
        if test $? = 0; then
          menuDvipsAns=`cat "$tmpmenu"`
          case $menuDvipsAns in
            "")
              menuDvipsPrintOpt=-
              ;;
            *)
              menuDvipsPrintOpt=$menuDvipsAns
              ;;
          esac
          logexec texconfig dvips $menuDvipsPrinterOpt printcmd "$menuDvipsPrintOpt"
          termCtl readln
        fi
        ;;
      MODE)
        menuGetMode
        mode=`cat "$tmpmenu"`
  
        if test -n "$mode"; then
          logexec texconfig dvips $menuDvipsPrinterOpt mode "$mode"
          termCtl readln
        fi
        ;;
      OFFSET)
        runDialog --inputbox "Enter a dimension pair (a rightwards offset and a downwards
offset), e.g. 2mm,-0.5in (right 2mm and up .5in):" 23 80 2>"$tmpmenu"; menuDvipsAns=`cat "$tmpmenu"`
        case $menuDvipsAns in
          "") : ;;
          *)
            logexec texconfig dvips $menuDvipsPrinterOpt offset "$menuDvipsAns"
            termCtl readln
            ;;
        esac
        ;;
      PAPER)
        eval runDialog \
          --menu \'\\n\\nChoose the default papersize definition for dvips.\\n\\n\' \
          23 80 8 `texconfig dvips paper-list` \
          2>"$tmpmenu"
        paper=`cat "$tmpmenu"`
        if test -n "$paper"; then
          logexec texconfig dvips paper "$paper"
          termCtl readln
        fi
        ;;
      GLOBAL)
        menuDvipsDest=ps
        ;;
      CHANGE)
        runDialog --inputbox "Printer name (for future settings of DEST / MODE / OFFSET)" 23 80 2>"$tmpmenu"
        menuDvipsAns=`cat $tmpmenu`
        case $menuDvipsAns in
          "") : ;;
          *)  menuDvipsDest=$menuDvipsAns;;
        esac
        ;;
      ADD)
        runDialog --inputbox "Printer name (for printer to add)" 23 80 2>"$tmpmenu"
        menuDvipsAns=`cat $tmpmenu`
        case $menuDvipsAns in
          "") : ;;
          *)
            logexec texconfig dvips add $menuDvipsAns
            termCtl readln
            ;;
        esac
        ;;
      DEL)
        runDialog --inputbox "Printer name (for printer to delete)" 23 80 2>"$tmpmenu"
        menuDvipsAns=`cat $tmpmenu`
        case $menuDvipsAns in
          "") : ;;
          *)
	    logexec texconfig dvips del $menuDvipsAns
            termCtl readln
            ;;
        esac
        ;;
    esac
  done
}

menuPaper()
{
  runDialog \
    --menu "
Select your default paper format.
" \
    23 80 14 \
    RETURN 'return to the main menu' \
    A4	'ISO A4 (210x297mm)' \
    LETTER 'US (8.5x11in)' 2>"$tmpmenu"

  p=`cat "$tmpmenu"`
  case $p in
    A4)
      logexec texconfig paper a4
      termCtl readln
      ;;
    LETTER)
      logexec texconfig paper letter
      termCtl readln
      ;;
  esac
}

menuHyphenation()
{
  runDialog \
    --menu "
Choose format to set up hyphenation for.
" \
    23 80 14 \
    `texconfig hyphen-list | sed 's@\(.*\)@\1 \1@'`  2>"$tmpmenu"
  p=`cat "$tmpmenu"`
  case $p in
    "")
      return
      ;;
    *)
      texconfig hyphen "$p"
      termCtl readln
  esac
}

# main()

case $1 in
  help|--help)
    cat <<-eof
	Usage: $progname [--help|--version]
eof
    exit 0
    ;;
  --version)
    cat <<-eof
	$progname version $version.
eof
    exit 0
    ;;
esac


: ${TEXMFCONFIG=`kpsewhich -var-value=TEXMFCONFIG`}
: ${TEXMFVAR=`kpsewhich -var-value=TEXMFVAR`}
: ${TEXMFMAIN=`kpsewhich -var-value=TEXMFMAIN`}
export TEXMFCONFIG TEXMFVAR TEXMFMAIN

setupTmpDir
echo "$progname: started `date`" > $log
findDialog

test -d "$TEXMFCONFIG" \
  || mktexdir "$TEXMFCONFIG" >/dev/null 2>&1 \
  || echo "$progname: directory \`$TEXMFCONFIG' (from TEXMFCONFIG variable) does not exist and cannot be created" >&2

canWriteConfig=false
if test -d "$TEXMFCONFIG"; then
  if test -w "$TEXMFCONFIG"; then
    canWriteConfig=true
  else
    echo "$progname: directory \`$TEXMFCONFIG' (from TEXMFCONFIG variable) is not writable."
    echo "$progname: configuration data cannot be changed." >&2
  fi
fi

test -d "$TEXMFVAR" \
  || mktexdir "$TEXMFVAR" >/dev/null 2>&1 \
  || echo "$progname: directory \`$TEXMFVAR' (from TEXMFVAR variable) does not exist and cannot be created" >&2

canWriteVardata=false
if test -d "$TEXMFVAR"; then
  if test -w "$TEXMFVAR"; then
    canWriteVardata=true
  else
    echo "$progname: directory \`$TEXMFVAR' (from TEXMFVAR variable) is not writable."
    echo "$progname: cached variable runtime data files cannot be written." >&2
  fi
fi

menuMain
cleanup 0
