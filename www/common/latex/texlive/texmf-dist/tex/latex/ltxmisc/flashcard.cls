%an experimental documentclass for flashcards.
%Use only with the understanding it may not work at all.
%More documentation after \endinput
\NeedsTeXFormat{LaTeX2e}[1995/12/01]
\ProvidesClass{flashcard}
              [2000/25/01 document class for flashcards]
\newcommand\@ptsize{}
\DeclareOption{a4paper}
   {\setlength\paperheight {297mm}%
    \setlength\paperwidth  {210mm}}
\DeclareOption{letterpaper}
   {\setlength\paperheight {11in}%
    \setlength\paperwidth  {8.5in}}
\DeclareOption{landscape}
   {\setlength\@tempdima   {\paperheight}%
    \setlength\paperheight {\paperwidth}%
    \setlength\paperwidth  {\@tempdima}}
\DeclareOption{centering}{\def\flashcardformat{\centering}}
\DeclareOption{raggedright}{\def\flashcardformat{\raggedright}}
\DeclareOption{raggedleft}{\def\flashcardformat{\raggedleft}}
\DeclareOption{justify}{\def\flashcardformat{\relax}}
\DeclareOption{10pt}{\renewcommand\@ptsize{0}}
\DeclareOption{11pt}{\renewcommand\@ptsize{1}}
\DeclareOption{12pt}{\renewcommand\@ptsize{2}}
\DeclareOption{oneside}{\@twosidefalse \@mparswitchfalse}
\DeclareOption{twoside}{\@twosidetrue  \@mparswitchtrue}
\DeclareOption{draft}{\setlength\overfullrule{5pt}}
\DeclareOption{final}{\setlength\overfullrule{0pt}}
\ExecuteOptions{10pt,oneside,justify,final}
\ProcessOptions\relax
\ifdim\paperwidth=0pt
\ClassError{Flashcard}{No papersize specified}
   {Please specify one of `a4paper' or `letterpaper' \MessageBreak
   as a option to the documentclass}
\fi
\RequirePackage{calc}
\input{size1\@ptsize.clo}
\setlength\lineskip{1\p@}
\setlength\normallineskip{1\p@}
\renewcommand\baselinestretch{}
\setlength\parskip{0pt}
\setlength\parindent{0pt}
\DeclareOldFontCommand{\rm}{\normalfont\rmfamily}{\mathrm}
\DeclareOldFontCommand{\sf}{\normalfont\sffamily}{\mathsf}
\DeclareOldFontCommand{\tt}{\normalfont\ttfamily}{\mathtt}
\DeclareOldFontCommand{\bf}{\normalfont\bfseries}{\mathbf}
\DeclareOldFontCommand{\it}{\normalfont\itshape}{\mathit}
\DeclareOldFontCommand{\sl}{\normalfont\slshape}{\@nomath\sl}
\DeclareOldFontCommand{\sc}{\normalfont\scshape}{\@nomath\sc}
\DeclareRobustCommand*\cal{\@fontswitch\relax\mathcal}
\DeclareRobustCommand*\mit{\@fontswitch\relax\mathnormal}
\def\today{\ifcase\month\or
  January\or February\or March\or April\or May\or June\or
  July\or August\or September\or October\or November\or December\fi
  \space\number\day, \number\year}
\setlength\columnsep{10\p@}
\setlength\columnseprule{0\p@}
\interlinepenalty=10000
\pagestyle{empty}
\newsavebox\flashcardi
\newsavebox\flashcardii
\newsavebox\flashcardiii
\newsavebox\flashcardiv
\newsavebox\flashcardv
\newsavebox\flashcardvi
\newsavebox\flashcardvii
\newsavebox\flashcardviii
\newcounter{flashcard}
\setcounter{flashcard}{1}
\newlength\flashcardwidth
\newlength{\flashcardheight}
\newlength{\halfflashcardwidth}
\setlength{\flashcardwidth}{0.5\textwidth-0.5\columnsep-2\fboxrule}
\setlength{\flashcardheight}{0.25\textheight-2\fboxrule-0.5\columnsep}
\setlength{\halfflashcardwidth}{0.5\flashcardwidth - 4pt}


\newcommand{\FC@pvbox}[1]{\fboxsep=2pt\fboxrule=0pt\fbox{\vbox{#1}}}
\newcommand\FC@nopadfbox{\fboxsep=0pt\fbox}
\newcommand{\flashcardtopic}[1]{\gdef\theflashcardtopic{#1}}
\flashcardtopic{}

\providecommand{\flashcardfrontword}{Question}
\providecommand{\flashcardbackword}{Answer}

\newcommand\flashcard{\@ifnextchar[{\@flashcardx}{\@flashcardx[]}}
\long\def\@flashcardx[#1]{\@ifnextchar[%
           {\@flashcardy[#1]}
	   {\@flashcardy[#1][\theflashcardtopic]}}
\long\def\@flashcardy[#1][#2]#3#4{%
\noindent\FC@nopadfbox{%
  \vbox to \flashcardheight{\@parboxrestore
                            \setlength{\hsize}{\flashcardwidth-4pt}%
     \hbox to \flashcardwidth{\strut\FC@pvbox{%
         \hsize=\halfflashcardwidth
	 \leavevmode\raggedright #1}%
              \hss\vrule\hss
  	      \FC@pvbox{
	           \hsize=\halfflashcardwidth
		   \leavevmode\raggedleft #2}}%
  \hrule
  \vss
  \FC@pvbox{\advance\hsize by -4pt\flashcardformat #3}% 
  \vss
  \hrule
  \hbox to \flashcardwidth{\strut\hfill\FC@pvbox{\flashcardfrontword}}}}% 
\ifodd\c@flashcard
   \hskip\columnsep
\else
   \hfill
   \par
\fi
\expandafter\setbox\csname flashcard\romannumeral\c@flashcard\endcsname
\hbox{%
\FC@nopadfbox{%
  \vbox to \flashcardheight{\@parboxrestore
                            \setlength{\hsize}{\flashcardwidth-4pt}%
     \hbox to \flashcardwidth{\strut\FC@pvbox{%
          \hsize=\halfflashcardwidth
	  \leavevmode\raggedright #1}%
              \hss\vrule\hss
  	      \FC@pvbox{%
	       \hsize=\halfflashcardwidth
	       \leavevmode\raggedleft #2}}%
  \hrule
  \vss
  \FC@pvbox{\advance\hsize by -4pt\flashcardformat #4}%
  \vss
  \hrule
  \hbox to \flashcardwidth{\strut\hfill\FC@pvbox{\flashcardbackword}}}}}%
  \ifnum\value{flashcard}=8\relax
     \vfill
     \pagebreak
     \noindent\hfill\unhbox\flashcardii\hskip\columnsep\unhbox\flashcardi\par
     \noindent\hfill\unhbox\flashcardiv\hskip\columnsep\unhbox\flashcardiii\par
     \noindent\hfill\unhbox\flashcardvi\hskip\columnsep\unhbox\flashcardv\par
     \noindent\hfill\unhbox\flashcardviii\hskip\columnsep\unhbox\flashcardvii\par\par\vfill\pagebreak
     \setcounter{flashcard}{1}%
  \else
     \stepcounter{flashcard}%
  \fi\ignorespaces} 

\AtEndDocument{\flushflashcards}
\newcommand\flushflashcards{%
   \loop\ifnum\value{flashcard}>1\@flashcardy[][]{}{}\repeat}

%\newcount\@@endlinechar
%\@@endlinechar=\endlinechar
\endlinechar=32 %pars must be explicit.

\endinput

The use of this class is as follows:

\documentclass[a4paper]{flashcard}
\renewcommand{\flashcardformat}{\centering\LARGE}
\renewcommand{\flashcardbackword}{Solution}
\flashcardtopic{The Holy Grail}

\begin{document}
\flashcard{Who rescues Sir Galahad from the Castle Anthrax?}{Sir
Lancelot}
\flashcard[Ni!]{What is the one word the Knights of Ni can't hear?}{It}
\flashcard[][Credits]{What once bit the narrator's sister?}{A Moose}
\flashcard{How does King Arthur defeat the killer rabbit?}{Uses the Holy
Hand Grenade of Antioch}
\flashcard{What majority is required by the peasants council for
external matters?}{2/3}
\flashcard{What initial punishment is to be given to Zut for her setting
off the beacon?}{A spanking}
\flashcard{How much does it cost to `bring out your dead'}{Nine pence}
\flashcard{Who's last words are recorded in the cave?}{Joseph of
Arimathea}
\flashcard{What is the name of the enchanter}{There are some that call
him Tim}
\flashcard{What shape has the earth been proven to be?}{Banana shaped} 
\end{document}
