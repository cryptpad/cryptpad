%
%	This is second version of the class. It redefines Chapters 
%	sections and subsections, in order to use the minitoc style!
%
%
% DESCRIPTION:
%
%	-``Quick and dirty'' class file for ``book of abstracts''
%	 (used for IWEPNM - Kirchberg 1997)
%
%	- It's getting less Quick and dirty, but it's far from beeing 
%	what i want, should be much more flexible for that.
%
%	-Written by Havlik Denis (havlik@pap.univie.ac.at) 02/1997.
%	-Based on the report class. 
% 
%	This .cls file has been written for the conference in Kirchberg.
%	It has been designed to produce a4-size pages,
%	which are later converted into a5. Output is double-sided.
%
%	Abstracts are suposed to be in separate files, with simple
%	formating (title, name, adress, text).
%
%	As i have a feeling that many conferences need something
%	like this booklet, i will try to document this file as good as 
%	i can. In the case anybody is interesting to use this class,
%	but neads more flexibility or new features, i would be pleased 
%	to help. This is a first time ever that i write a Latex class,
%	but i'm learning.   
%
%	Features: 
%	-Conferences consist of days and sessions.
%	-In every day there can be one or more sessions, in every
%	 session there can be several abstracts. Abstracts appear
%	 two on a page, with short name of the session, the number
%	 of the abstract and an additional entry WRITTEN ON THE MARGIN. 
%	-In the headings, day appears on the even, and session on the odd
%	 pages. 
%	-For every day, a table of abstracts is printed
%	-names of the authors are automatically added to index of authors
%	 (don't forget to run the ``makeindex''!!!) 
%	
% I would like to thank the ``\"Osterreichischen Fonds zur F\"orderung 
% der wissenschaftlichen Forschung'' for financing my work 
% under project Nr. +P10924-PHY. Furthermore, a Linux, and \TeX/\LaTeX 
% comunity, for providing wonderfull free software, that i use for all my 
% work. Special thanks to Jean-Pierre Drucbert 
%					Havlik Denis 
%
% TODO: 
%	1. redefine \titl, \name and \adr, so i can get automatic: 
%	indexing of authors and automatic referencing of authors to adress
%	2. automatic resizing of abstracts to fit other page-sizes, 
%	(not only a4) and other margines etc.
%	3. add formatting stuff like:
%		 \newcommand{\titlstyle}{\bf \Large \MakeUppercase}
%	with some logical names and use it consequently for all the macros
%	in the whole class
%	4. ?%
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{abstbook}[1997/02/10 for typseting book of abstracts]
\DeclareOption{twocolumn}{\OptionNotUsed} % makes no sense to use it...
% All other options go to ``report'' class.
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{report}}
\ProcessOptions
\LoadClass[a4,twoside]{report}
\RequirePackage{makeidx} % neaded to make index
\RequirePackage{graphicx} % neaded to input graphics into booklet.
%\RequirePackage{minitoc}
% page - size related stuff. Looks good on my printer...
\setlength{\unitlength}{1cm}
%\setlength{\topmargin}{1.5cm}
\setlength{\hoffset}{-0.8in}
%\setlength{\voffset}{-1in} 
\setlength{\textwidth}{16.5cm}
\setlength{\textheight}{24.8cm}
\setlength{\topskip}{0cm}
\setlength{\footskip}{0cm}
\setlength{\oddsidemargin}{1.5cm}
\setlength{\evensidemargin}{1.5cm}
\setlength{\marginparsep}{0.3cm}
\setlength{\marginparwidth}{1.0 cm}
\setlength{\parindent}{0cm}
\pagestyle{myheadings} 		% to get the day - session in headings!

% I had to redefine \chapter  because i have to use it, if i want
% mini-tables-of-contents... 
\renewcommand\chapter{\if@openright\cleardoublepage\else\clearpage\fi
                    \global\@topnum\z@
                    \@afterindentfalse
                    \secdef\@chapter\@schapter}
\def\@makechapterhead#1{\relax} 	%write nothing...
\RequirePackage{minitoc}

\AtBeginDocument{% this comes after \begin{document}
		\makeindex 
		\dominitoc 
		\faketableofcontents}	

\AtEndDocument{\printindex}	% dont forget to run the ``makeindex'' program!
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
%	COMMANDS
%
\newcounter{Cabstract}[section]
\newsavebox{\ConferenceDay} % hier comes the name of the day
\newsavebox{\SessionName}   % name of the session
\newsavebox{\ShortSessionName}% short name of the session
% Counters for days, sessions and abstracts.
% hope this will work....

\sbox{\ConferenceDay}{}
\sbox{\SessionName}{}
\markboth{\usebox{\ConferenceDay}}{\usebox{\SessionName}}

\def\mtctitle{\relax}%

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%  Command: 	\conferenceday
%  Usage: 	\conferenceday{some day}
%  Provides:	advances day-counter, adds the day-name to TOC 
%		and clears the page		
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\newcommand{\conferenceday}[1]{%
	\chapter{#1}
	{\Large \bf #1}\par 
	\minitoc
	\sbox{\ConferenceDay}{#1} 
	\sbox{\SessionName}{#1}
	}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%  Command:	\sessionname
%  Usage: 	\sessionname{shortname}{longname}
%  Provides:    advances session-counter, adds the session-name to TOC
%		and clears the page
%  Important:	I'm not using \section here. Instead, i try to emulate 
%		the part that i nead. It worked with my version 
%		of minitoc, but didn't work with an older version 
%		we had at the university. Bad. Redefining \section 
%		would be better, but i can't figure it out.
%		Well, Jean-Pierre Drucbert <Jean-Pierre.Drucbert@onecert.fr>
%		said it should be O.K., so be it. 
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\newcommand{\sessionname}[2]{%
	\clearpage
	\refstepcounter{section}
	\sbox{\ShortSessionName}{#1}
	\sbox{\SessionName}{#2}
	\addcontentsline{toc}{section}{\MakeUppercase{#2}}
	}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Following definitions determine how to deal with the abstracts     %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% ABSTRACTS SHOULD BE IN SEPARATE FILES, FORMATED LIKE THIS:
%
% Abstract example: 
%	\index{Name1} \index{Name2}... - this is nessesary for authornames 
%					to appear in index!!!  
%	\titl{Title of the abstract}
%	\name{A. First$^1$, A. Second$^1$, A. Third$^2$}
%	\adr{1~First address\\
%	     2~Second addrass}
%
%	\begin{abstr}
%	Abstracts text (in Latex notation). Most of the Latex commands 
%	can be used here...
%	\end{abstr}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
% TO DO:
% I would like to change \name and \adr in such a way that
%
%	\name[mark1]{name1}
%	\name[mark2]{name2}
%	\name[mark1]{name3}
%	\adr[adr1]{adress1}
%	\adr[adr2]{adress2}
%
%	produces the same result as one obtained in the previous example
%	and automaticaly includes the names into index list...
%	Unfortunately, i don't know how to do it.
% !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%	COMMANDS TO BE USED IN ABSTRACTS:
%
% Title of the abstract
\newcommand{\titl}[1]{\large \bf \MakeUppercase{#1}\par\medskip}
% author(s) name(s)
\newcommand{\name}[1]{\rm \normalsize #1\par\smallskip}
% author(s) addres(es)
\newcommand{\adr}[1]{\it \normalsize #1\par\smallskip}
% enviroment ``abstr''
\newenvironment{abstr}{\par\medskip \normalsize \rm}{\par\bigskip}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%	COMMANDS TO BE USED IN THE MAIN DOCUMENT
%
% Command: 	\loadabstr
% Usage: 	\loadabstr[additional]{TOC-entry}{filename.tex}
% Provides:	reserves 1/2 page for the abstract, loads the abstract 
%		from the file ``filename.tex'', writes the ``TOC-entry''
%		to table of contents, advances the abstracts-counter
%		and writes the short name of the session, abstract-number
%		and an additional entry to the margin. 
% (We have used the additional entry for the time..)
%usage: \loadabstr[additional]{toc-entry}{name.tex}
\newcommand{\loadabstr}[3][\relax]{%
	\stepcounter{Cabstract}
	\par
	\rule[-6cm]{0cm}{12cm}	% well, you might nead to change this
				% if you change the size/format of the page
	\marginpar{%
		\large\centering
		#1\par\smallskip
		\usebox{\ShortSessionName}\par\smallskip
		\arabic{Cabstract}}
	  \IfFileExists{#3}{%
	    \begin{minipage}{16.5cm} % this too...
		\input{#3} 
	    \end{minipage}}
	    {File #3 not found}
	\addcontentsline{toc}{subsection}{#2}
	}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%  Command:	\loadpsabstr
%  Usage:	\loadpsabstr[additional]{toc-entry}{name.ps}{formating}
%  Provides:	Some of our abstracts arrived as postscript or with s-mail
%		This commands loads the postscript file, cuts part of it out
%		and puts it on its place, just like \loadabstr does with 
%		an latex file. Additional parameter goes directly to 
%		``includegraphics'' (see explanation of graphicx package)
%		try something like: scale=1, bb=2.5cm 16cm 19cm 28cm 
\newcommand{\loadpsabstr}[4][\relax]{%
	\stepcounter{Cabstract}
	\par
	\rule[-6cm]{0cm}{12cm}	% well, you might nead to change this
				% if you change the size/format of the page
	\marginpar{%
		\large\centering
		#1\par\smallskip
		\usebox{\ShortSessionName}\par\smallskip
		\arabic{Cabstract}}
	  \begin{minipage}{16.5cm} % this too...
	  \unitlength	1cm
	  \IfFileExists{#3}{%
	    \begin{picture}(16.5,12) % and this, too!
	      \put(0,0){%
	        \includegraphics[%
		  angle=0, clip=true, #4]{#3}}
	    \end{picture}}
	    {File #3 not found!}
	\end{minipage}
	\addcontentsline{toc}{subsection}{#2}
	}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% end of the Kirchberg.cls
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%




