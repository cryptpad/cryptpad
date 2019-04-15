%%% ====================================================================
%%%  @BibTeX-style-file{
%%%     filename        = "amsalpha.bst",
%%%     version         = "2.0",
%%%     date            = "2000/03/27",
%%%     time            = "13:49:36 EST",
%%%     checksum        = "00166 1404 4124 29978",
%%%     author          = "American Mathematical Society",
%%%     address         = "American Mathematical Society,
%%%                        Technical Support,
%%%                        Electronic Products and Services,
%%%                        P. O. Box 6248,
%%%                        Providence, RI 02940,
%%%                        USA",
%%%     telephone       = "401-455-4080 or (in the USA and Canada)
%%%                        800-321-4AMS (321-4267)",
%%%     FAX             = "401-331-3842",
%%%     email           = "tech-support@ams.org (Internet)",
%%%     copyright       = "Copyright 1995 American Mathematical Society,
%%%                        all rights reserved.  Copying of this file is
%%%                        authorized only if either:
%%%                        (1) you make absolutely no changes to your copy,
%%%                        including name; OR
%%%                        (2) if you do make changes, you first rename it
%%%                        to some other name.",
%%%     codetable       = "ISO/ASCII",
%%%     keywords        = "bibtex, bibliography, amslatex, ams-latex",
%%%     supported       = "yes",
%%%     abstract        = "BibTeX bibliography style `amsalpha' for BibTeX
%%%                        versions 0.99a or later and LaTeX version 2e.
%%%                        Produces alphabetic-label bibliography items in
%%%                        a form typical for American Mathematical Society
%%%                        publications.",
%%%     docstring       = "The checksum field above contains a CRC-16
%%%                        checksum as the first value, followed by the
%%%                        equivalent of the standard UNIX wc (word
%%%                        count) utility output of lines, words, and
%%%                        characters.  This is produced by Robert
%%%                        Solovay's checksum utility.",
%%%  }
%%% ====================================================================

% See the file btxbst.doc for extra documentation other than
% what is included here.  And see btxhak.tex for a description
% of the BibTeX language and how to use it.

% This defines the types of fields that can occur in a database entry
% for this particular bibliography style.  Except for `language',
% this is the standard list from alpha.bst.

%% Types of entries currently allowed in a BibTeX file:
%%
%% ARTICLE -- An article from a journal or magazine.
%%
%% BOOK -- A book with an explicit publisher.
%%
%% BOOKLET -- A work that is printed and bound,
%% but without a named publisher or sponsoring institution.
%%
%% CONFERENCE -- The same as INPROCEEDINGS,
%% included for Scribe compatibility.
%%
%% INBOOK -- A part of a book,
%% which may be a chapter (or section or whatever) and/or a range of pages.
%%
%% INCOLLECTION -- A part of a book having its own title.
%%
%% INPROCEEDINGS -- An article in a conference proceedings.
%%
%% MANUAL -- Technical documentation.
%%
%% MASTERSTHESIS -- A Master's thesis.
%%
%% MISC -- Use this type when nothing else fits.
%%
%% PHDTHESIS -- A PhD thesis.
%%
%% PROCEEDINGS -- The proceedings of a conference.
%%
%% TECHREPORT -- A report published by a school or other institution,
%% usually numbered within a series.
%%
%% UNPUBLISHED -- A document having an author and title, but not formally
%% published.

ENTRY
  { address
    author
    booktitle
    chapter
    edition
    editor
    howpublished
    institution
    journal
    key
    language
    month
    mrnumber
    note
    number
    organization
    pages
    publisher
    school
    series
    title
    type
    volume
    year
  }
  {}
  { label extra.label sort.label bysame }

% Removed after.sentence, after.block---not needed.

INTEGERS { output.state before.all mid.sentence }

FUNCTION {init.state.consts}
{ #0 'before.all :=
  #1 'mid.sentence :=
}

% Scratch variables:

STRINGS { s t }

% Utility functions

FUNCTION {shows}
{ duplicate$ "::::  `" swap$ * "'" * top$
}

FUNCTION {showstack}
{"STACK====================================================================="
top$
stack$
"ENDSTACK=================================================================="
top$
}

FUNCTION {not}
{   { #0 }
    { #1 }
  if$
}

FUNCTION {and}
{   'skip$
    { pop$ #0 }
  if$
}

FUNCTION {or}
{   { pop$ #1 }
    'skip$
  if$
}

FUNCTION {field.or.null}
{ duplicate$ empty$
    { pop$ "" }
    'skip$
  if$
}

FUNCTION {emphasize}
{ duplicate$ empty$
    { pop$ "" }
    { "\emph{" swap$ * "}" * }
  if$
}

% n.dashify is used to make sure page ranges get the TeX code
% (two hyphens) for en-dashes.

FUNCTION {n.dashify}
{ 't :=
  ""
    { t empty$ not }
    { t #1 #1 substring$ "-" =
	{ t #1 #2 substring$ "--" = not
	    { "--" *
	      t #2 global.max$ substring$ 't :=
	    }
	    {   { t #1 #1 substring$ "-" = }
		{ "-" *
		  t #2 global.max$ substring$ 't :=
		}
	      while$
	    }
	  if$
	}
	{ t #1 #1 substring$ *
	  t #2 global.max$ substring$ 't :=
	}
      if$
    }
  while$
}

% tie.or.space.connect connects two items with a ~ if the
% second item is less than 3 letters long, otherwise it just puts an
% ordinary space.

FUNCTION {tie.or.space.connect}
{ duplicate$ text.length$ #3 <
    { "~" }
    { " " }
  if$
  swap$ * *
}

FUNCTION {add.space.if.necessary}
{ duplicate$ "" =
    'skip$
    { " " * }
  if$
}

% either.or.check gives a warning if two mutually exclusive fields
% were used in the database.

FUNCTION {either.or.check}
{ empty$
    'pop$
    { "can't use both " swap$ * " fields in " * cite$ * warning$ }
  if$
}

% output.nonnull is called by output.

FUNCTION {output.nonnull}
% remove the top item from the stack because it's in the way.
{ 's :=
  output.state mid.sentence =
% If we're in mid-sentence, add a comma to the new top item and write it
    { ", " * write$ }
% Otherwise, if we're at the beginning of a bibitem,
    { output.state before.all =
% just write out the top item from the stack;
      'write$
% and the last alternative is that we're at the end of the current
% bibitem, so we add a period to the top stack item and write it out.
        { add.period$ " " * write$ }
      if$
      mid.sentence 'output.state :=
    }
  if$
% Put the top item back on the stack that we removed earlier.
  s
}

% Output checks to see if the stack top is empty; if not, it
% calls output.nonnull to write it out.

FUNCTION {output}
{ duplicate$ empty$
    'pop$
    'output.nonnull
  if$
}

% Standard warning message for a missing or empty field. For the user
% we call any such field `missing' without respect to the distinction
% made by BibTeX between missing and empty.

FUNCTION {missing.warning}
{ "missing " swap$ * " in " * cite$ * warning$ }

% Output.check is like output except that it gives a warning on-screen
% if the given field in the database entry is empty.  t is the field
% name.

FUNCTION {output.check}
{ 't :=
  duplicate$ empty$
    { pop$ t missing.warning }
    'output.nonnull
  if$
}

FUNCTION {output.bibitem}
{ newline$
  "\bibitem[" write$
  label write$
  "]{" write$
  cite$ write$
  "}" write$
  newline$
% This empty string is the first thing that will be written
% the next time write$ is called.  Done this way because each
% item is saved on the stack until we find out what punctuation
% should be added after it.  Therefore we need an empty first item.
  ""
  before.all 'output.state :=
}

FUNCTION {output.nonempty.mrnumber}
{ duplicate$ missing$
    { pop$ "" }
    'skip$
  if$
  duplicate$ empty$
    'pop$
    { " \MR{" swap$ * "}" * write$ }
  if$
}

FUNCTION {fin.entry}
{ add.period$
  write$
  mrnumber output.nonempty.mrnumber
  newline$
}

% Removed new.block, new.block.checka, new.block.checkb, new.sentence,
% new.sentence.checka, and new.sentence.checkb functions here, since they
% don't seem to be needed in the AMS style.  Also moved some real
% basic functions like `and' and 'or' earlier in the file.

INTEGERS { nameptr namesleft numnames }

% The extra section to write out a language field was added
% for AMSPLAIN.BST.  Not present in plain.bst.

FUNCTION {format.language}
{ language empty$
    { "" }
    { " (" language * ")" * }
  if$
}

% This version of format.names puts names in the format
%
% First von Last, Jr.
%
% (i.e., first name first, no abbreviating to initials).

FUNCTION {format.names}
{ 's :=
  #1 'nameptr :=
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    { s nameptr "{ff~}{vv~}{ll}{, jj}" format.name$ 't :=
      nameptr #1 >
	{ namesleft #1 >
	    { ", " * t * }
	    { numnames #2 >
		{ "," * }
		'skip$
	      if$
	      t "others" =
		{ " et~al." * }
		{ " and " * t * }
	      if$
	    }
	  if$
	}
	't
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {format.authors}
{ author empty$
    { "" }
    { bysame "\bysame" =
         { bysame }
         { author format.names }
     if$
    }
  if$
}

FUNCTION {format.editors}
{ editor empty$
    { "" }
    { editor format.names
      editor num.names$ #1 >
	{ " (eds.)" * }
	{ " (ed.)" * }
      if$
    }
  if$
}

FUNCTION {format.nonauthor.editors}
{ editor empty$
    { "" }
    { editor format.names
      editor num.names$ #1 >
	{ ", eds." * }
	{ ", ed." * }
      if$
    }
  if$
}

FUNCTION {format.title}
{ title empty$
    { "" }
    { title "t" change.case$ emphasize }
  if$
}

FUNCTION {format.journal.vol.year}
{ journal empty$
    { "" "journal name" missing.warning }
    { journal
      volume empty$
        'skip$
        { " \textbf{" * volume * "}" * }
      if$
      year empty$
        { "year" missing.warning }
        { " (" * year * ")" * }
      if$
    }
  if$
}

% For formatting the issue number for a journal article.

FUNCTION {format.number}
{ number empty$
    { "" }
    { "no.~" number * }
  if$
}

% For formatting miscellaneous dates

FUNCTION {format.date}
{ year empty$
    { month empty$
	{ "" }
	{ "there's a month but no year in " cite$ * warning$
	  month
	}
      if$
    }
    { month empty$
	'year
	{ month " " * year * }
      if$
    }
  if$
}

%%      The volume, series and number information is sort of tricky.
%%      This code handles it as follows:
%%      If the series is present, and the volume, but not the number,
%%        then we do "\emph{Book title}, Series Name, vol. 000"
%%      If the series is present, and the number, but not the volume,
%%        then we do "\emph{Book title}, Series Name, no. 000"
%%      If the series is present, and both number and volume,
%%        then we do "\emph{Book title}, vol. XX, Series Name, no. 000"
%%      Finally, if the series is absent,
%%        then we do "\emph{Book title}, vol. XX"
%%        or         "\emph{Book title}, no. 000"
%%        and if both volume and number are present, give a warning message.

FUNCTION {format.bookvolume.series.number}
{ volume empty$
    { "" % Push the empty string as a placeholder in case everything else
         % is empty too.
      series empty$
        'skip$
        { pop$ series } % if series is not empty put in stack
      if$
      number empty$
        'skip$
        { duplicate$ empty$ % if no preceding material,
            'skip$          % do nothing, otherwise
            { ", " * }      % add a comma and space to separate.
          if$
          "no." number tie.or.space.connect * % add the number information
        }
      if$
    }
%% If the volume is NOT EMPTY:
    { "vol." volume tie.or.space.connect % vol. XX
      number empty$
        { series empty$
            'skip$
            { series ", " * swap$ *}    % Series Name, vol. XX
          if$
        }
        { series empty$
            { "can't use both volume and number if series info is missing"
              warning$
              "in BibTeX entry type `" type$ * "'" * top$
            }
            { ", " * series * ", no." * number tie.or.space.connect }
          if$
        }
      if$
    }
  if$

}  % end of format.bookvolume.series.number

%% format.inproc.title.where.editors is used by inproceedings entry types

%%      No case changing or emphasizing for the title.  We want initial
%%      caps, roman.
%%      We add parentheses around the address (place where conference
%%      was held).
%%      Likewise we add parentheses around the editors' names.

FUNCTION {format.inproc.title.address.editors}
{ booktitle empty$
    { "" }
    { booktitle
      address empty$
        'skip$
        { add.space.if.necessary "(" * address * ")" * }
      if$
      editor empty$
        'skip$
        { add.space.if.necessary "(" * format.nonauthor.editors * ")" * }
      if$
    }
  if$
}

%% format.incoll.title.editors is similar to format.inproc... but
%% omits the address. For collections that are not proceedings volumes.

FUNCTION {format.incoll.title.editors}
{ booktitle empty$
    { "" }
    { editor empty$
        { booktitle }
        { booktitle
          add.space.if.necessary "(" * format.nonauthor.editors * ")" *
        }
      if$
    }
  if$
}

FUNCTION {format.edition}
{ edition empty$
    { "" }
    { output.state mid.sentence =
	{ edition "l" change.case$ " ed." * }
	{ edition "t" change.case$ " ed." * }
      if$
    }
  if$
}

INTEGERS { multiresult }

FUNCTION {multi.page.check}
{ 't :=
  #0 'multiresult :=
    { multiresult not
      t empty$ not
      and
    }
    { t #1 #1 substring$
      duplicate$ "-" =
      swap$ duplicate$ "," =
      swap$ "+" =
      or or
	{ #1 'multiresult := }
	{ t #2 global.max$ substring$ 't := }
      if$
    }
  while$
  multiresult
}

FUNCTION {format.pages}
{ pages empty$
    { "" }
    { pages n.dashify }
  if$
}

FUNCTION {format.book.pages}
{ pages empty$
    { "" }
    { pages multi.page.check
	{ "pp.~" pages n.dashify * }
	{ "p.~" pages * }
      if$
    }
  if$
}

FUNCTION {format.chapter.pages}
{ chapter empty$
    'format.book.pages
    { type empty$
	{ "ch.~" }
	{ type "l" change.case$ " " * }
      if$
      chapter *
      pages empty$
	'skip$
	{ ", " * format.book.pages * }
      if$
    }
  if$
}

FUNCTION {empty.misc.check}
{ author empty$ title empty$ howpublished empty$
  month empty$ year empty$ note empty$
  and and and and and
  key empty$ not and
    { "all relevant fields are empty in " cite$ * warning$ }
    'skip$
  if$
}

FUNCTION {format.thesis.type}
{ type empty$
    'skip$
    { pop$
      type "t" change.case$
    }
  if$
}

FUNCTION {format.tr.number}
{ type empty$
    { "Tech. Report" }
    'type
  if$
  number empty$
    { "t" change.case$ }
    { number tie.or.space.connect }
  if$
}

% The format.crossref functions haven't been paid much attention
% at the present time (June 1990) and could probably use some
% work.  MJD

FUNCTION {format.article.crossref}
{ key empty$
    { journal empty$
	{ "need key or journal for " cite$ * " to crossref " * crossref *
	  warning$
	  ""
	}
	{ "in " journal * }
      if$
    }
    { "in " key * }
  if$
  " \cite{" * crossref * "}" *
}

FUNCTION {format.crossref.editor}
{ editor #1 "{vv~}{ll}" format.name$
  editor num.names$ duplicate$
  #2 >
    { pop$ " et~al." * }
    { #2 <
	'skip$
	{ editor #2 "{ff }{vv }{ll}{ jj}" format.name$ "others" =
	    { " et~al." * }
	    { " and " * editor #2 "{vv~}{ll}" format.name$ * }
	  if$
	}
      if$
    }
  if$
}

FUNCTION {format.book.crossref}
{ volume empty$
    { "empty volume in " cite$ * "'s crossref of " * crossref * warning$
      "in "
    }
    { "vol." volume tie.or.space.connect
      " of " *
    }
  if$
  editor empty$
  editor field.or.null author field.or.null =
  or
    { key empty$
	{ series empty$
	    { "need editor, key, or series for " cite$ * " to crossref " *
	      crossref * warning$
	      "" *
	    }
	    { series * }
	  if$
	}
	{ key * }
      if$
    }
    { format.crossref.editor * }
  if$
  " \cite{" * crossref * "}" *
}

FUNCTION {format.incoll.inproc.crossref}
{ editor empty$
  editor field.or.null author field.or.null =
  or
    { key empty$
	{ booktitle empty$
	    { "need editor, key, or booktitle for " cite$ * " to crossref " *
	      crossref * warning$
	      ""
	    }
	    { "in \emph{" booktitle * "}" * }
	  if$
	}
	{ "in " key * }
      if$
    }
    { "in " format.crossref.editor * }
  if$
  " \cite{" * crossref * "}" *
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% The main functions for each entry type.

% journal, vol and year are formatted together because they are
% not separated by commas.

FUNCTION {article}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  crossref missing$
    { format.journal.vol.year "journal, volume, and year" output.check
      format.number output
      format.pages "pages" output.check
    }
    { format.article.crossref output.nonnull
      format.pages "pages" output.check
    }
  if$
  format.language *
  note output
  fin.entry
}

FUNCTION {book}
{ output.bibitem
  author empty$
    { format.editors "author and editor" output.check }
    { format.authors output.nonnull
      crossref missing$
	{ "author and editor" editor either.or.check }
	'skip$
      if$
    }
  if$
  format.title "title" output.check
  format.edition output
  crossref missing$
    { format.bookvolume.series.number output
      publisher "publisher" output.check
      address output
    }
    { format.book.crossref output.nonnull
    }
  if$
  format.date "year" output.check
  format.language *
  note output
  fin.entry
}

FUNCTION {booklet}
{ output.bibitem
  format.authors output
  format.title "title" output.check
  howpublished output
  address output
  format.date output
  note output
  fin.entry
}

FUNCTION {inbook}
{ output.bibitem
  author empty$
    { format.editors "author and editor" output.check }
    { format.authors output.nonnull
      crossref missing$
	{ "author and editor" editor either.or.check }
	'skip$
      if$
    }
  if$
  format.title "title" output.check
  format.edition output
  crossref missing$
    { format.bookvolume.series.number output
      format.chapter.pages "chapter and pages" output.check
      publisher "publisher" output.check
      address output
    }
    { format.chapter.pages "chapter and pages" output.check
      format.book.crossref output.nonnull
    }
  if$
  format.date "year" output.check
  format.language *
  note output
  fin.entry
}

FUNCTION {incollection}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  crossref missing$
    { format.incoll.title.editors "booktitle" output.check
      format.bookvolume.series.number output
      publisher "publisher" output.check
      address output
      format.edition output
      format.date "year" output.check
    }
    { format.incoll.inproc.crossref output.nonnull
    }
  if$
  note output
  format.book.pages output
  format.language *
  fin.entry
}

FUNCTION {inproceedings}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  crossref missing$
    { format.inproc.title.address.editors "booktitle" output.check
      format.bookvolume.series.number output
      organization output
      publisher output
      format.date "year" output.check
    }
    { format.incoll.inproc.crossref output.nonnull
    }
  if$
  note output
  format.book.pages output
  format.language *
  fin.entry
}

FUNCTION {conference} { inproceedings }

FUNCTION {manual}
{ output.bibitem
  author empty$
    { organization empty$
	'skip$
	{ organization output.nonnull
	  address output
	}
      if$
    }
    { format.authors output.nonnull }
  if$
  format.title "title" output.check
  author empty$
    { organization empty$
	{ address output }
	'skip$
      if$
    }
    { organization output
      address output
    }
  if$
  format.edition output
  format.date output
  note output
  fin.entry
}

FUNCTION {mastersthesis}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  "Master's thesis" format.thesis.type output.nonnull
  school "school" output.check
  address output
  format.date "year" output.check
  note output
  format.book.pages output
  fin.entry
}

FUNCTION {misc}
{ output.bibitem
  format.authors output
  format.title output
  howpublished output
  format.date output
  note output
  format.book.pages output
  fin.entry
  empty.misc.check
}

FUNCTION {phdthesis}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  "Ph.D. thesis" format.thesis.type output.nonnull
  school "school" output.check
  address output
  format.date "year" output.check
  note output
  format.book.pages output
  fin.entry
}

FUNCTION {proceedings}
{ output.bibitem
  editor empty$
    { organization output }
    { format.editors output.nonnull }
  if$
  format.title "title" output.check
  format.bookvolume.series.number output
  address empty$
    { editor empty$
        'skip$
	{ organization output }
      if$
      publisher output
      format.date "year" output.check
    }
    { address output.nonnull
      editor empty$
	'skip$
	{ organization output }
      if$
      publisher output
      format.date "year" output.check
    }
  if$
  note output
  fin.entry
}

FUNCTION {techreport}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  format.tr.number output.nonnull
  institution "institution" output.check
  address output
  format.date "year" output.check
  note output
  fin.entry
}

FUNCTION {unpublished}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  note "note" output.check
  format.date output
  fin.entry
}

FUNCTION {default.type} { misc }

MACRO {jan} {"January"}

MACRO {feb} {"February"}

MACRO {mar} {"March"}

MACRO {apr} {"April"}

MACRO {may} {"May"}

MACRO {jun} {"June"}

MACRO {jul} {"July"}

MACRO {aug} {"August"}

MACRO {sep} {"September"}

MACRO {oct} {"October"}

MACRO {nov} {"November"}

MACRO {dec} {"December"}

READ

FUNCTION {sortify}
{ purify$
  "l" change.case$
}

INTEGERS { len }

FUNCTION {chop.word}
{ 's :=
  'len :=
  s #1 len substring$ =
    { s len #1 + global.max$ substring$ }
    's
  if$
}

INTEGERS { et.al.char.used }

FUNCTION {initialize.et.al.char.used}
{ #0 'et.al.char.used :=
}

EXECUTE {initialize.et.al.char.used}

FUNCTION {format.lab.names}
{ 's :=
  s num.names$ 'numnames :=
  numnames #1 >
    { numnames #4 >
	{ #3 'namesleft := }
	{ numnames 'namesleft := }
      if$
      #1 'nameptr :=
      ""
	{ namesleft #0 > }
	{ nameptr numnames =
	    { s nameptr "{ff }{vv }{ll}{ jj}" format.name$ "others" =
		{ "{\etalchar{+}}" *
		  #1 'et.al.char.used :=
		}
		{ s nameptr "{v{}}{l{}}" format.name$ * }
	      if$
	    }
	    { s nameptr "{v{}}{l{}}" format.name$ * }
	  if$
	  nameptr #1 + 'nameptr :=
	  namesleft #1 - 'namesleft :=
	}
      while$
      numnames #4 >
	{ "{\etalchar{+}}" *
	  #1 'et.al.char.used :=
	}
	'skip$
      if$
    }
    { s #1 "{v{}}{l{}}" format.name$
      duplicate$ text.length$ #2 <
	{ pop$ s #1 "{ll}" format.name$ #3 text.prefix$ }
	'skip$
      if$
    }
  if$
}

FUNCTION {author.key.label}
{ author empty$
    { key empty$
	{ cite$ #1 #3 substring$ }
	{ key #3 text.prefix$ }
      if$
    }
    { author format.lab.names }
  if$
}

FUNCTION {author.editor.key.label}
{ author empty$
    { editor empty$
	{ key empty$
	    { cite$ #1 #3 substring$ }
	    { key #3 text.prefix$ }
	  if$
	}
	{ editor format.lab.names }
      if$
    }
    { author format.lab.names }
  if$
}

FUNCTION {author.key.organization.label}
{ author empty$
    { key empty$
	{ organization empty$
	    { cite$ #1 #3 substring$ }
	    { "The " #4 organization chop.word #3 text.prefix$ }
	  if$
	}
	{ key #3 text.prefix$ }
      if$
    }
    { author format.lab.names }
  if$
}

FUNCTION {editor.key.organization.label}
{ editor empty$
    { key empty$
	{ organization empty$
	    { cite$ #1 #3 substring$ }
	    { "The " #4 organization chop.word #3 text.prefix$ }
	  if$
	}
	{ key #3 text.prefix$ }
      if$
    }
    { editor format.lab.names }
  if$
}

FUNCTION {calc.label}
{ type$ "book" =
  type$ "inbook" =
  or
    'author.editor.key.label
    { type$ "proceedings" =
	'editor.key.organization.label
	{ type$ "manual" =
	    'author.key.organization.label
	    'author.key.label
	  if$
	}
      if$
    }
  if$
  duplicate$
  year field.or.null purify$ #-1 #2 substring$
  *
  'label :=
  year field.or.null purify$ #-1 #4 substring$
  *
  sortify 'sort.label :=
}

FUNCTION {sort.format.names}
{ 's :=
  #1 'nameptr :=
  ""
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    { nameptr #1 >
	{ "   " * }
	'skip$
      if$
      s nameptr "{vv{ } }{ll{ }}{  ff{ }}{  jj{ }}" format.name$ 't :=
      nameptr numnames = t "others" = and
	{ "et al" * }
	{ t sortify * }
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {sort.format.title}
{ 't :=
  "A " #2
    "An " #3
      "The " #4 t chop.word
    chop.word
  chop.word
  sortify
  #1 global.max$ substring$
}

FUNCTION {author.sort}
{ author empty$
    { key empty$
	{ "to sort, need author or key in " cite$ * warning$
	  ""
	}
	{ key sortify }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {author.editor.sort}
{ author empty$
    { editor empty$
	{ key empty$
	    { "to sort, need author, editor, or key in " cite$ * warning$
	      ""
	    }
	    { key sortify }
	  if$
	}
	{ editor sort.format.names }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {author.organization.sort}
{ author empty$
    { organization empty$
	{ key empty$
	    { "to sort, need author, organization, or key in " cite$ * warning$
	      ""
	    }
	    { key sortify }
	  if$
	}
	{ "The " #4 organization chop.word sortify }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {editor.organization.sort}
{ editor empty$
    { organization empty$
	{ key empty$
	    { "to sort, need editor, organization, or key in " cite$ * warning$
	      ""
	    }
	    { key sortify }
	  if$
	}
	{ "The " #4 organization chop.word sortify }
      if$
    }
    { editor sort.format.names }
  if$
}

FUNCTION {presort}
{ calc.label
  sort.label
  "    "
  *
  type$ "book" =
  type$ "inbook" =
  or
    'author.editor.sort
    { type$ "proceedings" =
	'editor.organization.sort
	{ type$ "manual" =
	    'author.organization.sort
	    'author.sort
	  if$
	}
      if$
    }
  if$
  *
  "    "
  *
  year field.or.null sortify
  *
  "    "
  *
  title field.or.null
  sort.format.title
  *
  #1 entry.max$ substring$
  'sort.key$ :=
}

ITERATE {presort}

SORT

STRINGS {
  longest.label last.sort.label next.extra prev.author this.author
}

INTEGERS { longest.label.width last.extra.num }

FUNCTION {initialize.longest.label}
{ "" 'longest.label :=
  #0 int.to.chr$ 'last.sort.label :=
  "" 'next.extra :=
  #0 'longest.label.width :=
  #0 'last.extra.num :=
  "abcxyz" 'prev.author :=
  "" 'this.author :=
}

FUNCTION {forward.pass}
{ last.sort.label sort.label =
    { last.extra.num #1 + 'last.extra.num :=
      last.extra.num int.to.chr$ 'extra.label :=
    }
    { "a" chr.to.int$ 'last.extra.num :=
      "" 'extra.label :=
      sort.label 'last.sort.label :=
    }
  if$
  author empty$ { editor empty$ { "" } 'editor if$ } 'author if$
  'this.author :=
  this.author prev.author =
    { "\bysame" 'bysame := }
    { "" 'bysame :=
      this.author "" =
        { "abcxyz" }
        'this.author
      if$
      'prev.author :=
    }
  if$
}

FUNCTION {reverse.pass}
{ next.extra "b" =
    { "a" 'extra.label := }
    'skip$
  if$
  label extra.label * 'label :=
  label width$ longest.label.width >
    { label 'longest.label :=
      label width$ 'longest.label.width :=
    }
    'skip$
  if$
  extra.label 'next.extra :=
}

EXECUTE {initialize.longest.label}

ITERATE {forward.pass}

REVERSE {reverse.pass}

FUNCTION {begin.bib}
{ et.al.char.used
    { "\newcommand{\etalchar}[1]{$^{#1}$}" write$ newline$ }
    'skip$
  if$
  preamble$ empty$
    'skip$
    { preamble$ write$ newline$ }
  if$
  "\providecommand{\bysame}{\leavevmode\hbox to3em{\hrulefill}\thinspace}"
    write$ newline$
  "\providecommand{\MR}{\relax\ifhmode\unskip\space\fi MR }"
    write$ newline$
  "% \MRhref is called by the amsart/book/proc definition of \MR."
    write$ newline$
  "\providecommand{\MRhref}[2]{%"
    write$ newline$
  "  \href{http://www.ams.org/mathscinet-getitem?mr=#1}{#2}"
    write$ newline$
  "}"
    write$ newline$
  "\providecommand{\href}[2]{#2}"
    write$ newline$
  "\begin{thebibliography}{"  longest.label  * "}" *
    write$ newline$
}

EXECUTE {begin.bib}

EXECUTE {init.state.consts}

ITERATE {call.type$}

FUNCTION {end.bib}
{ newline$
  "\end{thebibliography}" write$ newline$
}

EXECUTE {end.bib}
%% \CharacterTable
%%  {Upper-case    \A\B\C\D\E\F\G\H\I\J\K\L\M\N\O\P\Q\R\S\T\U\V\W\X\Y\Z
%%   Lower-case    \a\b\c\d\e\f\g\h\i\j\k\l\m\n\o\p\q\r\s\t\u\v\w\x\y\z
%%   Digits        \0\1\2\3\4\5\6\7\8\9
%%   Exclamation   \!     Double quote  \"     Hash (number) \#
%%   Dollar        \$     Percent       \%     Ampersand     \&
%%   Acute accent  \'     Left paren    \(     Right paren   \)
%%   Asterisk      \*     Plus          \+     Comma         \,
%%   Minus         \-     Point         \.     Solidus       \/
%%   Colon         \:     Semicolon     \;     Less than     \<
%%   Equals        \=     Greater than  \>     Question mark \?
%%   Commercial at \@     Left bracket  \[     Backslash     \\
%%   Right bracket \]     Circumflex    \^     Underscore    \_
%%   Grave accent  \`     Left brace    \{     Vertical bar  \|
%%   Right brace   \}     Tilde         \~}
