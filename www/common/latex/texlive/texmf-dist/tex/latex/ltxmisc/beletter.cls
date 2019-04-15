%%%%%%%%%% beletter.cls %%%%%%%%%%
% This file is public domain
% This code is unsupported, and comes with no warranty.
% This class was written by James Kilfiger and Frank Lenaerts, to meet
% the specifications for formatting Belgium letters recommended by
% Frank's wife.
% It can be used in place of the standard LaTeX class
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{beletter}[1999/06/05 Belgium Letter Class]
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{letter}}
\ProcessOptions\relax
\LoadClass{letter}
% changed the opening
\renewcommand*{\opening}[1]{%
  \thispagestyle{firstpage}%
  \ifx\@empty\fromaddress
  \else  %if there is a from address
    \noindent\begin{tabular}[t]{@{}l@{}}%
      \fromaddress
    \end{tabular}\par%
  \fi 
  \noindent\begin{tabular}[t]{@{}l@{}}%
    \toname\\ \toaddress
  \end{tabular}\par
  {\raggedleft\@date\par}%  Put the date on a line of it's own
%    \@date\par%
  \vspace{2\parskip}%
  #1\par\nobreak
  \vspace{2\parskip}%
}

%%% Change these!!, or let babel change them for you.
\renewcommand*{\ccname}{cc}
\renewcommand*{\enclname}{}
\renewcommand*{\pagename}{}
\renewcommand*{\headtoname}{}

% changed the closing
\renewcommand{\closing}[1]{\par\nobreak\vspace{\parskip}%
  \stopbreaks
  \vspace{2\parskip}%
  \vspace{2\parskip}%
  \noindent
%  \ifx\@empty\fromaddress\else
%  \hspace*{\longindentation}\fi
  \parbox{\indentedwidth}{\raggedright
       \ignorespaces #1\\[6\medskipamount]%
       \ifx\@empty\fromsig
           \fromname
       \else \fromsig \fi\strut}%
   \par}

\renewcommand*{\cc}[1]{%
  \par\noindent
  \parbox[t]{\textwidth}{%
    \@hangfrom{\normalfont\ccname}%
    \ignorespaces #1\strut}\par}
\endinput
