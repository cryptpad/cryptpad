%%
%% This is the file `iagproc.cls' intended for formatting submissions to
%% IAG (International Association of Geodesy) Proceedings.
%%
%% Originally written as 'banff.cls', for the Banff GGG2000 symposium.
%% An adaptation from 'article.cls', (c) The LaTeX3 Project and
%% individual authors:
%%
%%          Leslie Lamport
%%          Johannes Braams
%%          David Carlisle
%%          Alan Jeffrey
%%          Frank Mittelbach
%%          Chris Rowley
%%          Rainer Schoepf
%%     
%% License
%%   
%% 'iagproc.cls' is free software that can be redistributed and/or 
%% modified under the terms of the LaTeX Project Public License as 
%% specified in the LaTeX Project Public License:
%%
%%		http://www.latex-project.org/lppl.html
%%
%% Adapted from 'article.cls' (c) Martin Vermeer 2000
%% Small adaptations (c) Hussein Abd-Elmotaal 2000
%% Small adaptations (c) Martin Vermeer 2003
%%
%% Your class definition should be 
%%
%%     \documentclass{iagproc}
%%
\NeedsTeXFormat{LaTeX2e}

\ProvidesClass{iagproc}
          [2003/01/22 v0.3 IAG Conference Proceedings]
% Options:
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax
%
\LoadClass[10pt,twocolumn]{article}
%%\RequirePackage{mathptm}
%%\RequirePackage{times}
\RequirePackage{natbib}
%%\RequirePackage{apalike}
% Redefine \maketitle:
\renewcommand\maketitle{\par
 \begingroup
   \renewcommand\thefootnote{\@fnsymbol\c@footnote}%
   \def\@makefnmark{\rlap{\@textsuperscript{\normalfont\@thefnmark}}}%
   \long\def\@makefntext##1{\parindent 1em\noindent
           \hb@xt@1.8em{%
               \hss\@textsuperscript{\normalfont\@thefnmark}}##1}%
 \twocolumn[\@maketitle]%
 \global\@topnum\z@   % Prevents figures from going at top of page.
 \thispagestyle{empty}%
 \@thanks
 \endgroup
 \setcounter{footnote}{0}%
 \global\let\thanks\relax
 \global\let\maketitle\relax
 \global\let\@maketitle\relax
 \global\let\@thanks\@empty
 \global\let\@author\@empty
 \global\let\@date\@empty
 \global\let\@title\@empty
 \global\let\title\relax
 \global\let\author\relax
 \global\let\date\relax
 \global\let\and\relax
}
%
\def\@maketitle{%
 \newpage
 \vbox to 4.8cm {
   \let \footnote \thanks
   {\par\normalfont\huge\bfseries\sffamily%
     \raggedright%
   \@title\par}%
   \vskip 0.6cm
   \normalfont\normalsize\@author%
 }%
}%
%
\newcommand\keywordsname{Keywords}

\newcommand*\abstractlabel[1]{\normalfont\bfseries\abstractname.\quad}%
\newcommand*\keywordslabel[1]{\normalfont\bfseries\keywordsname.\quad}%
\renewenvironment{abstract}{%
  \list{}{\topsep\z@%
          \labelsep\z@%
          \labelwidth\z@%
          \itemindent\z@%
      \rightmargin\z@%
      \leftmargin\z@%
          \let\makelabel\abstractlabel}%
      \item\relax
      }%
     {\endlist}%
%
\newenvironment{keywords}{%
  \list{}{\topsep\z@%
          \labelsep\z@%
          \labelwidth\z@%
          \itemindent\z@%
      \rightmargin\z@%
	  \leftmargin\z@%
          \let\makelabel\keywordslabel}%
      \item\relax
      }%
     {\endlist\par\vskip4mm\hrule}%
%
% Redefine \section and \subsection:
%\renewcommand\chapter{\@startsection {chapter}{0}{\z@}%
%                                  {-3.25ex \@plus -0.6ex \@minus -.2ex}%
%                                  {4mm \@plus0.1ex}%
%   {\normalfont\raggedright\Large\bfseries\sffamily}}
\renewcommand\section{\@startsection {section}{1}{\z@}%
                                  {-4mm \@plus -0.6ex \@minus -.2ex}%
                                  {4mm \@plus0.1ex}%
   {\normalfont\raggedright\large\bfseries\sffamily}}
\renewcommand\subsection{\@startsection{subsection}{2}{\z@}%
                                    {-4mm \@plus -0.3ex \@minus -.2ex}%
                                    {4mm \@plus0ex}%
   {\normalfont\raggedright\bfseries\sffamily}}
\renewcommand\subsubsection{\@startsection{subsubsection}{3}{\z@}%
                                    {-4mm \@plus -0.2ex \@minus -.2ex}%
                                    {4mm \@plus0ex}%
   {\normalfont\raggedright\sffamily\bfseries\itshape}}
% Redefine section, subsection numbering:
\renewcommand \thesection {\@arabic\c@section}
\renewcommand\thesubsection{\thesection.\@arabic\c@subsection}
\renewcommand\thesubsubsection{\thesubsection.\@arabic\c@subsubsection}

%
\newcommand{\journal}[1]{\def\@journal{#1\ }}

\setlength\intextsep{8mm}
\setlength\floatsep{8mm}
\setlength\abovecaptionskip{2mm}
\setlength\belowcaptionskip{2mm}

% Redefine default font etc.:
\long\def\@makecaption#1#2{%
 \vskip\abovecaptionskip
 \small
 \sbox\@tempboxa{\textbf{#1.} #2}%
%% \ifdim \wd\@tempboxa >\hsize
%%   \@hangfrom{\textbf{#1.} }#2\par
   \textbf{#1.} #2\par
%% \else
%%   \global \@minipagefalse
%%   \hb@xt@\hsize{\hfil\box\@tempboxa\hfil}%
%% \fi
 \vskip\belowcaptionskip
}%
\renewenvironment{table}
               {\@float{table}\small}
               {\end@float}
\renewenvironment{table*}
               {\@dblfloat{table}\small}
               {\end@dblfloat}
\newenvironment{acknowledgements}{%
  \list{}{\labelsep\z@%
          \labelwidth\z@%
          \itemindent\z@%
	  \leftmargin\z@%
          \let\makelabel\acknowslabel}%
	  \item\relax
	  \small\itshape}%
	 {\endlist}%

\def\refname{References}

\def\@cite#1#2{(#1\if@tempswa , #2\fi)}
\def\@biblabel#1{}

\def\thebibliography#1{\section*{\refname\@mkboth
  {\sl\uppercase{\refname}}{\sl\uppercase{\refname}}}\list
  {\relax}{\setlength{\labelsep}{0em}
  \setlength{\itemindent}{-4mm}
  \setlength{\leftmargin}{4mm}}
  \setlength{\parsep}{0pt}
  \setlength{\itemsep}{0pt plus 2pt} 
%    \def\newblock{\hskip .11em plus .33em minus .07em}
    \sloppy\clubpenalty4000\widowpenalty4000
    \sfcode`\.=1000\relax}%

\renewcommand\labelitemi[0]{\(\circ\)}
\renewcommand\labelitemii[0]{\(\triangleright\)}
\renewcommand\labelitemiii[0]{\normalfont\bfseries{--}}
\renewcommand\labelitemiv[0]{\(\cdot\)}
%
\renewcommand{\topfraction}{.9}
\renewcommand{\bottomfraction}{.9}
\renewcommand{\textfraction}{.1}
\pagestyle{plain}
%\input{fleqn.clo}                             %%% deactived by Hussein
\setlength{\columnsep}{8mm}
\setlength{\textheight}{224mm}
\setlength{\textwidth}{156mm}
%
\setlength\parindent{4mm}
\flushbottom
%\setlength\mathindent{4mm}                    %%% deactivated Hussein
%

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% This is a new section added by Hussein
%% to allow the balance of the two columns
%% of the last page of the manuscript
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\newcommand{\@BAlancecol}{\if@twocolumn
  \setbox0=\vbox{\unvbox\@outputbox} \@tempdima=\ht0
  \advance\@tempdima by \topskip \advance\@tempdima
     by -\baselineskip \divide\@tempdima by 2
     \splittopskip=\topskip
  {\vbadness=\@M \loop \global\setbox3=\copy0
   \global\setbox1=\vsplit3 to \@tempdima
   \ifdim\ht3>\@tempdima \global\advance\@tempdima by 1pt \repeat}
   \setbox\@leftcolumn=\vbox to \@tempdima{\unvbox1\vfil}
   \setbox\@outputbox=\vbox to \@tempdima
     {\dimen2=\dp3\unvbox3\kern-\dimen2
      \vfil}
  \fi}
\newif\if@BAlanceone
\global\@BAlanceonefalse
\newdimen\oldvsize
\newcommand{\@BAdblcol}{\if@firstcolumn
       \unvbox\@outputbox \penalty\outputpenalty
       \global\oldvsize=\@colht \global\multiply \@colht by 2
       \global\@BAlanceonetrue
       \global\@firstcolumnfalse
  \else \global\@firstcolumntrue
       \if@BAlanceone
       \global\@BAlanceonefalse\@BAlancecol
       \global\@colht=\oldvsize \else
       \PackageWarningNoLine{balance}
          {You have called \protect\balance\space
             in second column\MessageBreak
           Columns might not be balanced}\fi
     \setbox\@outputbox\vbox to \@colht{\hbox to\textwidth
     {\hbox to\columnwidth {\box\@leftcolumn \hss}\hfil
      \vrule width\columnseprule\hfil \hbox to\columnwidth
      {\box\@outputbox \hss}}\vfil}\@combinedblfloats
     \@outputpage \begingroup \@dblfloatplacement
     \@startdblcolumn \@whilesw\if@fcolmade \fi
     {\@outputpage\@startdblcolumn}\endgroup
  \fi}
\newcommand{\@BAcleardblpage}{\clearpage\if@twoside \ifodd\c@page\else
  \hbox{}\newpage\fi\fi}
\newcommand{\balance}{\global\let\@outputdblcol=\@BAdblcol
  \global\let\cleardoublepage=\@BAcleardblpage}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% This is a new section added by Hussein
%% for float seperation
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\dblfloatsep 10pt plus 2pt minus 4pt \dbltextfloatsep 10pt plus 2pt minus 4pt
\@fptop 0pt plus 1fil \@fpsep 10pt plus 2fil \@fpbot 0pt plus 1fil 
\@dblfptop 0pt plus 1fil \@dblfpsep 10pt plus 2fil \@dblfpbot 0pt plus 1fil

\endinput
%%
%% End of file `iagproc.cls'.

